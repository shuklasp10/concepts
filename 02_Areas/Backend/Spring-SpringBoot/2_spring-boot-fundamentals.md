# Spring Boot Fundamentals

> Spring Boot is an opinionated layer on top of Spring Framework that eliminates boilerplate configuration. It auto-configures your application based on the dependencies you include, provides embedded servers, and offers production-ready features out of the box. Its philosophy: **convention over configuration**.

---

## Why Spring Boot Exists

### Problem with Plain Spring

Setting up a Spring application required massive XML or Java configuration:

```java
// Pre-Spring Boot — you had to configure EVERYTHING manually
@Configuration
@EnableWebMvc
@ComponentScan("com.myapp")
public class WebConfig implements WebMvcConfigurer {
    @Bean public ViewResolver viewResolver() { ... }
    @Bean public DataSource dataSource() { ... }
    @Bean public LocalSessionFactoryBean sessionFactory() { ... }
    @Bean public PlatformTransactionManager transactionManager() { ... }
    @Bean public ObjectMapper objectMapper() { ... }
    // 50+ more beans...
}
// Plus: web.xml, persistence.xml, external Tomcat setup, WAR packaging
```

### The Solution

Spring Boot auto-configures everything based on what's on the classpath:

```java
@SpringBootApplication  // ONE annotation. That's it.
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);  // Embedded server starts
    }
}
```

Add `spring-boot-starter-web` → Tomcat auto-configured, Jackson auto-configured, error handling auto-configured.
Add `spring-boot-starter-data-jpa` → DataSource, EntityManager, transaction manager auto-configured.

### Mental Model

Spring Boot is like a **smart home system**. Plain Spring gives you raw wires, switches, and light bulbs — you wire everything yourself. Spring Boot gives you a fully wired home where lights turn on when you walk in (auto-configuration), the thermostat adjusts automatically (sensible defaults), and you only override settings you disagree with.

---

## `@SpringBootApplication` — The Entry Point

```java
@SpringBootApplication  // Combines three annotations
public class MyApp { }
```

```
@SpringBootApplication
     ├── @SpringBootConfiguration    ← This is a @Configuration class
     │       └── @Configuration
     ├── @EnableAutoConfiguration    ← Triggers auto-configuration magic
     └── @ComponentScan              ← Scans this package + sub-packages
```

---

## Auto-Configuration — How the Magic Works

### The Mechanism

```
1. You add a dependency (e.g., spring-boot-starter-data-jpa)
       │
       ▼
2. Spring Boot checks the classpath: "Is HikariCP present? Is H2? Is PostgreSQL driver?"
       │
       ▼
3. Reads META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
   (lists all auto-configuration classes)
       │
       ▼
4. Each auto-config class has @Conditional annotations:
   @ConditionalOnClass(DataSource.class)            ← "Is this class on classpath?"
   @ConditionalOnMissingBean(DataSource.class)      ← "Did the user already define one?"
   @ConditionalOnProperty(name = "spring.datasource.url")  ← "Is this property set?"
       │
       ▼
5. If conditions match AND user hasn't defined their own → create the default bean
```

### Key Insight

> Auto-configuration NEVER overrides your explicit configuration. If you define a `DataSource` bean, Spring Boot's auto-configured DataSource **backs off** (`@ConditionalOnMissingBean`). Your beans always win.

### Seeing What Was Auto-Configured

```properties
# In application.properties — shows what was auto-configured and why
debug=true

# Or use Actuator
GET /actuator/conditions
```

---

## Starters — Curated Dependency Sets

| Starter | What It Includes |
|---------|-----------------|
| `spring-boot-starter-web` | Tomcat, Spring MVC, Jackson, Validation |
| `spring-boot-starter-data-jpa` | Hibernate, HikariCP, Spring Data JPA |
| `spring-boot-starter-security` | Spring Security, auto-config for auth |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ, MockMvc |
| `spring-boot-starter-validation` | Hibernate Validator, Jakarta Validation API |
| `spring-boot-starter-actuator` | Health checks, metrics, monitoring endpoints |
| `spring-boot-starter-cache` | Cache abstraction + default provider |

> **Starters are not code.** They are just curated `pom.xml`/`build.gradle` dependency sets that bring in compatible versions of everything you need for a feature.

---

