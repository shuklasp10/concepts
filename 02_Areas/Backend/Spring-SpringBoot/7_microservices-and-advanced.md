# Microservices & Advanced Patterns

> Microservices architecture decomposes a monolith into independently deployable services, each owning its own data and business capability. Spring Cloud provides the building blocks — service discovery, API gateway, circuit breakers, distributed config, and messaging — to handle the operational complexity this architecture introduces.

---

## Monolith vs Microservices

### When to Choose Each

```
┌──────────────────────────────────┐     ┌──────────────────────────────────────────┐
│           MONOLITH                │     │            MICROSERVICES                  │
│                                  │     │                                          │
│  ┌────────────────────────────┐  │     │  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │      Single Codebase       │  │     │  │ Users  │ │ Orders │ │Payment │      │
│  │                            │  │     │  │Service │ │Service │ │Service │      │
│  │  Users + Orders + Payment  │  │     │  │  DB1   │ │  DB2   │ │  DB3   │      │
│  │  + Notifications + Reports │  │     │  └────────┘ └────────┘ └────────┘      │
│  │                            │  │     │                                          │
│  │    One Database             │  │     │  ┌────────┐ ┌────────┐                  │
│  └────────────────────────────┘  │     │  │Notif.  │ │Reports │                  │
│                                  │     │  │Service │ │Service │                  │
│  Deploy: All or nothing          │     │  └────────┘ └────────┘                  │
│  Scale:  Scale entire app        │     │                                          │
│  Failure: One bug crashes all    │     │  Deploy: Each independently              │
│                                  │     │  Scale:  Scale what needs it             │
└──────────────────────────────────┘     │  Failure: Isolated to one service        │
                                         └──────────────────────────────────────────┘
```

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| **Complexity** | Simple to develop, test, deploy | Complex infrastructure (discovery, gateway, tracing) |
| **Deployment** | All-or-nothing | Independent per service |
| **Scaling** | Scale entire app | Scale individual services |
| **Data** | Shared database | Database per service |
| **Team** | One team, one codebase | Multiple teams, service ownership |
| **Failure** | One failure crashes app | Isolated failures (with circuit breakers) |
| **Best for** | Small teams, early-stage products | Large teams, high-scale, domain complexity |

> **Key Insight:** Start with a **modular monolith** (well-separated packages with clear boundaries). Extract to microservices only when you have a concrete reason — team scaling, independent deployment needs, or performance isolation. Premature microservices = distributed monolith = worst of both worlds.

---

## Service Discovery (Eureka)

### Problem

In microservices, services are dynamic — instances come and go, IP addresses change. Hardcoding URLs (`http://192.168.1.50:8081/api/users`) fails when instances scale or restart.

### The Solution: Service Registry

```
┌─────────────────────────────────────────┐
│         Eureka Server (Registry)         │
│                                          │
│  user-service: [instance1, instance2]    │
│  order-service: [instance1]              │
│  payment-service: [instance1, instance2] │
└─────────────────────┬───────────────────┘
                      │
    ┌─────────────────┤──────────────────┐
    ▼                 ▼                  ▼
┌────────┐     ┌────────┐        ┌─────────┐
│ Users  │     │ Orders │        │ Payment │
│ :8081  │     │ :8082  │        │ :8083   │
│ :8084  │     │        │        │ :8085   │
└────────┘     └────────┘        └─────────┘

1. Each service REGISTERS itself on startup
2. Each service HEARTBEATS every 30s ("I'm alive")
3. Callers LOOKUP service by name ("user-service")
4. Load balancer picks an instance
```

```java
// Service registration (in each microservice)
@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApp { }

// Service call with load balancing
@Bean
@LoadBalanced  // Enables service name resolution
public RestTemplate restTemplate() {
    return new RestTemplate();
}

// Call by service name — not IP
restTemplate.getForObject("http://user-service/api/users/1", User.class);
// Eureka resolves "user-service" → http://192.168.1.50:8081
```

---

## API Gateway (Spring Cloud Gateway)

### Problem

Clients shouldn't call microservices directly — they'd need to know every service's URL, handle auth separately per service, and manage CORS for each.

### The Solution: Single Entry Point

```
Client → API Gateway → Routes to correct service
              │
              ├── /api/users/**   → user-service
              ├── /api/orders/**  → order-service
              ├── /api/payments/** → payment-service
              │
         Handles: Authentication, Rate Limiting, CORS, Logging
```

```yaml
# application.yml for API Gateway
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service       # lb:// = load-balanced via Eureka
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=0
            
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - AddRequestHeader=X-Gateway, true
            - name: CircuitBreaker
              args:
                name: orderCB
                fallbackUri: forward:/fallback/orders
```

### Gateway Responsibilities

