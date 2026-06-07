# Design Patterns & Best Practices

> Design patterns are reusable solutions to common software design problems. They are not code to copy-paste — they are proven strategies for structuring code that is maintainable, extensible, and loosely coupled. Knowing WHEN to apply a pattern (and when NOT to) is what separates a senior engineer from someone who just memorizes names.

---

## Why Design Patterns Matter

### Mental Model

Design patterns are like **architectural blueprints**. When an architect designs a building, they don't invent staircases from scratch — they pick a staircase pattern (spiral, straight, L-shaped) based on the building's constraints. Similarly, design patterns give you a shared vocabulary and battle-tested structure for recurring problems.

### The Three Categories

| Category | Purpose | Examples |
|----------|---------|---------|
| **Creational** | How objects are created | Singleton, Factory, Builder, Prototype |
| **Structural** | How objects are composed/related | Adapter, Decorator, Proxy, Facade |
| **Behavioral** | How objects communicate/interact | Strategy, Observer, Template Method, Iterator |

---

## Creational Patterns

### Singleton — One Instance, Global Access

#### Problem

Some objects should exist only once — database connection pools, configuration managers, loggers. Multiple instances waste resources or cause inconsistency.

#### Implementation

```java
// Thread-safe Singleton using Enum (preferred by Joshua Bloch)
public enum DatabasePool {
    INSTANCE;
    
    private final HikariDataSource dataSource;
    
    DatabasePool() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost/db");
        this.dataSource = new HikariDataSource(config);
    }
    
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}

// Usage
Connection conn = DatabasePool.INSTANCE.getConnection();
```

