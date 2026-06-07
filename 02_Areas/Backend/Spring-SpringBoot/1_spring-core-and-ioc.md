# Spring Core & IoC Container

> Spring Framework is a comprehensive application framework built on one core idea: **Inversion of Control (IoC)**. Instead of your code creating and managing its dependencies, the Spring container creates them, wires them together, and manages their lifecycle. This single concept is the foundation of every Spring feature.

---

## Why Spring Exists

### Problem

In traditional Java development, classes create their own dependencies:

```java
public class OrderService {
    private final OrderRepository repo = new MySQLOrderRepository();  // Tight coupling
    private final PaymentService pay = new StripePaymentService();    // Hard to test
    private final EmailService email = new SMTPEmailService();        // Can't swap
}
```

**Problems:**
1. **Tight coupling** — `OrderService` knows exact implementation classes.
2. **Untestable** — Can't replace MySQL with an in-memory DB for testing.
3. **Inflexible** — Switching from Stripe to Razorpay requires code changes in every class that uses it.
4. **Lifecycle chaos** — Who creates these objects? Who ensures only one database connection pool exists?

### The Solution: Inversion of Control

Instead of objects creating their dependencies, a **container** creates all objects and injects dependencies into them.

```java
public class OrderService {
    private final OrderRepository repo;    // Just an interface
    private final PaymentService pay;      // Just an interface
    private final EmailService email;      // Just an interface
    
    // Dependencies INJECTED by the container
    public OrderService(OrderRepository repo, PaymentService pay, EmailService email) {
        this.repo = repo;
        this.pay = pay;
        this.email = email;
    }
}
```

Now `OrderService` doesn't know or care whether it's MySQL or PostgreSQL, Stripe or Razorpay. The container decides.

### Mental Model

Think of IoC like a **staffing agency**:
- **Without IoC:** Each department (class) hires its own employees (dependencies) directly. The marketing team buys their own computers, hires their own IT support, finds their own office space.
- **With IoC:** A central HR department (Spring container) hires everyone, assigns them to departments, provides equipment, and manages their contracts. Departments just declare what roles they need.

> **Key Insight:** "Don't call us, we'll call you." — The Hollywood Principle. Your code doesn't fetch dependencies; the container pushes them into your code.

---

## The Spring Container (ApplicationContext)

### Core Idea

> The Spring container is the runtime engine that creates, configures, and manages all your application objects (called **beans**). It reads configuration (annotations, XML, Java config) and builds a complete object graph at startup.

```
┌─────────────────────────────────────────────────────────────┐
│                   Spring IoC Container                       │
│                  (ApplicationContext)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Configuration Metadata                   │   │
│  │   @Component, @Service, @Repository, @Configuration  │   │
│  │   @Bean methods, component scanning, properties      │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Bean Definitions                        │   │
│  │   Metadata about each bean: class, scope, deps,      │   │
│  │   init/destroy methods, lazy/eager                    │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Ready-to-Use Beans                     │   │
│  │   OrderService ─── OrderRepository                    │   │
│  │        │                  │                            │   │
│  │        └── PaymentService └── DataSource               │   │
│  │                                   │                    │   │
│  │                              HikariCP Pool             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### BeanFactory vs ApplicationContext

| Feature | BeanFactory | ApplicationContext |
|---------|------------|-------------------|
| Bean creation | Lazy (on first request) | Eager (at startup — validates early) |
| AOP support | Basic | Full |
| Event publishing | ❌ | ✅ (`ApplicationEvent`) |
| i18n | ❌ | ✅ (MessageSource) |
| Environment/profiles | ❌ | ✅ |
| Use when | Lightweight/embedded (rare) | **Always** (default in Spring Boot) |

> **In practice:** You always use `ApplicationContext`. `BeanFactory` is the low-level interface that `ApplicationContext` extends.

---

## Dependency Injection — Three Styles

### 1. Constructor Injection (✅ Preferred)

```java
@Service
public class OrderService {
    private final OrderRepository orderRepo;
    private final PaymentService paymentService;
    
    // If only one constructor, @Autowired is optional (Spring 4.3+)
    public OrderService(OrderRepository orderRepo, PaymentService paymentService) {
        this.orderRepo = orderRepo;
        this.paymentService = paymentService;
    }
}
```

**Why preferred:**
- Fields can be `final` → immutable, thread-safe.
- Dependencies are explicit — you see everything in the constructor.
- Fails fast at startup if a dependency is missing.
- Easy to unit test — just pass mock implementations.

### 2. Setter Injection

```java
@Service
public class NotificationService {
    private EmailSender emailSender;
    