| Responsibility | Implementation |
|---------------|---------------|
| **Routing** | Route predicates (path, header, method) |
| **Authentication** | Global filter validates JWT, sets user context |
| **Rate limiting** | Redis-based `RequestRateLimiter` filter |
| **CORS** | Centralized CORS config for all services |
| **Load balancing** | Client-side via Eureka + `lb://` |
| **Circuit breaking** | Resilience4j integration per route |
| **Request/Response transformation** | Add headers, modify body, strip prefixes |

---

## Circuit Breaker (Resilience4j)

### Problem

When service B is down, service A keeps calling it, waiting for timeouts, consuming threads, eventually failing too. This **cascading failure** takes down the entire system.

### The Solution: Circuit Breaker Pattern

```
State Machine:
                    ┌───────────────┐
        success ──►│    CLOSED      │◄── requests pass through
                   │ (normal)       │    track failure rate
                   └───────┬───────┘
                           │ failure rate > threshold
                   ┌───────▼───────┐
                   │     OPEN       │ ← ALL requests fail immediately
                   │  (tripped)     │   return fallback response
                   └───────┬───────┘   no calls to service B
                           │ wait duration expires
                   ┌───────▼───────┐
                   │  HALF-OPEN     │ ← Allow LIMITED requests through
                   │  (testing)     │   if they succeed → CLOSED
                   └───────┬───────┘   if they fail → OPEN
                           │
                     success? → CLOSED
                     failure? → OPEN
```

```java
@Service
public class OrderService {
    
    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
    @Retry(name = "paymentService")
    @TimeLimiter(name = "paymentService")
    public PaymentResponse processPayment(PaymentRequest request) {
        return paymentClient.charge(request);
    }
    
    // Fallback when circuit is OPEN or call fails
    public PaymentResponse paymentFallback(PaymentRequest request, Throwable t) {
        log.error("Payment service unavailable, queuing for later", t);
        paymentQueue.enqueue(request);  // Process later
        return new PaymentResponse("QUEUED", "Payment will be processed shortly");
    }
}
```

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        sliding-window-size: 10             # Evaluate last 10 calls
        failure-rate-threshold: 50          # Open if 50% fail
        wait-duration-in-open-state: 30s    # Stay open for 30s before half-open
        permitted-number-of-calls-in-half-open-state: 3
  retry:
    instances:
      paymentService:
        max-attempts: 3
        wait-duration: 500ms
  timelimiter:
    instances:
      paymentService:
        timeout-duration: 3s
```

---

## Inter-Service Communication

### Synchronous (REST / gRPC)

```java
// OpenFeign — declarative HTTP client
@FeignClient(name = "user-service")
public interface UserClient {
    
    @GetMapping("/api/users/{id}")
    UserResponse getUser(@PathVariable Long id);
    
    @PostMapping("/api/users")
    UserResponse createUser(@RequestBody CreateUserRequest request);
}

// Usage — inject like any Spring bean
@Service
public class OrderService {
    private final UserClient userClient;
    
    public Order createOrder(Long userId, OrderRequest request) {
        UserResponse user = userClient.getUser(userId);  // HTTP call
        // ...
    }
}
```

### Asynchronous (Message Queues)

```
Synchronous:  A ──request──► B ──response──► A
              (A waits for B — tight coupling)

Asynchronous: A ──message──► [Queue] ──message──► B
              (A doesn't wait — loose coupling)
              
              A publishes → moves on
              B consumes → at its own pace
              Queue buffers → handles spikes
```

```java
// Producer (with RabbitMQ / Spring AMQP)
@Service
public class OrderService {
    private final RabbitTemplate rabbitTemplate;
    
    public Order createOrder(OrderRequest request) {
        Order order = orderRepo.save(new Order(request));
        
        // Publish event — fire and forget
        rabbitTemplate.convertAndSend("order.exchange", "order.created",
            new OrderCreatedEvent(order.getId(), order.getUserId(), order.getAmount()));
        
        return order;
    }
}

// Consumer (in notification-service)
@Component
public class NotificationConsumer {
    
    @RabbitListener(queues = "notification.queue")
    public void handleOrderCreated(OrderCreatedEvent event) {
        emailService.sendOrderConfirmation(event.userId(), event.orderId());
    }
}
```

### Synchronous vs Asynchronous

| Aspect | Synchronous (REST) | Asynchronous (Queue) |
|--------|-------------------|---------------------|
| Coupling | Tight — caller waits | Loose — fire-and-forget |
| Latency | Adds to request time | No additional request latency |
| Failure handling | Caller must handle timeouts | Queue retries automatically |
| Ordering | Guaranteed (per request) | May need ordering guarantees |
| Use when | Need immediate response | Notifications, batch processing, eventual consistency |

---

## Caching with Spring Cache

```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
        // Or RedisCacheManager for distributed caching
    }
}

