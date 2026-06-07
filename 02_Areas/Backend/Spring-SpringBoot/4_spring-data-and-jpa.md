# Spring Data & JPA

> Spring Data JPA eliminates boilerplate database access code by providing repository abstractions on top of JPA/Hibernate. Understanding how it works underneath — entity lifecycle, lazy loading, N+1 queries, and transaction management — is what prevents the most common production performance disasters.

---

## JPA — The Foundation

### What is JPA?

> JPA (Jakarta Persistence API) is a **specification** — a set of interfaces and annotations that define how Java objects map to database tables. It is NOT an implementation. **Hibernate** is the most popular implementation of the JPA specification.

```
Your Code
    │
    ▼
Spring Data JPA  ← Repository abstractions (derived queries, pagination)
    │
    ▼
JPA (Specification) ← @Entity, @Table, @Column, EntityManager
    │
    ▼
Hibernate (Implementation) ← Session, dirty checking, caching, SQL generation
    │
    ▼
JDBC ← Connection pooling (HikariCP), SQL execution
    │
    ▼
Database (PostgreSQL, MySQL, etc.)
```

### Mental Model

JPA is like a **translator between Java and SQL**. You speak Java (objects, fields, references), and JPA translates to SQL (tables, columns, foreign keys). You never write `INSERT INTO users (name, email) VALUES ('Alice', 'alice@mail.com')` — you write `entityManager.persist(new User("Alice", "alice@mail.com"))`.

---

## Entity Mapping

### Basic Entity

```java
@Entity
@Table(name = "users")  // Map to specific table (defaults to class name)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto-increment
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash")  // Different column name
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)  // Store enum as "ACTIVE", not 0
    private UserStatus status;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // JPA requires a no-arg constructor (can be protected)
    protected User() {}
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
        this.status = UserStatus.ACTIVE;
    }
}
```

### ID Generation Strategies

| Strategy | How | When to Use |
|---------|-----|-------------|
| `IDENTITY` | DB auto-increment | PostgreSQL `SERIAL`, MySQL `AUTO_INCREMENT`. Simple but batch inserts are slower (requires round-trip per insert). |
| `SEQUENCE` | DB sequence | PostgreSQL sequences. Best for batch performance (pre-allocates IDs). |
| `UUID` | `@GeneratedValue(strategy = GenerationType.UUID)` | Distributed systems, API-exposed IDs (non-guessable). |
| `TABLE` | Separate key table | Portable but slow. Avoid. |

---

## Relationship Mappings

### One-to-Many / Many-to-One

```java
@Entity
public class Department {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Employee> employees = new ArrayList<>();
    
    // Helper methods for bidirectional sync
    public void addEmployee(Employee emp) {
        employees.add(emp);
        emp.setDepartment(this);
    }
}

@Entity
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    
    @ManyToOne(fetch = FetchType.LAZY)  // LAZY is critical for performance
    @JoinColumn(name = "department_id")
    private Department department;
}
```

### Relationship Defaults & Best Practices

| Mapping | Default Fetch | Recommended | Why |
|---------|--------------|-------------|-----|
| `@ManyToOne` | **EAGER** | Change to **LAZY** | Eagerly loading parent for every child query is wasteful |
| `@OneToMany` | LAZY | Keep **LAZY** | Loading all children every time is N+1 disaster |
| `@OneToOne` | **EAGER** | Change to **LAZY** | Often not needed, adds extra query |
| `@ManyToMany` | LAZY | Keep **LAZY** | Can load huge datasets |

> **Golden Rule:** Always use `FetchType.LAZY`. Then fetch what you need explicitly with queries or `@EntityGraph`. Never rely on eager fetching.

### Cascade and OrphanRemoval

```java
@OneToMany(
    mappedBy = "order",
    cascade = CascadeType.ALL,      // Persist/merge/remove order → cascades to items
    orphanRemoval = true            // Remove item from list → DELETE from DB
)
private List<OrderItem> items;
```

| Option | Behavior |
|--------|----------|
| `cascade = ALL` | Save/update/delete parent → automatically save/update/delete children |
| `orphanRemoval = true` | Remove child from collection → DELETE from database |
| Neither | You must save/delete children manually |

---

## Spring Data Repositories

### Repository Hierarchy