**Why enum is best:**
- JVM guarantees exactly one instance.
- Thread-safe without `synchronized`.
- Serialization-safe (no duplicate instances on deserialization).
- Reflection-proof (can't create via `Constructor.newInstance()`).

#### Other Approaches (and their problems)

```java
// Lazy initialization with double-checked locking
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() {}
    
    public static Singleton getInstance() {
        if (instance == null) {                    // First check (no locking)
            synchronized (Singleton.class) {
                if (instance == null) {             // Second check (with lock)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// Bill Pugh's approach (lazy, thread-safe, no synchronization)
public class Singleton {
    private Singleton() {}
    
    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
        // Inner class is loaded only when getInstance() is first called
    }
    
    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

> **When NOT to use Singleton:** Testing becomes hard (global state). Dependency injection frameworks (Spring) manage instance lifecycle better. Singletons hide dependencies — prefer injecting the dependency explicitly.

---

### Factory Method — Delegate Object Creation

#### Problem

Client code shouldn't know or care about the concrete class being created. `new ConcreteClass()` everywhere creates tight coupling — changing the implementation requires modifying every call site.

```java
// Without Factory — client knows every concrete type
Notification n;
if (type.equals("email")) {
    n = new EmailNotification();     // Coupled to concrete class
} else if (type.equals("sms")) {
    n = new SMSNotification();       // Adding push? Modify EVERY call site
}
```

#### The Solution

```java
// The product interface
public interface Notification {
    void send(String message);
}

public class EmailNotification implements Notification {
    @Override public void send(String message) { /* SMTP logic */ }
}

public class SMSNotification implements Notification {
    @Override public void send(String message) { /* Twilio logic */ }
}

// Simple Factory (not a GoF pattern but very common)
public class NotificationFactory {
    public static Notification create(String type) {
        return switch (type) {
            case "email" -> new EmailNotification();
            case "sms"   -> new SMSNotification();
            case "push"  -> new PushNotification();  // Add here, clients unchanged
            default      -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}

// Client code — decoupled from concrete classes
Notification n = NotificationFactory.create(config.getNotificationType());
n.send("Hello");
```

#### Real-World Factory Usage in Java

```java
// Java's built-in factories
Calendar cal = Calendar.getInstance();              // Returns GregorianCalendar
NumberFormat fmt = NumberFormat.getCurrencyInstance(); // Returns DecimalFormat
List<String> list = List.of("a", "b");              // Returns ImmutableCollections$ListN
```

---

### Builder — Complex Object Construction

#### Problem

Constructors with many parameters are unreadable and error-prone. Which parameter is which? What if 5 of 10 are optional?

```java
// Telescoping constructor anti-pattern
new User("Alice", "alice@mail.com", 25, null, null, true, false, "US", null, "2024-01-01");
// What does true mean? What does false mean? Which null is which?
```

#### The Solution

```java
public class User {
    private final String name;       // Required
    private final String email;      // Required
    private final int age;           // Optional
    private final String country;    // Optional
    private final boolean active;    // Optional
    
    private User(Builder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.age = builder.age;
        this.country = builder.country;
        this.active = builder.active;
    }
    
    public static class Builder {
        // Required
        private final String name;
        private final String email;
        
        // Optional — defaults
        private int age = 0;
        private String country = "US";
        private boolean active = true;
        
        public Builder(String name, String email) {
            this.name = name;
            this.email = email;
        }
        
        public Builder age(int age) { this.age = age; return this; }
        public Builder country(String country) { this.country = country; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        
        public User build() {
            // Validate before construction
            if (name == null || name.isEmpty()) throw new IllegalStateException("Name required");
            return new User(this);
        }
    }
}

// Usage — readable, self-documenting
User user = new User.Builder("Alice", "alice@mail.com")
    .age(25)
    .country("IN")
    .build();
```

#### When to Use Builder

- Objects with 4+ constructor parameters.
- Objects with many optional fields.
- Immutable objects (all fields final, set at construction).
- Objects that need validation before creation.

> **Real-World:** `StringBuilder`, `Stream.Builder`, `HttpClient.newBuilder()`, `HttpRequest.newBuilder()`.

---

## Structural Patterns

### Adapter — Make Incompatible Interfaces Work Together

#### Problem

You have an existing class with useful functionality, but its interface doesn't match what your code expects.

```java
// Your system expects this interface
public interface PaymentProcessor {
    void processPayment(double amount, String currency);
}

// Third-party library uses a different interface
public class StripeAPI {
    public void charge(int amountInCents, String currencyCode, String apiKey) { ... }
}

// Adapter — bridges the gap
public class StripeAdapter implements PaymentProcessor {
    private final StripeAPI stripe;
    private final String apiKey;
    
    public StripeAdapter(StripeAPI stripe, String apiKey) {
        this.stripe = stripe;
        this.apiKey = apiKey;
    }
    
    @Override
    public void processPayment(double amount, String currency) {
        int cents = (int) (amount * 100);  // Convert dollars to cents
        stripe.charge(cents, currency, apiKey);
    }
}

// Client code — doesn't know about Stripe internals
PaymentProcessor processor = new StripeAdapter(new StripeAPI(), "sk_live_xxx");
processor.processPayment(29.99, "USD");
```

> **Real-World:** `Arrays.asList()` adapts an array to the `List` interface. `InputStreamReader` adapts byte stream to character stream.

---

### Decorator — Add Behavior Without Modifying the Original

#### Problem

You need to add features to an object at runtime. Subclassing every combination leads to class explosion: `BufferedCompressedEncryptedFileInputStream` is not scalable.

#### The Solution — Wrap and Delegate

```java
// Base interface
public interface DataSource {
    String readData();
    void writeData(String data);
}

// Core implementation
public class FileDataSource implements DataSource {
    private final String filename;
    public String readData() { return Files.readString(Path.of(filename)); }
    public void writeData(String data) { Files.writeString(Path.of(filename), data); }
}

// Decorator base
public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrapped;
    public DataSourceDecorator(DataSource source) { this.wrapped = source; }
    public String readData() { return wrapped.readData(); }
    public void writeData(String data) { wrapped.writeData(data); }
}

// Concrete decorators
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) { super(source); }
    
    @Override
    public String readData() {
        return decrypt(super.readData());  // Decrypt on read
    }
    
    @Override
    public void writeData(String data) {
        super.writeData(encrypt(data));    // Encrypt on write
    }
}

public class CompressionDecorator extends DataSourceDecorator { /* similar */ }

// Usage — compose at runtime
DataSource source = new FileDataSource("data.txt");
source = new CompressionDecorator(source);   // + compression
source = new EncryptionDecorator(source);    // + encryption
source.writeData("sensitive data");          // Encrypted → Compressed → Written to file
```

> **Java's classic Decorator example:** Java I/O streams. `BufferedInputStream(new FileInputStream(file))` — each wrapper adds a feature.

---

### Proxy — Control Access to an Object

#### Purpose

Intercept access to an object to add cross-cutting concerns: caching, logging, access control, lazy loading.

```java
public interface UserService {
    User findById(int id);
}

// Real service
public class UserServiceImpl implements UserService {
    public User findById(int id) {
        return database.query("SELECT * FROM users WHERE id = ?", id);
    }
}

// Caching proxy
public class CachingUserServiceProxy implements UserService {
    private final UserService delegate;
    private final Map<Integer, User> cache = new ConcurrentHashMap<>();
    
    public CachingUserServiceProxy(UserService delegate) {
        this.delegate = delegate;
    }
    
    @Override
    public User findById(int id) {
        return cache.computeIfAbsent(id, delegate::findById);
    }
}
```

> **Java's dynamic proxy:** `java.lang.reflect.Proxy` creates proxy instances at runtime. Spring uses this extensively for `@Transactional`, `@Cacheable`, AOP.

---

## Behavioral Patterns

### Strategy — Swap Algorithms at Runtime

#### Problem

You need different algorithms for the same operation, and the choice depends on context. `if/else` or `switch` blocks for selecting behavior violate the Open/Closed Principle — adding a new algorithm requires modifying existing code.

```java
// Strategy interface
public interface SortStrategy {
    <T extends Comparable<T>> void sort(List<T> data);
}

// Concrete strategies
public class QuickSort implements SortStrategy {
    @Override
    public <T extends Comparable<T>> void sort(List<T> data) { /* quick sort */ }
}

public class MergeSort implements SortStrategy {
    @Override
    public <T extends Comparable<T>> void sort(List<T> data) { /* merge sort */ }
}

// Context
public class DataProcessor {
    private SortStrategy strategy;
    
    public DataProcessor(SortStrategy strategy) {
        this.strategy = strategy;
    }
    
    public void setStrategy(SortStrategy strategy) {
        this.strategy = strategy;  // Swap at runtime
    }
    
    public void process(List<Integer> data) {
        strategy.sort(data);
        // ... more processing
    }
}

// With lambdas — Strategy becomes a functional interface
DataProcessor processor = new DataProcessor(Collections::sort);  // Strategy as lambda
```

> **Real-World:** `Comparator` is the classic Strategy pattern — `Collections.sort(list, comparator)`. Spring's `AuthenticationProvider` implementations are strategies.

---

### Observer — Event-Driven Communication

#### Problem

When one object changes state, multiple other objects need to be notified. Tight coupling between the subject and observers makes the system rigid.

```java
// Observer interface
public interface EventListener {
    void onEvent(String eventType, Object data);
}

// Subject (Event Emitter)
public class EventBus {
    private final Map<String, List<EventListener>> listeners = new ConcurrentHashMap<>();
    
    public void subscribe(String eventType, EventListener listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>()).add(listener);
    }
    
    public void unsubscribe(String eventType, EventListener listener) {
        listeners.getOrDefault(eventType, List.of()).remove(listener);
    }
    
    public void publish(String eventType, Object data) {
        listeners.getOrDefault(eventType, List.of())
                 .forEach(listener -> listener.onEvent(eventType, data));
    }
}

