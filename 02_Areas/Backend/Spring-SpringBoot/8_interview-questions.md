# Spring & Spring Boot Interview Questions — Quick Reference

> 60 questions covering mid-level to senior concepts. Each answer references the detailed notes for deep understanding. Curated for a 5+ year experienced full-stack developer targeting top product-based companies.

---

## Spring Core & IoC

### 1. What is Inversion of Control (IoC) and Dependency Injection (DI)?
**One-liner:** IoC transfers object creation/lifecycle from your code to a container. DI is the mechanism — the container injects dependencies through constructors, setters, or fields. Instead of `new MySQLRepo()`, you declare `OrderRepository repo` and the container provides it.
📖 [Detailed notes](1_spring-core-and-ioc.md#why-spring-exists)

### 2. Why is constructor injection preferred over field injection?
**One-liner:** Constructor injection allows `final` fields (immutability), makes dependencies explicit, fails fast at startup if missing, and is easy to unit test. Field injection hides dependencies, can't use `final`, and requires reflection to test.
| Constructor | Field |
|------------|-------|
| `final` fields ✅ | Not possible ❌ |
| Visible in constructor ✅ | Hidden ❌ |
| Test without Spring ✅ | Needs reflection ❌ |
📖 [Detailed notes](1_spring-core-and-ioc.md#dependency-injection--three-styles)

### 3. What is the difference between `@Component`, `@Service`, `@Repository`, `@Controller`?
**One-liner:** All register beans via component scanning. `@Component` is generic. `@Service` marks business logic (semantic). `@Repository` marks data access (adds exception translation). `@Controller`/`@RestController` marks web handlers. Using the right one makes architecture visible.
📖 [Detailed notes](1_spring-core-and-ioc.md#stereotype-annotations)

### 4. Explain the bean lifecycle in Spring.
**One-liner:** Instantiate → Inject dependencies → Aware interfaces → `BeanPostProcessor.beforeInit()` → `@PostConstruct` → `BeanPostProcessor.afterInit()` (AOP proxies created) → READY. Shutdown: `@PreDestroy` → destroy. Use `@PostConstruct` for init (cache warming), `@PreDestroy` for cleanup.
📖 [Detailed notes](1_spring-core-and-ioc.md#bean-lifecycle)

### 5. What are bean scopes? What is the default?
**One-liner:** Default is `singleton` (one instance per container). Others: `prototype` (new per injection), `request` (per HTTP request), `session` (per HTTP session). Prototype beans in singleton beans need `ObjectProvider` or `@Lookup` to avoid stale references.
📖 [Detailed notes](1_spring-core-and-ioc.md#bean-scopes)

### 6. What is `@Configuration` and how does it differ from `@Component` for `@Bean` methods?
**One-liner:** `@Configuration` creates a CGLIB proxy. Inter-`@Bean` method calls return the existing singleton. `@Component` doesn't proxy — calls create NEW instances, silently breaking singleton contract. Always use `@Configuration` for classes with related `@Bean` methods.
📖 [Detailed notes](1_spring-core-and-ioc.md#how-configuration-works-internally)

### 7. How do you handle circular dependencies?
**One-liner:** Best: redesign to break the cycle (extract shared logic). Quick fix: `@Lazy` on one dependency (injects a proxy, resolved on first use). Setter injection also works but masks the design issue. Circular deps are always a design smell.
📖 [Detailed notes](1_spring-core-and-ioc.md#circular-dependencies)

### 8. How do Spring profiles work?
**One-liner:** Profiles activate environment-specific beans and config. Set via `spring.profiles.active=dev`. `@Profile("dev")` beans only created when dev is active. Profile-specific YAML files (`application-dev.yml`) override base config.
📖 [Detailed notes](1_spring-core-and-ioc.md#profiles-and-conditional-beans)

### 9. How does Spring's event system work?
**One-liner:** Publish events via `ApplicationEventPublisher.publishEvent()`. Listen with `@EventListener` methods. Decouples components — publisher doesn't know about listeners. Use `@Async @EventListener` for non-blocking event handling.
📖 [Detailed notes](1_spring-core-and-ioc.md#event-system)

---

## Spring Boot

### 10. What is Spring Boot and how does it differ from Spring Framework?
**One-liner:** Spring Boot = Spring Framework + auto-configuration + embedded server + starters + Actuator. It eliminates boilerplate config by auto-configuring beans based on classpath dependencies. Spring Boot uses Spring internally.
📖 [Detailed notes](2_spring-boot-fundamentals.md#why-spring-boot-exists)

### 11. How does auto-configuration work?
**One-liner:** Reads `AutoConfiguration.imports` listing config classes. Each has `@Conditional` annotations (`@ConditionalOnClass`, `@ConditionalOnMissingBean`). If conditions match AND user hasn't defined their own bean → creates default. User beans always win.
📖 [Detailed notes](2_spring-boot-fundamentals.md#auto-configuration--how-the-magic-works)

### 12. What does `@SpringBootApplication` include?
**One-liner:** Three annotations: `@Configuration` (this is a config class), `@EnableAutoConfiguration` (trigger auto-config), `@ComponentScan` (scan this package and sub-packages for beans).
📖 [Detailed notes](2_spring-boot-fundamentals.md#springbootapplication--the-entry-point)

### 13. What are Spring Boot Starters?
**One-liner:** Curated dependency sets bringing compatible versions of everything for a feature. `starter-web` = Tomcat + MVC + Jackson. `starter-data-jpa` = Hibernate + HikariCP. They contain no code — just dependency declarations.
📖 [Detailed notes](2_spring-boot-fundamentals.md#starters--curated-dependency-sets)

### 14. How does externalized configuration work? What is the priority order?
**One-liner:** CLI args > system props > env vars > profile-specific YAML > base YAML > defaults. Higher priority overrides lower. Use `@ConfigurationProperties` for type-safe, validated, IDE-supported config binding.
📖 [Detailed notes](2_spring-boot-fundamentals.md#external-configuration-hierarchy-highest-priority-first)

### 15. What is Spring Boot Actuator?
**One-liner:** Production monitoring endpoints: `/health` (app status + DB connectivity), `/metrics` (JVM, HTTP, custom), `/info` (build metadata), `/loggers` (runtime log level changes), `/beans` (bean inventory). Secure sensitive endpoints in production.
📖 [Detailed notes](2_spring-boot-fundamentals.md#actuator--production-monitoring)

### 16. Why use `@ConfigurationProperties` over `@Value`?
**One-liner:** Type-safe binding, IDE auto-completion, validation (`@Validated`), structured/hierarchical, relaxed binding (kebab-case/camelCase/underscore), and testable. `@Value` is fragile — just a string key, no validation, no structure.
📖 [Detailed notes](2_spring-boot-fundamentals.md#type-safe-configuration-configurationproperties)

---

## REST API & Web MVC

### 17. Explain the request lifecycle in Spring MVC.
**One-liner:** Request → Filters → DispatcherServlet (front controller) → HandlerMapping (find method) → Interceptors preHandle → ArgumentResolvers → Controller → ReturnValueHandlers (→ JSON via Jackson) → Interceptors postHandle → Response through Filters.
📖 [Detailed notes](3_rest-api-and-web-mvc.md#request-lifecycle--the-complete-flow)

### 18. `@Controller` vs `@RestController`?
**One-liner:** `@Controller` returns view names (templates). `@RestController` = `@Controller` + `@ResponseBody` — every return value is serialized to JSON/XML directly. Use `@Controller` for MVC + HTML, `@RestController` for REST APIs.
📖 [Detailed notes](3_rest-api-and-web-mvc.md#request-data-binding-annotations)

### 19. How does request validation work?
**One-liner:** `@Valid @RequestBody` triggers Jakarta Bean Validation before the controller method runs. If validation fails → `MethodArgumentNotValidException` → 400 response. Handle in `@RestControllerAdvice` with field-level error details.
📖 [Detailed notes](3_rest-api-and-web-mvc.md#validation)

### 20. How do you implement global exception handling?
**One-liner:** `@RestControllerAdvice` + `@ExceptionHandler` methods per exception type. Return consistent error response shape (code, message, details). Specific handlers for validation (400), not-found (404), business errors (409), catch-all (500). Log stack trace for 500s.
📖 [Detailed notes](3_rest-api-and-web-mvc.md#global-exception-handling)

### 21. Why should you use DTOs instead of exposing entities?
**One-liner:** Entities expose sensitive fields (passwordHash), trigger lazy loading (N+1), couple API to DB schema, and can't be versioned independently. DTOs control shape, protect internals, prevent over-fetching, and decouple API from persistence.
📖 [Detailed notes](3_rest-api-and-web-mvc.md#request--response-dtos)

### 22. Filter vs Interceptor — what's the difference?
**One-liner:** Filters are Servlet-level (before DispatcherServlet, all requests including static). Interceptors are Spring MVC-level (after DispatcherServlet, only controller requests). Interceptors can access handler method info; Filters cannot.
📖 [Detailed notes](3_rest-api-and-web-mvc.md#filter-vs-interceptor)

---

## Spring Data & JPA

### 23. What is the N+1 problem? How do you solve it?
**One-liner:** Loading N parents + lazy-loading each parent's children = 1+N queries (should be 1-2). Solutions: (1) `@EntityGraph` (ad-hoc eager fetch), (2) `JOIN FETCH` in JPQL, (3) `default_batch_fetch_size`, (4) DTO projections (best for read-only).
📖 [Detailed notes](4_spring-data-and-jpa.md#the-n1-problem--the-1-jpa-performance-killer)

### 24. How does `@Transactional` work internally?
**One-liner:** Spring creates an AOP proxy. Proxy begins transaction before method, commits on success, rolls back on RuntimeException. Pitfalls: internal calls bypass proxy (no transaction), checked exceptions don't rollback by default (`rollbackFor = Exception.class`).
📖 [Detailed notes](4_spring-data-and-jpa.md#how-transactional-works-internally)

### 25. Explain entity states in JPA.
**One-liner:** Transient (new, unmanaged), Managed (attached to persistence context, dirty-checked automatically), Detached (disconnected after transaction/clear), Removed (marked for DELETE). No `save()` needed for managed entity updates — dirty checking handles it.
📖 [Detailed notes](4_spring-data-and-jpa.md#entity-lifecycle-persistence-context)

### 26. `FetchType.LAZY` vs `EAGER` — which to use?
**One-liner:** Always LAZY. EAGER loads associations immediately (often causing N+1). LAZY loads on access (proxy). Fetch explicitly with `@EntityGraph` or `JOIN FETCH` when needed. `@ManyToOne` defaults to EAGER — change it.
📖 [Detailed notes](4_spring-data-and-jpa.md#relationship-defaults--best-practices)

### 27. How do you size a database connection pool?
**One-liner:** Formula: `(CPU cores × 2) + spindle count`. For most apps: 10–20 connections. More ≠ better (context switching). Monitor pool metrics via HikariCP + Actuator. Set `connection-timeout` and `leak-detection-threshold`.
📖 [Detailed notes](4_spring-data-and-jpa.md#connection-pooling--hikaricp)

### 28. What are transaction propagation types?
**One-liner:** `REQUIRED` (default — join or create new), `REQUIRES_NEW` (suspend current, create new), `SUPPORTS` (use if exists, else none), `MANDATORY` (must exist, throw if not). Use `REQUIRES_NEW` for audit logging that must persist even if the outer transaction rolls back.
📖 [Detailed notes](4_spring-data-and-jpa.md#propagation-types)

### 29. How do derived query methods work in Spring Data?
**One-liner:** Spring parses method names and generates SQL. `findByStatusAndCreatedAtAfter(Status s, LocalDateTime d)` → `SELECT * FROM entity WHERE status = ? AND created_at > ?`. Supports `Containing`, `OrderBy`, `Top`, `Between`, and pagination.
📖 [Detailed notes](4_spring-data-and-jpa.md#derived-query-methods)

---

## Spring Security

### 30. How does the Spring Security filter chain work?
**One-liner:** Every request passes through ~15 security filters. Key: CorsFilter → CsrfFilter → AuthenticationFilter (extract/validate credentials) → ExceptionTranslationFilter (auth exceptions → 401/403) → AuthorizationFilter (check permissions). Filters execute in order; rejection stops the chain.
📖 [Detailed notes](5_spring-security.md#how-spring-security-works--the-big-picture)

### 31. Explain JWT authentication flow in Spring.
**One-liner:** Login: credentials → AuthenticationManager → verify → JwtService generates signed token → returns token. Requests: JwtFilter extracts Bearer token → validates signature/expiry → loads UserDetails → sets SecurityContextHolder → request proceeds. Stateless — no server session.
📖 [Detailed notes](5_spring-security.md#jwt-authentication--stateless-api-security)

### 32. Authentication vs Authorization?
**One-liner:** Authentication = "Who are you?" (login, JWT validation → 401 if failed). Authorization = "What can you do?" (role/permission check → 403 if denied). Authentication via AuthenticationManager; Authorization via `authorizeHttpRequests()` and `@PreAuthorize`.
📖 [Detailed notes](5_spring-security.md#authorization--what-can-you-do)

### 33. When should CSRF be enabled vs disabled?
**One-liner:** Disable for stateless REST APIs with JWT in Authorization header — browsers don't auto-send custom headers. Enable for cookie-based auth — cookies ARE auto-sent, making CSRF attacks possible.
📖 [Detailed notes](5_spring-security.md#csrf-protection)

### 34. How do you implement method-level security?
**One-liner:** Enable with `@EnableMethodSecurity`. Use `@PreAuthorize("hasRole('ADMIN')")` before methods. Supports SpEL: `@PreAuthorize("#id == authentication.principal.id")` for ownership checks. `@PostAuthorize` checks AFTER method execution.
📖 [Detailed notes](5_spring-security.md#method-level-security)

### 35. What is the refresh token pattern?
**One-liner:** Access token (short-lived, 15 min) in Authorization header. Refresh token (long-lived, 7 days) stored in DB/httpOnly cookie. Access expires → client uses refresh token to get new access token. Refresh tokens are revocable (check DB on use).
📖 [Detailed notes](5_spring-security.md#refresh-token-pattern)

---

## Testing

### 36. `@Mock` vs `@MockBean` — what's the difference?
**One-liner:** `@Mock` (Mockito) creates isolated mocks — no Spring context (unit tests). `@MockBean` (Spring Boot) creates a mock AND replaces the bean in the ApplicationContext (integration tests). Use `@Mock` for unit tests, `@MockBean` for `@WebMvcTest`/`@SpringBootTest`.
📖 [Detailed notes](6_testing-and-best-practices.md#interview-perspective)

### 37. What are test slices?
**One-liner:** Annotations that boot partial Spring context. `@WebMvcTest` loads controllers only. `@DataJpaTest` loads JPA/repos only. `@JsonTest` loads Jackson only. Faster than `@SpringBootTest` and focused on one layer. Mock other layers with `@MockBean`.
📖 [Detailed notes](6_testing-and-best-practices.md#test-slice-summary)

### 38. How do you test a REST controller?
**One-liner:** `@WebMvcTest(Controller.class)` + `MockMvc`. Mock services with `@MockBean`. Use `mockMvc.perform(get/post)` to simulate HTTP. Assert with `status().isOk()`, `jsonPath("$.name")`, and `content().json()`. Test success, validation, not-found, and auth.
📖 [Detailed notes](6_testing-and-best-practices.md#webmvctest--controller-layer-only)

### 39. How do you test with a real database?
**One-liner:** Testcontainers — spins up real PostgreSQL/MySQL in Docker. `@Container` + `@DynamicPropertySource` for dynamic datasource config. Catches DB-specific issues H2 misses. Container lifecycle managed automatically.
📖 [Detailed notes](6_testing-and-best-practices.md#testing-with-testcontainers)

---

## Microservices & Advanced

### 40. When should you use microservices vs monolith?
**One-liner:** Start with modular monolith. Extract when you need: independent deployment, independent scaling, team autonomy, or fault isolation. Premature microservices = distributed monolith = worst of both worlds.
📖 [Detailed notes](7_microservices-and-advanced.md#monolith-vs-microservices)

### 41. What is a circuit breaker?
**One-liner:** Prevents cascading failures. Three states: CLOSED (normal, track failures), OPEN (all requests fail immediately with fallback), HALF-OPEN (test recovery with limited requests). Without circuit breakers, one failing service takes down the entire system.
📖 [Detailed notes](7_microservices-and-advanced.md#circuit-breaker-resilience4j)

### 42. How does an API Gateway work?
**One-liner:** Single entry point for all clients. Routes by path to correct service, handles auth (validate JWT once), rate limiting, CORS, load balancing (via service discovery), and circuit breaking. Clients call one URL — gateway routes internally.
📖 [Detailed notes](7_microservices-and-advanced.md#api-gateway-spring-cloud-gateway)

### 43. Synchronous vs asynchronous inter-service communication?
**One-liner:** Sync (REST/gRPC) — caller waits, tight coupling, use for queries needing immediate response. Async (RabbitMQ/Kafka) — fire-and-forget, loose coupling, use for events and eventual consistency. Prefer async for resilience.
📖 [Detailed notes](7_microservices-and-advanced.md#synchronous-vs-asynchronous)

### 44. How do you handle distributed transactions?
**One-liner:** Saga pattern — sequence of local transactions with compensating actions on failure. Choreography (events trigger next step) or Orchestration (central coordinator). Avoid 2PC — slow and creates tight coupling.
📖 [Detailed notes](7_microservices-and-advanced.md#interview-perspective)

### 45. How does service discovery work?
**One-liner:** Services register themselves with a registry (Eureka) on startup and heartbeat every 30s. Callers lookup by service name, load balancer picks an instance. Eliminates hardcoded URLs. `@LoadBalanced RestTemplate` resolves service names automatically.
📖 [Detailed notes](7_microservices-and-advanced.md#service-discovery-eureka)

---

## Cross-Cutting Concerns

### 46. How does Spring AOP work?
**One-liner:** AOP (Aspect-Oriented Programming) separates cross-cutting concerns (logging, security, transactions) from business logic. Spring creates proxies around beans. `@Aspect` classes define pointcuts (where) and advice (what to do — before, after, around). `@Transactional` and `@Cacheable` are built-in AOP features.

### 47. What is the difference between JDK dynamic proxy and CGLIB proxy?
**One-liner:** JDK proxy requires an interface — creates a proxy implementing the interface. CGLIB creates a subclass of the target class (no interface needed). Spring Boot defaults to CGLIB (`proxyTargetClass=true`). AOP, `@Transactional`, and `@Cacheable` all use proxying.

### 48. What is `@Async` and how do you use it?
**One-liner:** Marks a method to run on a separate thread (from a configured `TaskExecutor`). Requires `@EnableAsync`. Returns `void` or `CompletableFuture<T>`. Doesn't work on self-calls (same proxy limitation as `@Transactional`). Always configure a custom executor — default is unbounded.

### 49. How do you handle database migrations in Spring Boot?
**One-liner:** Use Flyway or Liquibase. Version-controlled migration files (`V1__create_users.sql`, `V2__add_email_column.sql`). Applied automatically on startup. Track applied migrations in a metadata table. Never modify existing migrations — create new ones.

### 50. What is the `@Scheduled` annotation?
**One-liner:** Runs methods on a schedule. `@Scheduled(fixedRate = 5000)` runs every 5s. `@Scheduled(cron = "0 0 * * * *")` runs hourly. Requires `@EnableScheduling`. Runs on a single thread by default — configure a pool for concurrent tasks.

---

## Architecture & Design

### 51. What is the typical layered architecture in Spring Boot?
```
Controller Layer   ← HTTP handling, validation, DTOs
     │
Service Layer      ← Business logic, orchestration, transactions
     │
Repository Layer   ← Data access, queries, persistence
     │
Database
```
Each layer depends only on the layer below. Controllers never access repositories directly. Services are the transaction boundary.

### 52. How do you structure a Spring Boot project?
**One-liner:** Package by feature (not by layer). `com.myapp.user` contains UserController, UserService, UserRepository, User entity, UserDTO — all related to user feature. Better cohesion than `com.myapp.controller`, `com.myapp.service`.

### 53. How do you implement API versioning?
**One-liner:** URL path versioning is most common: `/api/v1/users`, `/api/v2/users`. Alternatives: header versioning (`Accept: application/vnd.myapp.v2+json`), query param (`?version=2`). URL is simplest and most visible.

### 54. What is the Open Session in View (OSIV) anti-pattern?
**One-liner:** OSIV keeps the Hibernate session open through view rendering, allowing lazy loading in controllers/views. Problem: holds database connections much longer than needed → connection pool exhaustion under load. Disable: `spring.jpa.open-in-view=false`. Load data eagerly in the service layer instead.

### 55. How do you handle environment-specific secrets?
**One-liner:** Never commit secrets. Use: environment variables (`${DB_PASSWORD}`), Spring Cloud Config Server (centralized), AWS Secrets Manager/Vault (production). Profile-specific property files for non-sensitive env config. `.env` files for local development (gitignored).

---

## Performance & Production

### 56. How do you optimize Spring Boot application startup?
**One-liner:** Lazy bean initialization (`spring.main.lazy-initialization=true`), exclude unused auto-configurations, use Spring Boot's Class Data Sharing (CDS), minimize component scanning scope, use Virtual Threads for I/O-heavy apps. Profile startup with `spring.application.startup` Actuator endpoint.

### 57. How do you implement rate limiting in Spring Boot?
**One-liner:** In API Gateway: Spring Cloud Gateway + Redis-based `RequestRateLimiter`. In single app: Resilience4j `@RateLimiter` or Bucket4j. Apply stricter limits to auth endpoints. Use Redis for distributed rate limiting across instances.

### 58. How do you monitor a Spring Boot app in production?
**One-liner:** Actuator endpoints (`/health`, `/metrics`) + Prometheus (scrape metrics) + Grafana (dashboards). Structured logging (JSON) with correlation IDs. Distributed tracing (Micrometer + Zipkin/Jaeger). Alert on: error rate, response time P99, heap usage, connection pool saturation.

### 59. What is graceful shutdown in Spring Boot?
**One-liner:** `server.shutdown=graceful` stops accepting new requests, finishes in-flight requests (within `spring.lifecycle.timeout-per-shutdown-phase=30s`), closes DB connections, then exits. Prevents dropped requests during deployment.

### 60. How do you handle logging in Spring Boot?
**One-liner:** SLF4J facade + Logback (default). Configure in `logback-spring.xml` or `application.yml`. Use MDC (Mapped Diagnostic Context) for request correlation IDs. Log at appropriate levels: ERROR (action needed), WARN (unexpected but handled), INFO (key events), DEBUG (development). Never log sensitive data.