    @Autowired
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}
```

**When to use:** Only for optional dependencies or when you need to change a dependency at runtime (rare).

### 3. Field Injection (❌ Avoid)

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;  // BAD — can't make final, hard to test
}
```

**Why avoid:**
- Can't make fields `final`.
- Hidden dependencies — not visible in constructor.
- Hard to test without the Spring container (need reflection to set private fields).
- No way to detect circular dependencies at compile time.

### Injection Comparison

| Aspect | Constructor | Setter | Field |
|--------|------------|--------|-------|
| Immutability | ✅ `final` fields | ❌ | ❌ |
| Required deps | ✅ Fail-fast at startup | May be null | May be null |
| Testability | ✅ Just pass in constructor | OK | ❌ Needs reflection |
| Readability | ✅ All deps visible | Scattered | Hidden |
| Circular deps | ❌ Fails immediately (good!) | Works (masks design issue) | Works (masks design issue) |

---

## Bean Scopes

| Scope | Behavior | Use Case |
|-------|----------|----------|
| **singleton** (default) | ONE instance per container. Same object returned every time. | Stateless services, repositories, utilities |
| **prototype** | NEW instance every time it's requested. Container does NOT manage lifecycle. | Stateful objects, builders, each request needs fresh state |
| **request** | One instance per HTTP request (web only) | Request-scoped data, per-request logging context |
| **session** | One instance per HTTP session (web only) | Shopping carts, user preferences |
| **application** | One instance per `ServletContext` (web only) | Application-wide shared state |

```java
@Component
@Scope("prototype")
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    // Each injection point gets a NEW ShoppingCart
}
```

### The Singleton Misconception

> **Spring Singleton ≠ GoF Singleton Pattern.** Spring singleton means one instance per container (per `ApplicationContext`). GoF Singleton means one instance per JVM (enforced by the class itself). You can have multiple Spring containers in one JVM, each with its own "singleton" instance.

### The Prototype-in-Singleton Problem

```java
@Service  // Singleton
public class OrderService {
    @Autowired
    private ShoppingCart cart;  // Prototype? NO — injected ONCE at OrderService creation!
    // Every request uses the SAME cart instance — BUG!
}

// Solution 1: ObjectProvider (lazy lookup)
@Service
public class OrderService {
    private final ObjectProvider<ShoppingCart> cartProvider;
    
    public void processOrder() {
        ShoppingCart cart = cartProvider.getObject();  // New instance each time
    }
}

// Solution 2: @Lookup method
@Service
public abstract class OrderService {
    @Lookup
    protected abstract ShoppingCart getCart();  // Spring overrides this to create prototype
}
```

---

## Stereotype Annotations

```
                    @Component          ← Base annotation (generic bean)
                   ┌─────┼──────┐
                   │     │      │
              @Service  @Repository  @Controller/@RestController
              (Business  (Data       (Web layer — handles HTTP)
               logic)    access)
```

| Annotation | Layer | Extra Behavior |
|-----------|-------|---------------|
| `@Component` | Generic | Just registers as a bean |
| `@Service` | Business logic | None extra (semantic clarity) |
| `@Repository` | Data access | **Exception translation** — converts JDBC/JPA exceptions to Spring's `DataAccessException` |
| `@Controller` | Web (MVC) | Returns view names (HTML templates) |
| `@RestController` | Web (REST API) | `@Controller` + `@ResponseBody` — returns JSON/XML directly |

> **They all do the same core thing:** Register the class as a Spring bean via component scanning. The distinction is semantic — it makes your architecture visible at a glance.

---

## Bean Lifecycle

```
  Container starts
       │
       ▼
  ┌─────────────────────┐
  │ 1. Instantiation     │  Bean class is instantiated (constructor called)
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ 2. Populate Props    │  Dependencies injected (@Autowired, constructor args)
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ 3. BeanNameAware     │  setBeanName() — bean learns its own name
  │ 4. BeanFactoryAware  │  setBeanFactory() — bean gets container reference
  │ 5. ApplicationContext │  setApplicationContext()
  │    Aware             │
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ 6. BeanPostProcessor │  postProcessBeforeInitialization()
  │    (Before Init)     │  ← AOP proxies, validation, custom processing
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ 7. @PostConstruct    │  Custom initialization (load cache, verify config)
  │    InitializingBean  │  afterPropertiesSet()
  │    init-method       │
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ 8. BeanPostProcessor │  postProcessAfterInitialization()
  │    (After Init)      │  ← This is where AOP proxies are typically created
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ 9. BEAN IS READY     │  ← Available for use in the application
  └──────────┬──────────┘
             │
     (Container shuts down)
             │
             ▼
  ┌─────────────────────┐
  │ 10. @PreDestroy      │  Cleanup (close connections, release resources)
  │     DisposableBean   │  destroy()
  │     destroy-method   │
  └─────────────────────┘
```