// Usage
EventBus bus = new EventBus();
bus.subscribe("user.created", (type, data) -> sendWelcomeEmail((User) data));
bus.subscribe("user.created", (type, data) -> createAuditLog((User) data));
bus.publish("user.created", newUser);  // Both listeners notified
```

> **Real-World:** Java's `PropertyChangeListener`, Spring's `ApplicationEventPublisher`, Servlet event listeners, UI frameworks (Swing, JavaFX).

---

### Template Method — Define Algorithm Skeleton

#### Problem

Multiple classes share the same algorithm structure but differ in specific steps.

```java
public abstract class DataExporter {
    
    // Template method — defines the algorithm skeleton
    public final void export(List<Record> records) {
        openConnection();
        String data = formatData(records);  // Varies by subclass
        writeData(data);                     // Varies by subclass
        closeConnection();
        log("Export completed");
    }
    
    private void openConnection() { /* common */ }
    private void closeConnection() { /* common */ }
    private void log(String msg) { /* common */ }
    
    // Abstract steps — subclasses provide implementation
    protected abstract String formatData(List<Record> records);
    protected abstract void writeData(String data);
}

public class CsvExporter extends DataExporter {
    @Override protected String formatData(List<Record> records) { /* CSV format */ }
    @Override protected void writeData(String data) { /* write to file */ }
}

public class JsonApiExporter extends DataExporter {
    @Override protected String formatData(List<Record> records) { /* JSON format */ }
    @Override protected void writeData(String data) { /* POST to API */ }
}
```

---

## Immutability Patterns

### Why Immutability Matters

Immutable objects are:
1. **Thread-safe** — no synchronization needed.
2. **Cache-friendly** — safe to share and reuse.
3. **Predictable** — no unexpected mutations.
4. **Hash-safe** — `hashCode()` never changes.

### Creating Immutable Classes

```java
public final class Money {  // final — can't be subclassed
    private final BigDecimal amount;   // final — set once
    private final Currency currency;   // final — set once
    
    public Money(BigDecimal amount, Currency currency) {
        this.amount = amount;
        this.currency = currency;
    }
    
    // No setters — only getters
    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }
    
    // Return NEW objects instead of modifying
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}
```

### Immutability Checklist

1. ✅ Make the class `final` (or seal it).
2. ✅ Make all fields `private final`.
3. ✅ No setters.
4. ✅ Return new objects for mutations.
5. ✅ Deep copy mutable fields in constructors and getters (defensive copying).

```java
// DEFENSIVE COPYING — critical for mutable fields
public final class Order {
    private final List<String> items;
    
