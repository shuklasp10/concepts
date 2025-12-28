---
tags: [cloud, azure, az-204, app-service, configure-app-service]
---

# Module 1: Azure App Services

<details>
  <summary><strong>Index</strong></summary>

  <details>
    <summary><a href="#introduction">Introduction</a></summary>

  - [Feature](#feature)
  - [Limitations](#limitations)

  </details>

  <details>
    <summary><a href="#azure-service-plans">Azure Service Plans</a></summary>

  - [Components of Azure Service Plans](#components-of-azure-service-plans)
  - [App run & Scale-out](#app-run--scale-out)

  </details>

  <details>
    <summary><a href="#deployment-to-app-service">Deployment to App service</a></summary>

  - [Automated Deployment](#automated-deployment)
  - [Manual Deploymemnt](#manual-deploymemnt)
  - [Deployment slots](#deployment-slots)
  - [Sidecar conatiners](#sidecar-conatiners)

  </details>

  <details>
    <summary><a href="#authentication--authorization-in-app-service">Authentication & Authorization in App Service</a></summary>
  </details>


  <details>
    <summary><a href="#app-service-networking">App service Networking</a></summary>

  - [Inbound Features](#inbound-features)
  - [Outbound Features](#outbound-features)
  - [Find outbound IPs](#find-outbound-ips)

  </details>

</details>

## Introduction
- A PaaS service to simplify __deployment and scaling__ of:
  1. Web Apps
  2. Mobile Backends
  3. Rest APIs
- __Language Support:__  .NET, Java (Java SE, Tomcat, JBoss), Node.js, Python, or PHP
- __OS Support:__ Windows & Linux

> 💡 To get supported languages and their version in linux:
>
>```bash
> az webapp list-runtimes --os-type linux
> ```

### Feature

1. __Auto scale support:__ Scale up/down or out/in based on usage
2. __Container support:__ Support images from private Azure Container Registry or Docker Hub
3. __CI/CD support:__  Support Azure DevOps Services, GitHub, Bitbucket, FTP, or a local Git repository on your development machine
4. __Deployment slots:__ Multiple swappable slots(QA, Dev, Stage) available other than Prod

### Limitations

1. Linux App service is not supported on Shared pricing tier.
2. Portal shows only features supported in linux app.
    > Initially App service was launched in windows, as they ported to linux they incrementally added feature in UI to prevent configuration errors. 
3. When we just upload the code to App service, it will be stores in Azure storage and then a built-in container will run that causing latency issue while accessing from Azure storage, instead we can create custom image and upload in container filesystem to reduce latency.

---

## Azure Service Plans

- Defines set of computing resources required to run web app.
- Multiple web app can run on same set of computing resources, i.e. in same Azure service plan.

### Components of Azure Service Plans

Each plan defines:
1. __Operating system:__ windows or linux
2. __Region:__ West US or East US etc
3. __Number of VM Instances__
4. __Size of VM Instances:__ P1V3, P2V3, based on pricing tiers
5. __Pricing tier:__ 
   1. Free
   2. Shared
   3. Basic
   4. Standard
   5. Premium
   6. PremiumV2
   7. PremiumV3
   8. IsolatedV2

__Free__ & __Shared__ runs app on same Azure VM as other App Services including app of other customers. Also resources does not scale out. _[Use for development & testing purpose only]_

__Isolated__ & __IsolatedV2__ runs on dedicated VM instance like other but also provide dedicated Azure virtual network. It gives maximum scale-out capabilities.

### App run & Scale-out

- An App will run on all configured VM instances, is 5 apps running in same Azure plan service then all those 5 app will run on all VM Instance
- Multiple deployment slot configured for an app will also run on all instances
- If diagnostic logs, perform backups, or run WebJobs enabled then they will also share allocated VM instaces 
- Pricing tiers can be changed any time.
- Apps can be moved from one Azure service plan to another.

---

## Deployment to App service

### Automated Deployment

This process is used to push out new features and fixes in fast and repetative pattern.
1. __Azure Devops Service:__ Push code in devops and build in cloud
2. __Github:__ Support automated deployment on any change in production branch.
3. __Bitbucket:__ Less used but supported

### Manual Deploymemnt

1. __Git:__ App service provide a git url which can be used as remote repository. Pushing to remote repo will deploy the app.
2. __CLI:__ Below feature of Azure CLI can be used to build and deploy app as well as create new App service web app.
    ```bash
    az webapp up
    ```
3. __Zip deploy;__ CURL or HTTP utility can be used to send zip file of app to App service.
4. __FTP/S:__ traditional way of pushing code to many environment including App service.
   
> 💡 `Kudu` is used for git and zip based deployments. It handled file syncing and  deployment triggers.

### Deployment slots

Deployment slots should be used to deploy to stage and swap to minimize downtime.

1. __Deploy Code:__ if slots have dedicated branches like qa, stage, test then those branches should be continously deployed.
2. __Deploy Container:__ In case of custom container, automating deployment of image from Azure container registry or other is complex and include below steps:
   1. Build an image and tag with git commit Id, timestamp, or other identifiable info.
   2. Push image in container registry.
   3. Update the deployment slot in App service with new image tag and it will pull from container registry.
  
### Sidecar conatiners

Sidecare container contains extra independent service like monitoring, logging, networking services

Upto __9__ sidecar container can be added to __Sidecar-enabled custom containers__.

---

## Authentication & Authorization in App Service

Optional built-in authenticaiton & authorization feature for Web apps, Mobile backend, Rest APIs and Azure functions.

Provide other integration like Microsoft Entra ID, Facebook, Google, X

When Enabled:
  - Use App service allocated VM for processing
  - Authenticate user with specified identity provider before reaching to app
  - Validate, store and refresh OAuth tokens provided by identity provider
  - Manages the authenticated sessions
  - Injects identity information to HTTP request

It can be configured using ARMs or config file

[Know more about identity provider and their endpoints](https://learn.microsoft.com/en-in/training/modules/introduction-to-azure-app-service/5-authentication-authorization-app-service)

---

## App service Networking

Azure App service provide features based on Inbound (request coming to app) & Outbound (request from app)

### Inbound Features

Controls how other service access the app in App service

1. __App Service Environment:__ Provide dedicated netwok isolated from public internet. It's most secure and most expensive.
2. __IP Restrictions:__ List of allowed IPs and block all other.
3. __Service endpoints:__ 
4. __Private endpoints:__ Provides private IP address in own virtual network, it can be accessed from that private network only with assigned IP.
  
### Outbound Features

Controls how app access to other services

1. __VNet integration:__ allows app to reach reosources within its own Azure Virtual Network. Only available for Standard, Premium and Isolated tiers.
   > __Requirements:__ Dedicated subnet with atleast 32 addresses (/27 CIDR block) available. For scaling /26 is recommended.
2. __Hybrid connections:__ Provide secure tunnel to reach resources outside Azure like on-prem database.

### Find outbound IPs

1. __Using portal:__ Click on `properties` on left-hand navigation of app.
2. __using CLI:__
    ```bash
    # Current outbound IPs used by app
    az webapp show \
      --resource-group <group_name> \
      --name <app_name> \ 
      --query outboundIpAddresses \
      --output tsv

    # Possible oubound IPs can be used by app regardless of pricing tiers
    az webapp show \
      --resource-group <group_name> \ 
      --name <app_name> \ 
      --query possibleOutboundIpAddresses \
      --output tsv
    ```

---

## Configure Web App

### Configure App Settings

It contains `environment variables` for the app in App Service.
It is injected when app starts and everytime environment variable changes app restarts

__Connection String__ are different than App settings. They contains database credentials.It is loaded with special prefixes (e.g., SQLCONNSTR_)

![App setting web page](Assets/image.png)

__Deployement slot setting:__  
`Non-Sticky settings` _(default)_ are those which are swapped during slot swapping. If stage is swapped to production then its variables also moves.  
`Sticky settings` these are configured for specific slots only. Swapping slots does not move sticky settings.

![Deployment slot app settings](Assets/image1.png)

__Accessing Setting in code:__  
- C# / .NET: `Configuration["MySetting"]`
- Python: `os.environ.get('MySetting')`
- Node.js: `process.env.MySetting`
- Java: `System.getenv("MySetting")`

>💡 There are two ways to store App Settings
> 1. __Direct entry__ to the App Service configuration.
> 2. __Azure Key Vault__ _(Recommended)_ store variables in key vault and use pointer in App Service Settings. `@Microsoft.KeyVault(SecretUri=...)`

__Adding keys:__  
1. __Azure Portal:__ For small changes like adding/modifying one or two keys.
2. __JSON Array:__ Use `Advanced Edit` button and upload JSON in below format.
      ```JSON
    [
        {
          "name": "<key-1>",
          "value": "<value-1>",
          "slotSetting": false
        },
        {
          "name": "<key-2>",
          "value": "<value-2>",
          "slotSetting": false
        },
    ...
    ]
    ```
3. __Azure CLI:__ Use below command to update keys through Azure CLI.
      ```bash 
      az webapp config appsettings set \
        --name <app-name> \
        --resource-group <resource-group-name> \
        --settings MySetting=123
    ```

### Configure General Settings

- Controls platform & runtime options; __some settings require higher pricing tiers (Standard/Premium)__.
 
  ![App service configuration window](Assets/image3.png)

- __Stack settings:__ language/runtime and (Linux/custom containers) optional *start-up command/file*.

  ![App service stack setting window](Assets/image4.png)

- __Platform settings:__
  - __Platform bitness:__ 32-bit or 64-bit _(Windows only)_.
  - __FTP state:__ disable or allow only FTPS _(recommended)_.
  - __HTTP version:__ set to __2.0__ to enable HTTP/2 (note: HTTP/2 typically used over TLS).
  - __WebSockets:__ enable for SignalR or socket.io.
  - __Always On:__ keeps the app loaded and prevents cold starts; __required__ for continuous or CRON WebJobs.
  - __ARR affinity:__ sticky sessions for stateful apps; set __Off__ for stateless applications.
  - __HTTPS Only:__ redirect all HTTP traffic to HTTPS.
  - __Minimum TLS version:__ enforce TLS baseline for client connections.

- __Debugging:__ remote debugging available for ASP.NET / ASP.NET Core / Node.js (auto-disabled after 48 hours).

- __Incoming client certificates:__ enable for TLS mutual (client) authentication when required.

__CLI examples:__  
```bash
az webapp config set \
  --resource-group <resource-group> \
  --name <app-name> \
  --always-on true
```

```bash
az webapp update \
  --resource-group <resource-group> \
  --name <app-name> \
  --set httpsOnly=true
```

> 💡 __Tip:__ Enable __HTTPS Only__ + set a secure __Minimum TLS version__ for production; prefer __FTPS__ or disable FTP to reduce attack surface.

__Exam tips:__  
- Know that __Always On__ is required for continuous WebJobs.  
- HTTP/2 benefits require TLS — secure custom domain to get HTTP/2 in browsers.  
- Be familiar with Portal path (Configuration → General settings) and CLI equivalents (`az webapp config set`, `az webapp update`).


### Configure Path Mappings

> __Windows App Service Only__ — Path mappings (virtual directories + handler mappings) are __IIS features__ unavailable on Linux App Service.

__Mental Model:__ Path mapping redirects URL requests → physical folders or script handlers at the IIS level.

#### Path Mapping Types

| Feature | Maps | IIS Level | Effect |
|---------|------|-----------|--------|
| __Virtual Directory__ | URL path `/api` | Virtual directory | Routes to physical folder (local or UNC path) |
| __Handler Mapping__ | File extension `.php`, `.svc` | HTTP handler | Executes with specific processor/DLL |

#### Virtual Directories

- __Root path__ `/` → Points to `<root app path>` (default).
- __Non-root alias__ `/images` → Points to separate physical path (e.g., `D:\shared-images`).
- Can map to __UNC paths__ (network shares on other servers) or __local drives__.
- Request internally served from mapped directory; __NOT a redirect__.
- Example: GET `https://app.azurewebsites.net/images/photo.jpg` → serves from `D:\shared-images\photo.jpg`.

#### Handler Mappings

Routes file types to IIS modules or external processes:
- __Request path:__ File pattern (e.g., `*.php`, `*.svc`) or exact filename.
- __Executable:__ Full path to processor (e.g., `C:\PHP\php-cgi.exe`, `System.ServiceModel.Activation.HttpModule`).
- __Module:__ IIS module name (e.g., `FastCgiModule`, `IsapiModule`, `StaticFile`).
- __Entry Point (optional):__ Class/method for managed handlers.
- __Precondition:__ Applies handler only if file exists on disk (`skipIfFileNotFound`).
- __Access Permission:__ Handler inherits folder NTFS permissions.

#### Portal Configuration Path

__App Service__ → __Settings__ → __Configuration__ → __Path mappings__ tab.

#### CLI / ARM Template
- __No dedicated CLI command__ for path mappings.
- Configure via __Azure Portal__ or __ARM template__ `virtualApplications` property (Windows plans only).

```bash
# Example: ARM template syntax (Windows only)
"config": {
  "virtualApplications": [
    {
      "virtualPath": "/",
      "physicalPath": "site\\wwwroot"
    },
    {
      "virtualPath": "/static",
      "physicalPath": "D:\\shared\\static"
    }
  ]
}
```

#### Troubleshooting Checklist

| Symptom | Check |
|---------|-------|
| __404 on virtual directory__ | 1. Physical path exists 2. App Service identity has __Read__ permission 3. Path not typo'd |
| __Handler not executing__ | 1. Executable path correct 2. `.exe` has __Execute__ permission 3. App logs for process errors |
| __500 errors with handler__ | 1. Handler process crashed → Check __Application Event Log__ 2. Incorrect __Entry Point__ for managed handlers |
| __Works locally, fails in Azure__ | 1. Windows vs Linux plan (path mappings Windows-only) 2. Drive letter changed (e.g., `C:\` → `D:\`) |

#### Exam Hacks

- __If question mentions:__ "Map URL `/api` to folder" → __Virtual Directory__.
- __If question mentions:__ "Run `.php` files with engine" → __Handler Mapping__.
- __Don't confuse:__ Path mappings ≠ Application routes ≠ VNet integration.
- __Sticky setting:__ Path mappings __persist across slot swaps__ (tied to IIS config, not slot-specific).
- __Windows-only feature:__ Linux App Service uses __Application settings__ + entry point; no path mappings.

### Enable Diagnostic logging

> **Quick focus:** concise, exam-ready notes for [[Enable diagnostic logging]] — features, limitations, CLI fast-path, and exam hacks. ✅

#### Executive summary

| Feature | Key constraint | Use case |
|---|---:|---|
| **[[Application logging]]** | Filesystem (Windows) is temporary (auto-off ~12 hrs); Blob requires storage account & container | App-generated messages (Critical/Error/Warning/Info/Debug/Trace) — short-term debugging (filesystem) vs long-term retention (blob) |
| **[[Web server logging]]** | Windows only for full W3C logs; choose File System or Azure Storage blobs | Capture raw HTTP request data (method, URI, IP, user-agent, response code) |
| **[[Detailed error messages]]** | Windows only; stored in file system; avoid serving in production | Saves complete HTML error pages for troubleshooting |
| **[[Failed request tracing]]** | Windows only; generates folder per failed request | Deep IIS-level traces for failed requests (XML + XSL) |
| **Deployment logging** | Automatic, no config | Diagnose failed deployments |

---

#### Hard numbers & storage notes ⚠️

- Filesystem application logging (Windows) is intended for temporary debugging and **turns itself off after ~12 hours**. 
- Log files live under `d:/home/LogFiles` (Windows) / `/home/LogFiles` (Linux containers). Use the ZIP endpoints to download logs per instance.
- When using [[Azure Storage blobs]] for logging, **regenerating storage keys requires toggling logging off/on** to reset configuration.

---

#### CLI fast-path 🔧

- Enable logging (example):
```bash
# Why: configure app logging and storage/server logging
az webapp log config --name <app> --resource-group <rg> --application-logging filesystem --web-server-logging filesystem
```
- Stream logs live:
```bash
# Why: live tail of app logs
az webapp log tail --name <app> --resource-group <rg>
```
- Download logs:
```text
# Linux/container: https://<app-name>.scm.azurewebsites.net/api/logs/docker/zip
# Windows: https://<app-name>.scm.azurewebsites.net/api/dump
```

---

#### Decision matrix — Filesystem vs Blob 📊

- **Filesystem**: quick access, useful for immediate debugging, limited retention, not suitable for long-term analytics.
- **Blob**: long-term retention, requires storage account & container, more durable and centralizable for analysis (Log Analytics onward).

---

#### Add log messages / examples

- C# example:
```csharp
// Why: writes an error to App Service application logs
System.Diagnostics.Trace.TraceError("If you're seeing this, something bad happened");
```
- Python: use [[OpenCensus]] / standard logging to send messages to application diagnostics.

---

#### Stream & access logs

- To stream in the portal: **Log stream** blade under your App Service.
- CLI streaming: `az webapp log tail` (see above).
- ZIP download endpoints for per-instance logs (see above).
- Note: some log types buffer writes → stream order can be out-of-order.

---

#### Exam hacks 💡

- If the question asks **how to persist logs long-term** → answer: **Azure Storage blobs** (needs storage container & keys).
- If a Windows app asks **where W3C HTTP details are found** → answer: **Web server logging** (W3C format).
- If keys are regenerated and blob logging breaks → **toggle logging off/on** to refresh keys.
- If immediate short-term debugging is needed → **Filesystem** (remember ~12-hour auto-off on Windows).

---

#### Mental model (1 line)

Logs = app + server messages written to `[[/LogFiles]]` or [[Azure Storage blobs]]; stream via **Log stream** or `az webapp log tail`.

### Configure Security settings

> **Quick focus:** exam-ready notes for [[Configure security certificates]] — private vs managed vs Key Vault, upload/import rules, and exam hacks. 🔐

#### Executive summary

| Feature | Key constraint | Use case |
|---|---:|---|
| **[[Free App Service managed certificate]]** | No wildcard, not exportable, not for ASE, DigiCert issuer (may require CAA `0 issue digicert.com`) | Quick, free TLS for custom domain; auto-renewed every ~6 months (renewal starts 45 days before expiry) |
| **[[App Service Certificate (purchase)]]** | Managed by Azure in Key Vault; supports export/renew/management | Purchase + automated lifecycle; supports more flexibility than free managed cert |
| **[[Import from Azure Key Vault]]** | Key Vault + proper access & sync required | Use existing Key Vault-managed certs and centralize lifecycle management |
| **[[Upload private certificate (PFX)]]** | PFX must be password-protected, triple-DES encrypted, private key ≥2048 bits, include full chain, EKU for server auth | Bring-your-own certificate from third-party CAs; bind to custom domain TLS/SSL bindings |

#### Hard numbers & requirements ⚠️

- PFX must be **password-protected** and encrypted with **triple DES**.
- Private key length: **≥ 2048 bits**.
- Certificate must include **full chain** (intermediates + root) and **EKU = server authentication (OID 1.3.6.1.5.5.7.3.1)** for TLS bindings.
- Free managed certificates are **auto-renewed every ~6 months**, renewal starts **~45 days** before expiry.
- To create TLS bindings or enable client certs, the **App Service plan must be Basic or higher**.

#### CLI fast-path 🔧

- Create a free managed certificate for a hostname (most common quick task):
```bash
# Why: create a free App Service managed certificate for a custom hostname
az webapp config ssl create --resource-group <rg> --name <app> --hostname <host.example.com>
```

#### Decision matrix — free managed vs purchased vs import 📊

- **Free managed**: fastest, auto-managed, limited (no wildcard, not exportable, not supported in ASE).
- **Purchased App Service Certificate**: Azure handles purchase, verification, Key Vault storage, renewal; supports export and advanced management.
- **Import from Key Vault / Upload PFX**: full control, supports wildcard and exports (if allowed), but you manage key security and renewals.

#### Importing & binding notes

- Certificates uploaded to an app are stored in the resource group's region webspace and are accessible to other apps in the same resource group & region.
- If you buy an App Service Certificate in Azure, Azure can **manage purchase, domain verification, store the cert in Key Vault, and synchronize** copies to App Service apps.
- Free managed certificates may require a **CAA DNS record** (`0 issue digicert.com`) for some domains.

#### Exam hacks 💡

- If question: **need wildcard support** → answer: **use a purchased or third-party wildcard cert** (free managed does NOT support wildcard).
- If question: **need to export or use the private key elsewhere** → answer: **upload a PFX or purchase/exportable App Service Certificate** (free managed is not exportable).
- If question: **certificate not renewing or invalid after storage key changes** → verify Key Vault sync / binding and DNS CAA records; toggle/import as needed.
- If question: **what shapes TLS bindings requirement** → answer: **App Service plan Basic+**.

#### Mental model (1 line)

Certificates = identity blobs (private keys + chains) stored per **webspace** (resource group + region) and bound to hostnames; choose free-managed for simplicity, purchase/import for control.

---