```
Repository<T, ID>              ← Marker interface
    │
CrudRepository<T, ID>          ← save, findById, delete, existsById, count
    │
ListCrudRepository<T, ID>      ← Returns List instead of Iterable
    │
PagingAndSortingRepository     ← findAll(Pageable), findAll(Sort)
    │
JpaRepository<T, ID>           ← flush, saveAllAndFlush, batch operations
```

### Derived Query Methods

Spring Data generates SQL from method names:

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);
    
    // SELECT * FROM users WHERE status = ? AND created_at > ?
    List<User> findByStatusAndCreatedAtAfter(UserStatus status, LocalDateTime date);
    
    // SELECT * FROM users WHERE name LIKE '%keyword%'
    List<User> findByNameContainingIgnoreCase(String keyword);
    
    // SELECT COUNT(*) FROM users WHERE status = ?
    long countByStatus(UserStatus status);
    
    // SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)
    boolean existsByEmail(String email);
    
    // DELETE FROM users WHERE status = ? AND created_at < ?
    void deleteByStatusAndCreatedAtBefore(UserStatus status, LocalDateTime date);
    
    // With pagination and sorting
    Page<User> findByStatus(UserStatus status, Pageable pageable);
    
    // Top/First N results
    List<User> findTop10ByOrderByCreatedAtDesc();
}
```

### Custom Queries (`@Query`)

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // JPQL (entity-oriented, portable across databases)
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = :status")
    Optional<User> findActiveByEmail(@Param("email") String email, 
                                      @Param("status") UserStatus status);
    
    // Native SQL (database-specific, for complex queries)
    @Query(value = "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '30 days'",
           nativeQuery = true)
    List<User> findRecentUsers();
    
    // Projection — return only specific fields
    @Query("SELECT new com.myapp.dto.UserSummary(u.id, u.name, u.email) FROM User u")
    List<UserSummary> findAllSummaries();
    
    // Modifying query (UPDATE/DELETE)
    @Modifying
    @Query("UPDATE User u SET u.status = :status WHERE u.lastLoginAt < :date")
    int deactivateInactiveUsers(@Param("status") UserStatus status, 
                                @Param("date") LocalDateTime date);
}
```

---

## The N+1 Problem — The #1 JPA Performance Killer

### What Happens

```java
// Query 1: SELECT * FROM departments (fetch 100 departments)
List<Department> departments = departmentRepo.findAll();

for (Department dept : departments) {
    // Query 2..101: SELECT * FROM employees WHERE department_id = ? (for EACH department)
    System.out.println(dept.getName() + ": " + dept.getEmployees().size());
}
// Total: 1 + 100 = 101 queries! Should be 1 or 2.
```

```
N+1 Problem Visualization:

Query 1: SELECT * FROM departments                          ← 1 query
Query 2: SELECT * FROM employees WHERE department_id = 1    ← N queries
Query 3: SELECT * FROM employees WHERE department_id = 2    │
Query 4: SELECT * FROM employees WHERE department_id = 3    │
...                                                         │
Query 101: SELECT * FROM employees WHERE department_id = 100 ←┘

SHOULD be:
Query 1: SELECT * FROM departments
Query 2: SELECT * FROM employees WHERE department_id IN (1,2,3,...,100)
```

### Solutions

#### 1. `@EntityGraph` (Recommended)

```java
// Ad-hoc eager fetch for this specific query
@EntityGraph(attributePaths = {"employees"})
@Query("SELECT d FROM Department d")
List<Department> findAllWithEmployees();
// Generates: SELECT d.*, e.* FROM departments d LEFT JOIN employees e ON d.id = e.department_id
```

#### 2. `JOIN FETCH` in JPQL

```java
@Query("SELECT d FROM Department d JOIN FETCH d.employees")
List<Department> findAllWithEmployees();
```

#### 3. Batch Size Hint

```yaml
# application.yml — Hibernate batch fetching
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 20
# Instead of N individual queries, loads in batches of 20
# SELECT * FROM employees WHERE department_id IN (1,2,...,20)
# SELECT * FROM employees WHERE department_id IN (21,22,...,40)
```

#### 4. DTO Projection (Best for Read-Only)

```java
// Skip entity mapping entirely — raw DTO from query
@Query("SELECT new com.myapp.dto.DeptSummary(d.name, COUNT(e)) " +
       "FROM Department d LEFT JOIN d.employees e GROUP BY d.name")
List<DeptSummary> getDepartmentSummaries();
// Single query, no lazy loading, no N+1 possible
```

---

## Transaction Management