    public Order(List<String> items) {
        this.items = List.copyOf(items);  // Defensive copy — caller can't mutate
    }
    
    public List<String> getItems() {
        return items;  // Already immutable via List.copyOf
    }
}
```

> **Or use Records:** `public record Money(BigDecimal amount, Currency currency) {}` — immutable by design.

---

## DTO / Entity Separation

### Why Separate?

| DTO (Data Transfer Object) | Entity (Domain Object) |
|---------------------------|----------------------|
| Shaped for the API consumer | Shaped for the database/domain |
| Contains only what the client needs | Contains all domain fields + relationships |
| Flat structure, no business logic | May have business methods, validation |
| Versioned with the API | Versioned with the schema |
| Safe to serialize/expose | May contain sensitive fields |

```java
// Entity — database representation
@Entity
public class User {
    @Id private Long id;
    private String name;
    private String email;
    private String passwordHash;  // Sensitive — never expose
    private LocalDateTime createdAt;
    @OneToMany private List<Order> orders;
}

// DTO — API response
public record UserResponse(
    Long id,
    String name,
    String email,
    int orderCount
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getOrders().size()
        );
    }
}
```

---

## Pattern Selection Guide

```
Need exactly ONE instance?                    → Singleton (or DI container scope)
Need to create objects without exposing type?  → Factory
Need complex object construction?              → Builder
Need to adapt an incompatible interface?       → Adapter
Need to add behavior dynamically?              → Decorator
Need to control/intercept access?              → Proxy
Need swappable algorithms?                     → Strategy
Need to notify multiple objects of changes?    → Observer
Need same algorithm, different steps?           → Template Method
```

---

## Interview Perspective

**Q: Explain the Singleton pattern. What are the different ways to implement it?**

Singleton ensures one instance of a class. Implementations: (1) Enum (best — JVM guarantees, serialization-safe, reflection-proof), (2) Bill Pugh holder class (lazy, thread-safe without synchronization), (3) Double-checked locking with volatile (explicit control). Problems: hard to test (global state), hidden dependencies, use DI containers instead when possible.

**Q: What is the difference between Factory and Builder patterns?**

Factory creates different TYPES of objects — it decides WHICH class to instantiate based on input. Builder constructs ONE complex object step-by-step — it handles HOW the object is configured with many parameters. Factory = "give me a Shape (Circle or Rectangle?)". Builder = "give me a Pizza (large, cheese, mushrooms, thin crust)".

**Q: How does the Strategy pattern relate to Java's functional interfaces?**

Strategy pattern traditionally requires a strategy interface with concrete implementations. With Java 8+, functional interfaces and lambdas serve the same purpose more concisely. `Comparator` is the classic Strategy interface. Instead of creating `AgeComparator`, `NameComparator` classes, you pass lambdas: `list.sort((a, b) -> a.getAge() - b.getAge())`.

**Q: Explain the Decorator pattern. Where is it used in Java's standard library?**

Decorator wraps an object to add behavior without modifying the original. It implements the same interface, delegates to the wrapped object, and adds functionality before/after delegation. Java I/O is the canonical example: `BufferedInputStream(new FileInputStream(file))` — BufferedInputStream decorates FileInputStream with buffering.

**Q: How do you make a Java class immutable?**

(1) Make class `final`, (2) all fields `private final`, (3) no setters, (4) return new objects instead of mutating, (5) defensive-copy mutable fields in constructor and getters. Or use Records (Java 16+). Immutable objects are thread-safe, cache-friendly, and hash-safe.

**Q: What is the difference between Adapter, Decorator, and Proxy patterns?**

All three wrap an object, but for different purposes. Adapter converts one interface to another (incompatible to compatible). Decorator adds new behavior to an existing interface (enhancement). Proxy controls access to the original object (caching, security, logging). Adapter changes WHAT you can do. Decorator adds to WHAT it does. Proxy controls WHETHER you can do it.

---

## Key Takeaways

- **Singleton:** Use enum or holder class pattern. Avoid in testable code — prefer DI.
- **Factory:** Decouples creation from usage. Client knows the interface, not the implementation.
- **Builder:** For complex objects with many parameters. Makes construction readable and validated.
- **Strategy:** Swap algorithms via interfaces/lambdas. Replaces if/else chains for behavior selection.
- **Observer:** Decouples event producers from consumers. Foundation of event-driven architectures.
- **Decorator:** Add behavior by wrapping. Java I/O streams are the canonical example.
- **Immutability** eliminates entire categories of bugs (threading, caching, hashing). Default to immutable.
- **DTO/Entity separation** protects domain internals and shapes data for each audience.
- **Know WHEN to use patterns.** Over-engineering with patterns is as bad as not using them. Apply when the problem genuinely matches.