### Practical Lifecycle Hooks

```java
@Service
public class CacheService {
    private Map<String, Object> cache;
    
    @PostConstruct
    public void init() {
        // Runs AFTER all dependencies are injected
        // Good for: loading initial data, warming caches, validating config
        this.cache = loadCacheFromDatabase();
        log.info("Cache warmed with {} entries", cache.size());
    }
    
    @PreDestroy
    public void cleanup() {
        // Runs BEFORE the bean is destroyed (container shutdown)
        // Good for: flushing data, closing connections, cleanup
        cache.clear();
        log.info("Cache cleared");
    }
}
```

---

## Java Configuration (`@Configuration` + `@Bean`)

### When to Use

- **Third-party classes** — You can't put `@Component` on a class you don't own.
- **Complex instantiation** — When bean creation requires conditional logic.
- **Multiple beans of same type** — Different configurations of the same class.

```java
@Configuration
public class AppConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate template = new RestTemplate();
        template.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return template;
    }
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
    
    @Bean
    @Profile("production")
    public DataSource productionDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://prod-db:5432/myapp");
        return new HikariDataSource(config);
    }
}
```

### How `@Configuration` Works Internally

`@Configuration` classes are proxied via CGLIB. When one `@Bean` method calls another `@Bean` method, the proxy intercepts and returns the **existing singleton** instead of creating a new instance.

```java
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource(config);
    }
    
    @Bean
    public JdbcTemplate jdbcTemplate() {
        // This does NOT create a second DataSource
        // CGLIB proxy intercepts and returns the singleton
        return new JdbcTemplate(dataSource());
    }
}
```

> Without `@Configuration` (using `@Component` + `@Bean`), the proxy is NOT created, and calling `dataSource()` would create a new instance each time — a subtle, dangerous bug.

---

## Component Scanning

### How It Works

```java
@SpringBootApplication  // Includes @ComponentScan for this package and below
public class MyApp { }
```

```
com.myapp                    ← @SpringBootApplication here
├── controller/              ← Scanned ✅
│   └── UserController.java
├── service/                 ← Scanned ✅
│   └── UserService.java
├── repository/              ← Scanned ✅
│   └── UserRepository.java
└── config/                  ← Scanned ✅
    └── AppConfig.java

com.other.package/           ← NOT scanned ❌ (different base package)
```

### Custom Scanning

```java
@SpringBootApplication
@ComponentScan(basePackages = {"com.myapp", "com.shared.utils"})  // Explicit packages
public class MyApp { }
```

---

## Circular Dependencies

### The Problem

```java
@Service
public class A {
    private final B b;
    public A(B b) { this.b = b; }  // Needs B
}

@Service
public class B {
    private final A a;
    public B(A a) { this.a = a; }  // Needs A → CIRCULAR!
}
// Spring Boot throws BeanCurrentlyInCreationException at startup
```

### Solutions

1. **Redesign** (best) — Extract shared logic into a third class.
2. **`@Lazy`** — Injects a proxy; resolves the real bean on first use.
3. **Setter injection** — Allows the container to create both beans first, inject later (masks the problem).

```java
// @Lazy approach
@Service
public class A {
    private final B b;
    public A(@Lazy B b) { this.b = b; }  // Proxy injected, real B resolved on first call
}
```

> **Best Practice:** Circular dependencies are a design smell. They mean two classes are too tightly coupled. Refactor to break the cycle.

---

## Profiles and Conditional Beans

### Profiles

```java
// application.yml
spring:
  profiles:
    active: dev

---
# application-dev.yml
server:
  port: 8080
logging:
  level.root: DEBUG

---
# application-prod.yml
server:
  port: 80
logging:
  level.root: WARN
```

```java
@Bean
@Profile("dev")
public DataSource devDataSource() {
    return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).build();
}

@Bean
@Profile("prod")
public DataSource prodDataSource() {
    return new HikariDataSource(productionConfig);
}
```

### `@Conditional` — Fine-Grained Control