### `@Transactional` — The Core Annotation

```java
@Service
public class OrderService {
    
    @Transactional  // Everything in this method runs in ONE transaction
    public Order createOrder(CreateOrderRequest request) {
        Order order = new Order(request);
        orderRepo.save(order);
        
        inventoryService.reserve(request.getItems());  // Part of same transaction
        paymentService.charge(request.getPayment());   // Part of same transaction
        
        return order;
        // If ANY exception → entire transaction rolls back
        // If success → commit
    }
}
```

### How `@Transactional` Works Internally

```
Your Service Bean
       │
       ▼ (Spring creates a PROXY around your bean)
┌──────────────────────────────────┐
│      Transactional Proxy         │
│                                  │
│  1. Begin transaction            │
│  2. Call your actual method      │
│  3a. Success → COMMIT            │
│  3b. RuntimeException → ROLLBACK │
│  3c. Checked exception → COMMIT  │ ← Surprise! (must configure)
│                                  │
└──────────────────────────────────┘
```

> **Critical:** `@Transactional` works via AOP proxy. Calling a `@Transactional` method from WITHIN the same class bypasses the proxy → transaction NOT applied!

```java
@Service
public class UserService {
    
    public void registerUser(User user) {
        // This INTERNAL call bypasses the proxy — NO transaction!
        this.saveUser(user);  // ❌ @Transactional is IGNORED
    }
    
    @Transactional
    public void saveUser(User user) {
        userRepo.save(user);
    }
}
```

**Fix:** Extract the transactional method into a separate service, or inject the service into itself (`@Lazy private UserService self`).

### Transaction Configuration

```java
@Transactional(
    readOnly = true,                    // Optimization hint for read queries
    timeout = 30,                       // Seconds before timeout
    isolation = Isolation.READ_COMMITTED,
    propagation = Propagation.REQUIRED, // Default — join existing or create new
    rollbackFor = Exception.class       // Rollback on ALL exceptions (not just Runtime)
)
```

### Propagation Types

| Propagation | Behavior |
|------------|----------|
| `REQUIRED` (default) | Join existing transaction or create new one |
| `REQUIRES_NEW` | Suspend current, create a completely new transaction |
| `SUPPORTS` | Use existing transaction if present, else run without one |
| `MANDATORY` | Must run within an existing transaction (throws if none) |
| `NOT_SUPPORTED` | Suspend current transaction, run without one |
| `NEVER` | Throw if a transaction exists |

### Common Pitfall: Rollback Behavior

```java
// ❌ Checked exceptions do NOT trigger rollback by default
@Transactional
public void process() throws IOException {
    save(data);
    throw new IOException("file error");  // Transaction COMMITS (not rolled back!)
}

// ✅ Fix: Explicitly configure rollback
@Transactional(rollbackFor = Exception.class)
public void process() throws IOException {
    save(data);
    throw new IOException("file error");  // Now rolls back
}
```

---

## Connection Pooling — HikariCP

### Why Connection Pooling?

Creating a database connection takes ~20–50ms (TCP handshake, authentication, TLS). For a server handling 1000 req/s, creating connections per request is unsustainable.

```
Without Pool:                    With Pool (HikariCP):
Request → Create Connection      Request → Borrow from Pool (< 1ms)
       → Execute Query                  → Execute Query
       → Close Connection               → Return to Pool
       (~50ms overhead)                  (Connection reused)
```

### Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: app
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20       # Max connections in pool
      minimum-idle: 5             # Min idle connections maintained
      connection-timeout: 30000   # Max wait for connection (ms) — throw if exceeded
      idle-timeout: 600000        # Close idle connections after 10 min
      max-lifetime: 1800000       # Max connection age 30 min (before DB kills it)
      leak-detection-threshold: 60000  # Log warning if connection not returned in 60s
```

### Sizing Formula

```
Pool Size = Number of simultaneous queries your app needs

Rule of thumb: connections = ((core_count * 2) + effective_spindle_count)