## Configuration Properties

### External Configuration Hierarchy (Highest Priority First)

```
1. Command line arguments         (--server.port=9090)
2. Java system properties         (-Dserver.port=9090)
3. OS environment variables       (SERVER_PORT=9090)
4. application-{profile}.yml      (profile-specific)
5. application.yml                (default)
6. @PropertySource annotations    (custom files)
7. Default values                 (Spring Boot defaults)
```

Higher priority overrides lower. This means you can set defaults in `application.yml` and override in production via environment variables without changing code.

### application.yml vs application.properties

```yaml
# application.yml (YAML format — hierarchical, readable)
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: app_user
    password: ${DB_PASSWORD}  # Read from environment variable
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    open-in-view: false  # Disable OSIV (best practice)

logging:
  level:
    root: INFO
    com.myapp: DEBUG
    org.hibernate.SQL: DEBUG
```

### Type-Safe Configuration (`@ConfigurationProperties`)

```java
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(
    String host,
    int port,
    String username,
    String password,
    boolean sslEnabled
) {}

// In application.yml
app:
  mail:
    host: smtp.gmail.com
    port: 587
    username: noreply@myapp.com
    password: ${MAIL_PASSWORD}
    ssl-enabled: true
```

```java
// Enable in config
@Configuration
@EnableConfigurationProperties(MailProperties.class)
public class AppConfig {}

// Use in service
@Service
public class EmailService {
    private final MailProperties mailProps;
    
    public EmailService(MailProperties mailProps) {
        this.mailProps = mailProps;  // Type-safe, validated, IDE-supported
    }
}
```

> **Why `@ConfigurationProperties` over `@Value`?** Type-safe, IDE auto-completion, validation support (`@Validated`), structured binding, relaxed binding (kebab-case, camelCase, underscore all work), and testable.

---

## Embedded Server

Spring Boot embeds Tomcat (default), Jetty, or Undertow. No WAR deployment, no external server installation.

```
Traditional Deployment:
  Compile → Package as .war → Deploy to external Tomcat → Start Tomcat

Spring Boot:
  Compile → Package as .jar (with embedded Tomcat) → java -jar app.jar
  
  ┌────────────────────────────────┐
  │         Your App (.jar)         │
  │  ┌──────────────────────────┐  │
  │  │     Embedded Tomcat       │  │
  │  │  ┌────────────────────┐  │  │
  │  │  │  Your Controllers   │  │  │
  │  │  │  Your Services      │  │  │
  │  │  │  Your Config        │  │  │
  │  │  └────────────────────┘  │  │
  │  └──────────────────────────┘  │
  └────────────────────────────────┘
```

### Switching Servers

```xml
<!-- pom.xml: Switch from Tomcat to Undertow -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

---

## Actuator — Production Monitoring

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env,beans,conditions
  endpoint:
    health:
      show-details: when-authorized
```

### Key Endpoints

| Endpoint | Purpose |
|---------|---------|
| `/actuator/health` | App health (UP/DOWN), DB connectivity, disk space |
| `/actuator/info` | App metadata (version, git commit, build time) |
| `/actuator/metrics` | JVM metrics (memory, GC, threads, HTTP timings) |
| `/actuator/beans` | All beans in the application context |
| `/actuator/conditions` | What was auto-configured and why |
| `/actuator/env` | All configuration properties (sanitized) |
| `/actuator/loggers` | View/change log levels at runtime |

### Custom Health Indicator

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    private final DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            return Health.up()
                .withDetail("database", "PostgreSQL")
                .withDetail("pool_active", getActiveConnections())
                .build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

---

## Startup Process — What Happens When You Run `SpringApplication.run()`

```
SpringApplication.run(MyApp.class, args)
       │
       ▼
1. Create SpringApplication instance
   └── Detect web application type (SERVLET, REACTIVE, NONE)
       │
       ▼
2. Run ApplicationStartingEvent
       │
       ▼
3. Prepare Environment
   └── Load application.yml, system props, env vars
   └── Resolve profiles (dev, prod)
       │
       ▼
4. Create ApplicationContext
   └── AnnotationConfigServletWebServerApplicationContext (default)
       │
       ▼
5. Load Bean Definitions
   └── Component scanning (@Component, @Service, etc.)
   └── @Configuration classes, @Bean methods
   └── Auto-configuration classes
       │
       ▼
6. Refresh Context
   └── Create all singleton beans
   └── Wire dependencies
   └── Run BeanPostProcessors (AOP proxies)
   └── Run @PostConstruct methods
       │
       ▼
7. Start Embedded Server (Tomcat)
       │
       ▼
8. Run CommandLineRunner / ApplicationRunner beans
       │
       ▼
9. Publish ApplicationReadyEvent
       │
       ▼
   ✅ Application is ready to serve requests
```

