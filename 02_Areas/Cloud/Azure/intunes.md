## Microsoft Endpoint Manager
* Microsoft Intune
* Configuration Manager
* Co-Management
* Windows Autopilot
* Endpoint Manager Admin Center

## Microsoft Intune capabilities

## Intune and Entra Id relationship
* MDM Authority
* Intune manage device only registered on Entra

## Entra ID
* __Create Tenant:__ Azure -> Choose Subscription
* __Create New User:__ Entra -> Add -> User -> Create New User -> Select location
* __Create Group:__ Entra -> Add -> Group: _Static, Dynamic User, Dynamic Device_
* __Assign Roles:__ Entra -> Manage -> Roles and Administrator
* __Activate License:__ Entra -> Manage -> Licenses -> All Products -> Try/Buy: _Select license to activate on tenant_ 
* __Assign License:__ Entra -> Manage -> Licenses -> All Products -> Select a license -> Assign: _user or group_
* __Assign custom domain__ Entra -> Manage -> Custom Domain Name
* __Customize logon page:__ Entra -> Manage -> Company Branding

## Intune manager
![Alt text](image.png)
* __Device Enrollment:__ Intune -> Enrollement
* __Enrollement Restriction:__
    * __Intune Restriction:__ 
        * Intune -> Devices -> Enrollment -> Device Platform restriction
        * Intune -> Devices -> Enrollment -> Device limit restriction
    * __Entra Id Restriction:__
        * Entra -> Devices -> Devices Setting
* __Company Portal Customization:__ Intune -> Tenant Administration -> Customization
* __Terms & Condition:__ Intune -> Tenant Administration -> Terms and Conditions
* __MDM Authority:__
* __Device Categories:__ Intune -> Devices -> Device categories

## Windows

* __windows enrollment:__ Intune -> Devices -> Windows -> Windows Enrollment -> Automatic Enrollement
    ![Alt text](image-1.png)
    * Device must be joined to Entra
    * User must have intune license
    * __Entra Registered:__ BYOD devices with two account personal and work
    * __Entra Joined:__ Devices fully managed by intune
    * __Entra Hybrid:__ Joined to Entra Id and Local AD
    ![Alt text](image-2.png)

* __Compliance Policies:__ 
    * Checks (monitor) configuration before or post enrollment
    * Only compliance should be set user based
    * Intune -> Devices -> Windows -> Compliance Policies
        * Device health
            * Require Bitlocker
            * Require SecureBoot
            * Require Code Integrity
        * Device properties
            * Operating System versions
    * Intune -> Devices -> Windows -> Configure Profiles

* __Configuration Profiles:__
    * Apply settings to intune devices
    * Should be set device based
    * __Profile Type__
        * __Setting catalogue__ granular
        * __Template__

*  __Scripts__
    * Upload scripts and run on targeted devices
* __Update rings for windows__
    * Set windows update cycle and restriction

## Apps
lob - line of business application
win32 applications - applications that needs pacakaging - Intune format is supported
Store managed application
Web links - shortcut of browser based application
this needs to be done by someting 