For most apps: 10-20 connections is sufficient
More connections ≠ better performance (context switching overhead)
```

> **Common Mistake:** Setting pool size to 100+ "for safety." More connections means more OS threads, more memory, and more contention at the DB level. PostgreSQL recommends < 400 total connections.

---

## Entity Lifecycle (Persistence Context)

```
┌───────────┐   persist()   ┌───────────┐   flush/commit   ┌───────────┐
│ Transient  │─────────────►│  Managed   │────────────────►│  Database  │
│ (new)      │              │ (attached) │                  │            │
└───────────┘              └─────┬─────┘                  └───────────┘
                                  │
                           detach/clear/close
                                  │
                           ┌──────▼──────┐   merge()   ┌───────────┐
                           │  Detached    │───────────►│  Managed   │
                           │              │            │ (re-attach)│
                           └──────────────┘            └───────────┘
                                  │
                             remove()
                                  │
                           ┌──────▼──────┐
                           │  Removed     │  → DELETE on flush
                           └──────────────┘
```

| State | In Persistence Context? | In Database? | Tracked for changes? |
|-------|------------------------|-------------|---------------------|
| **Transient** | No | No | No |
| **Managed** | Yes | Yes (after flush) | Yes (dirty checking) |
| **Detached** | No | Yes | No |
| **Removed** | Yes (marked for deletion) | Yes (until flush) | N/A |

### Dirty Checking

When a transaction commits, Hibernate compares each managed entity's current state with its snapshot from when it was loaded. If ANY field changed, Hibernate generates an UPDATE statement automatically.

```java
@Transactional
public void updateUserName(Long id, String newName) {
    User user = userRepo.findById(id).orElseThrow();  // Managed
    user.setName(newName);  // Just a setter — no save() needed!
    // On transaction commit, Hibernate detects the change and issues:
    // UPDATE users SET name = ? WHERE id = ?
}
```

> **Key Insight:** You don't need to call `save()` for updates to managed entities. Dirty checking handles it automatically within a `@Transactional` method.

---

## Interview Perspective

**Q: What is the N+1 problem and how do you solve it?**

When you load N parent entities and accessing each parent's lazy-loaded children triggers a separate query (1 for parents + N for children = N+1 queries). Solutions: (1) `@EntityGraph` for ad-hoc eager fetching, (2) `JOIN FETCH` in JPQL, (3) `default_batch_fetch_size` in Hibernate config, (4) DTO projections that skip entity mapping entirely.

**Q: How does `@Transactional` work internally? What are common pitfalls?**

Spring creates an AOP proxy around the bean. The proxy begins a transaction before the method, commits on success, rolls back on `RuntimeException`. Pitfalls: (1) calling `@Transactional` method from within the same class bypasses the proxy (no transaction), (2) checked exceptions don't rollback by default (need `rollbackFor = Exception.class`), (3) `readOnly = true` provides optimization hints but doesn't prevent writes.

**Q: Explain entity states in JPA.**

Four states: Transient (new, not managed), Managed (attached to persistence context, dirty-checked), Detached (was managed, now disconnected — after `clear()` or transaction end), Removed (marked for deletion). Dirty checking auto-detects changes to managed entities and generates UPDATE statements on flush/commit.

**Q: What is the difference between `FetchType.LAZY` and `EAGER`?**

EAGER loads the association immediately with the parent query (often via JOIN). LAZY loads only when accessed (proxy is created). Always use LAZY — EAGER loading causes N+1 problems and loads data you might not need. Fetch explicitly when needed via `@EntityGraph` or `JOIN FETCH`.

**Q: How do you size a database connection pool?**

Formula: `connections ≈ (CPU cores × 2) + spindle count`. For most apps, 10–20 connections. More connections ≠ better performance — each connection consumes memory and causes context switching. Monitor pool metrics (active, idle, waiting) via HikariCP metrics. Set `connection-timeout` and `leak-detection-threshold`.

---

## Key Takeaways

- **Always use `FetchType.LAZY`.** Fetch explicitly with `@EntityGraph` or `JOIN FETCH` when needed.
- **N+1 is the #1 JPA performance killer.** Use Hibernate's `show_sql=true` in dev to catch it early.
- **`@Transactional` works via AOP proxy.** Internal calls bypass it. Checked exceptions don't rollback by default.
- **Dirty checking** auto-updates managed entities — no `save()` needed for updates within a transaction.
- **DTO projections** are the best solution for read-only queries — skip entity mapping, prevent N+1, select only needed columns.
- **HikariCP pool size:** 10–20 for most apps. Monitor with Actuator metrics. Set leak detection threshold.
- **Disable `spring.jpa.open-in-view=false`.** OSIV keeps connections open through view rendering — connection pool exhaustion.
- **Use `GenerationType.SEQUENCE`** for batch insert performance over `IDENTITY`.