### CommandLineRunner — Run Logic at Startup

```java
@Component
public class DataSeeder implements CommandLineRunner {
    @Override
    public void run(String... args) {
        // Runs AFTER the application is fully started
        // Good for: seeding data, loading caches, one-time setup
        if (userRepo.count() == 0) {
            userRepo.save(new User("admin", "admin@app.com"));
        }
    }
}
```

---

## DevTools — Development Productivity

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>  <!-- Not included in production JAR -->
</dependency>
```

| Feature | What It Does |
|---------|-------------|
| **Automatic restart** | Restarts app on classpath changes (fast — uses two classloaders) |
| **LiveReload** | Refreshes browser when resources change |
| **Property defaults** | Disables template caching, enables debug logging |
| **Remote debugging** | Restart/update remote apps (development only) |

---

## Interview Perspective

**Q: What is Spring Boot and how is it different from Spring Framework?**

Spring Framework provides the core IoC/DI container, MVC, data access, and other modules — but requires extensive manual configuration. Spring Boot is an opinionated layer on top that auto-configures everything based on classpath dependencies, provides embedded servers (no WAR deployment), has starter POMs for curated dependency management, and includes production-ready features (Actuator). Spring Boot uses Spring Framework internally.

**Q: How does Spring Boot auto-configuration work?**

Spring Boot reads `AutoConfiguration.imports` files listing auto-config classes. Each class has `@Conditional` annotations (`@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`) that check conditions at startup. If the condition matches and the user hasn't defined their own bean, Spring Boot creates a default. User-defined beans always win (`@ConditionalOnMissingBean`).

**Q: What is the purpose of Spring Boot Starters?**

Starters are curated dependency sets that bring in compatible versions of everything needed for a feature. `spring-boot-starter-web` includes Tomcat, Spring MVC, Jackson, Validation. They eliminate dependency management headaches and version conflicts. They contain no code — just dependency declarations.

**Q: How does externalized configuration work in Spring Boot?**

Spring Boot supports a hierarchy of configuration sources (highest priority wins): command-line args → system properties → env variables → profile-specific YAML → base YAML → defaults. This allows environment-specific configuration without code changes. `@ConfigurationProperties` provides type-safe binding with IDE support and validation.

**Q: What is Spring Boot Actuator? Why is it important?**

Actuator exposes production-ready operational endpoints: `/health` (app status, DB connectivity), `/metrics` (JVM, HTTP, custom), `/info` (build metadata), `/loggers` (runtime log level changes), `/beans` (bean inventory). Essential for monitoring, alerting, and debugging in production. Secure sensitive endpoints in production.

**Q: Explain the startup process of a Spring Boot application.**

`SpringApplication.run()` → detect app type → load environment (properties, profiles) → create `ApplicationContext` → scan components and load bean definitions → process auto-configuration → create all singleton beans and wire dependencies → start embedded server → run `CommandLineRunner` beans → publish `ApplicationReadyEvent`. The app is then ready to serve requests.

---

## Key Takeaways

- **Spring Boot = Spring Framework + auto-configuration + embedded server + production features.** It doesn't replace Spring; it wraps it.
- **Auto-configuration backs off** when you define your own beans (`@ConditionalOnMissingBean`). Your config always wins.
- **`@SpringBootApplication`** = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`.
- **Starters** are dependency sets, not code. They ensure compatible versions.
- **Externalized config** hierarchy: CLI args > env vars > YAML files. Override per environment without code changes.
- **Use `@ConfigurationProperties`** instead of `@Value` for type-safe, structured, validated configuration.
- **Actuator** is essential for production monitoring. Secure it properly.
- **Disable `spring.jpa.open-in-view`** — it keeps database connections open through view rendering, causing connection pool exhaustion.