```java
@Bean
@ConditionalOnProperty(name = "feature.cache.enabled", havingValue = "true")
public CacheManager cacheManager() {
    return new RedisCacheManager(...);
}

@Bean
@ConditionalOnMissingBean(CacheManager.class)  // Only if no CacheManager exists
public CacheManager defaultCacheManager() {
    return new ConcurrentMapCacheManager();
}
```

---

## Event System

### Publishing and Listening to Events

```java
// Define event
public class OrderCreatedEvent {
    private final Order order;
    public OrderCreatedEvent(Order order) { this.order = order; }
    public Order getOrder() { return order; }
}

// Publish event
@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;
    
    public Order createOrder(OrderRequest req) {
        Order order = orderRepo.save(new Order(req));
        publisher.publishEvent(new OrderCreatedEvent(order));  // Fire-and-forget
        return order;
    }
}

// Listen to event — decoupled from OrderService
@Component
public class InventoryListener {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        inventoryService.reserve(event.getOrder().getItems());
    }
}

@Component
public class NotificationListener {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        emailService.sendConfirmation(event.getOrder().getCustomerEmail());
    }
}

// Async event listener — runs on a separate thread
@Component
public class AnalyticsListener {
    @Async
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        analyticsService.track("order_created", event.getOrder().getId());
    }
}
```

> **Why events?** They decouple components. `OrderService` doesn't know about inventory, notifications, or analytics. Each concern is a separate listener. Adding/removing features doesn't modify `OrderService`.

---

## Interview Perspective

**Q: What is Inversion of Control (IoC) and Dependency Injection (DI)?**

IoC is a design principle where the control of object creation and lifecycle is transferred from your code to a container/framework. DI is the specific technique used to achieve IoC — the container "injects" dependencies into objects through constructors, setters, or fields. Instead of `new MySQLRepo()`, you declare `OrderRepository repo` and the container provides the implementation.

**Q: What is the difference between `@Component`, `@Service`, `@Repository`, and `@Controller`?**

All register a class as a Spring bean via component scanning. The difference is semantic and layered: `@Component` is the generic base. `@Service` marks business logic (no extra behavior). `@Repository` marks data access (adds exception translation to `DataAccessException`). `@Controller`/`@RestController` marks web handlers. Using the right stereotype makes architecture visible and enables layer-specific features.

**Q: Explain the bean lifecycle in Spring.**

Instantiate → Inject dependencies → Aware interfaces (BeanNameAware, etc.) → `BeanPostProcessor.beforeInit()` → `@PostConstruct` / `InitializingBean.afterPropertiesSet()` → `BeanPostProcessor.afterInit()` (AOP proxies created here) → Bean is READY. On shutdown: `@PreDestroy` → `DisposableBean.destroy()`. Key hooks: `@PostConstruct` for initialization (cache warming), `@PreDestroy` for cleanup (close connections).

**Q: Why is constructor injection preferred over field injection?**

Constructor injection allows `final` fields (immutability), makes dependencies explicit (visible in constructor), fails fast at startup if a dependency is missing, and is easy to test (just pass mocks to the constructor). Field injection hides dependencies, can't use `final`, requires reflection for testing, and masks circular dependencies.

**Q: What is the difference between `@Configuration` and `@Component` for defining `@Bean` methods?**

`@Configuration` creates a CGLIB proxy. When one `@Bean` method calls another, the proxy returns the existing singleton. `@Component` doesn't proxy — calling another `@Bean` method creates a NEW instance, silently breaking the singleton contract. Always use `@Configuration` for classes with `@Bean` methods that reference each other.

**Q: How do Spring profiles work?**

Profiles allow environment-specific bean registration and configuration. Activate via `spring.profiles.active=dev`. Beans annotated with `@Profile("dev")` are only created when the "dev" profile is active. Profile-specific properties files (`application-dev.yml`) override the base `application.yml`.

---

## Key Takeaways

- **IoC/DI** = Container creates and wires objects. Your code declares what it needs, not how to build it.
- **Constructor injection** is the only correct choice for required dependencies. Field injection is an anti-pattern.
- **Singleton** is the default scope. Prototype beans in singleton beans require `ObjectProvider` or `@Lookup`.
- **`@Configuration`** creates proxied classes — `@Bean` method calls return singletons. `@Component` does NOT.
- **Bean lifecycle:** `@PostConstruct` for init, `@PreDestroy` for cleanup, `BeanPostProcessor` for cross-cutting (AOP).
- **Circular dependencies** are a design smell. Refactor to break cycles.
- **Events** decouple components — publish/subscribe instead of direct method calls.
- **Profiles** activate environment-specific beans and config (`dev`, `test`, `prod`).