@Service
public class UserService {
    
    @Cacheable(value = "users", key = "#id")  // Cache result; return cached on subsequent calls
    public UserResponse findById(Long id) {
        log.info("Fetching from DB...");  // Only logged on cache MISS
        return userRepo.findById(id).map(UserResponse::from).orElseThrow();
    }
    
    @CachePut(value = "users", key = "#result.id")  // Update cache with new value
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepo.findById(id).orElseThrow();
        user.setName(request.name());
        return UserResponse.from(userRepo.save(user));
    }
    
    @CacheEvict(value = "users", key = "#id")  // Remove from cache
    public void delete(Long id) {
        userRepo.deleteById(id);
    }
    
    @CacheEvict(value = "users", allEntries = true)  // Clear entire cache
    public void clearCache() {}
}
```

### Cache Strategy

| Strategy | How | Trade-off |
|---------|-----|-----------|
| **Cache-Aside** | Check cache → miss → query DB → store in cache | Most common; stale data possible for TTL duration |
| **Write-Through** | Write to cache AND DB on every update | Always fresh; higher write latency |
| **Write-Behind** | Write to cache → async write to DB | Fast writes; risk of data loss if cache crashes |

---

## Distributed Tracing

### Problem

A single user request might traverse 5+ services. When something fails, which service caused it? Where's the bottleneck?

### The Solution: Trace ID Propagation

```
Request → Gateway → Order Service → Payment Service → Notification Service
  │         │            │               │                   │
  └── TraceID: abc123 propagated across ALL services ────────┘
  
Logs:
[abc123] Gateway: Received POST /api/orders
[abc123] OrderService: Creating order for user 42
[abc123] PaymentService: Charging $59.98
[abc123] PaymentService: Payment successful
[abc123] NotificationService: Sending confirmation email
[abc123] Gateway: Returning 201 Created (total: 450ms)
```

```yaml
# Spring Boot 3+ with Micrometer Tracing
management:
  tracing:
    sampling:
      probability: 1.0  # Sample 100% of requests (reduce in production)
```

---

## Interview Perspective

**Q: When should you use microservices vs a monolith?**

Start with a modular monolith. Migrate to microservices when you need: independent deployment for different teams, independent scaling of specific services, technology diversity, or fault isolation. Microservices add operational complexity (networking, distributed data, observability). Premature microservices create a "distributed monolith" — the complexity of microservices with none of the benefits.

**Q: What is a circuit breaker and why is it important?**

A circuit breaker prevents cascading failures when a downstream service is unavailable. It has three states: CLOSED (requests pass through normally, failures tracked), OPEN (all requests fail immediately with a fallback — no calls to the failing service), HALF-OPEN (limited requests allowed to test recovery). Without circuit breakers, one slow/failing service exhausts thread pools and takes down the entire system.

**Q: How does an API Gateway work in a microservices architecture?**

The API Gateway is a single entry point for all client requests. It handles: routing (path-based to correct service), authentication (validate JWT once), rate limiting, CORS, load balancing (via service discovery), circuit breaking, and request/response transformation. Clients interact with one URL — the gateway routes internally. Spring Cloud Gateway is the standard implementation.

**Q: How do microservices communicate?**

Synchronous: REST (OpenFeign) or gRPC — caller waits for response. Asynchronous: message queues (RabbitMQ, Kafka) — caller publishes event, consumer processes independently. Use sync for queries needing immediate response. Use async for events, notifications, and eventual consistency. Async is preferred for loose coupling and resilience.

**Q: How do you handle distributed transactions across microservices?**

The Saga pattern: break a distributed transaction into a sequence of local transactions. Each service completes its local transaction and publishes an event. If any step fails, compensating transactions undo previous steps. Two types: Choreography (events trigger next step — decoupled) and Orchestration (central coordinator directs steps — easier to manage). Avoid 2PC (two-phase commit) in microservices — it's slow and creates tight coupling.

---

## Key Takeaways

- **Start monolith, extract when needed.** Premature microservices = distributed monolith.
- **Service discovery** (Eureka) eliminates hardcoded URLs. Services register and discover dynamically.
- **API Gateway** centralizes routing, auth, rate limiting, and CORS. Clients call one endpoint.
- **Circuit breakers** (Resilience4j) prevent cascading failures. Fail fast with fallbacks when services are down.
- **Prefer async communication** (message queues) for loose coupling and resilience.
- **Saga pattern** for distributed transactions — compensating actions, not 2PC.
- **Distributed tracing** (TraceID propagation) is essential for debugging across services.
- **Caching** (`@Cacheable`) reduces database load. Use Redis for distributed caching in clustered environments.
