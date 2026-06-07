# Java Interview Questions — Quick Reference

> 60 questions covering mid-level to senior concepts. Each answer references the detailed notes for deep understanding. Curated for a 5+ year experienced full-stack developer targeting top product-based companies.

---

## JVM Architecture & Memory

### 1. Explain the JVM architecture. What are its main components?
**One-liner:** Three subsystems — Class Loader (loads/links/initializes classes via parent delegation), Runtime Data Areas (Heap shared, Stack per-thread, Metaspace for class metadata), and Execution Engine (Interpreter + JIT compiler C1/C2 + GC).
📖 [Detailed notes](1_jvm-architecture-and-memory.md#jvm-architecture--the-complete-picture)

### 2. What is the difference between Heap and Stack memory?
**One-liner:** Stack is per-thread (primitives, references, method frames, auto-cleaned on return, `StackOverflowError`). Heap is shared (all objects, GC-managed, `OutOfMemoryError`). References live on Stack; objects live on Heap.
| Stack | Heap |
|-------|------|
| Per-thread, fast (LIFO) | Shared, slower (dynamic) |
| Primitives + references | Objects + arrays |
| `StackOverflowError` | `OutOfMemoryError` |
📖 [Detailed notes](1_jvm-architecture-and-memory.md#heap-vs-stack--the-critical-distinction)

### 3. How does garbage collection work in Java?
**One-liner:** GC uses generational model — new objects in Eden (Young Gen), Minor GC copies survivors to Survivor spaces, objects surviving ~15 cycles are promoted to Old Gen. Major GC (mark-sweep-compact) collects Old Gen. G1 (default) divides heap into regions, prioritizes garbage-heavy regions to meet pause targets.
📖 [Detailed notes](1_jvm-architecture-and-memory.md#garbage-collection--automatic-memory-management)

### 4. What is JIT compilation and why does Java get faster over time?
**One-liner:** JIT converts hot bytecode to optimized native machine code at runtime. Tiered: Interpreter → C1 (moderate optimization) → C2 (aggressive: inlining, escape analysis, loop unrolling). Java apps need warmup — first invocations are interpreted, then performance jumps.
📖 [Detailed notes](1_jvm-architecture-and-memory.md#jit-compilation--why-java-isnt-slow)

### 5. How would you diagnose and fix a memory leak?
**One-liner:** Monitor `heapUsed` over time — steady growth without GC dips = leak. Steps: enable `-XX:+HeapDumpOnOutOfMemoryError`, take heap dumps with `jmap`, analyze with Eclipse MAT (dominator tree, retained size). Common culprits: static collections without eviction, unclosed resources, unremoved listeners, ThreadLocal not cleared.
📖 [Detailed notes](1_jvm-architecture-and-memory.md#common-memory-errors)

### 6. What is the ClassLoader delegation model and why does it exist?
**One-liner:** Parent-first: Application → Platform → Bootstrap. Each loader delegates to parent before loading itself. Ensures core Java classes (java.lang.String) are always loaded by Bootstrap, preventing malicious replacement. A class is identified by name + ClassLoader pair.
📖 [Detailed notes](1_jvm-architecture-and-memory.md#class-loading--how-java-finds-and-loads-your-code)

### 7. Explain the difference between G1 GC and ZGC.
**One-liner:** G1 divides heap into regions, collects garbage-first regions to meet pause targets (~200ms default). ZGC targets ultra-low latency (<10ms pauses) using concurrent compaction — almost no stop-the-world pauses. G1 is the default; ZGC for latency-critical apps.
📖 [Detailed notes](1_jvm-architecture-and-memory.md#garbage-collector-choices)

---

## OOP & Core Concepts

### 8. What are the four pillars of OOP? Explain with examples.
**One-liner:** Encapsulation (hide internals, expose behavior), Inheritance (share code via parent-child), Polymorphism (same interface, different implementations — compile-time overloading, runtime overriding), Abstraction (hide complexity — abstract classes for partial impl + state, interfaces for contracts).
📖 [Detailed notes](2_oop-and-core-concepts.md#the-four-pillars--but-actually-understood)

### 9. Abstract class vs Interface — when to use which?
| Abstract Class | Interface |
|---------------|-----------|
| Shared state (fields) + partial implementation | Pure contract/capability |
| Single inheritance | Multiple implementation |
| Constructors allowed | No constructors |
| IS-A with shared code | CAN-DO / loose coupling |
📖 [Detailed notes](2_oop-and-core-concepts.md#abstract-classes-vs-interfaces)

### 10. Explain the `equals()` and `hashCode()` contract.
**One-liner:** If `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` MUST be true. HashMap uses hashCode to find the bucket, equals to confirm the key. Breaking this contract means equal objects can't be found in hash-based collections.
📖 [Detailed notes](2_oop-and-core-concepts.md#equals-and-hashcode-contract)

### 11. What are SOLID principles?
**One-liner:** S—Single Responsibility (one reason to change). O—Open/Closed (extend without modifying). L—Liskov Substitution (subtypes must be drop-in replaceable). I—Interface Segregation (many focused interfaces). D—Dependency Inversion (depend on abstractions, not concretions).
📖 [Detailed notes](2_oop-and-core-concepts.md#solid-principles)

### 12. Why favor composition over inheritance?
**One-liner:** Inheritance = tight coupling, single hierarchy, inherits everything. Composition = loose coupling, runtime flexibility, pick-and-choose behaviors, easy to test/mock. Use inheritance only for genuine IS-A with shared code.
📖 [Detailed notes](2_oop-and-core-concepts.md#composition-vs-inheritance)

### 13. What are Records in Java? When should you use them?
**One-liner:** Immutable data carriers (Java 16+) that auto-generate constructor, accessors (`x()` not `getX()`), equals, hashCode, toString. Use for DTOs, value objects, API responses. Cannot hold mutable state or extend classes.
📖 [Detailed notes](2_oop-and-core-concepts.md#records-java-16)

### 14. What are Sealed Classes and why do they matter?
**One-liner:** Classes that restrict which classes can extend them (`sealed ... permits`). Enable exhaustive switch/pattern matching — compiler verifies all subtypes are handled. Three subclass modifiers: `final`, `sealed`, `non-sealed`.
📖 [Detailed notes](2_oop-and-core-concepts.md#sealed-classes-java-17)

### 15. How does runtime polymorphism work internally?
**One-liner:** JVM uses a virtual method table (vtable). Reference type determines what you CAN call (compile-time check). Object type determines WHICH implementation RUNS (runtime dispatch via vtable lookup). `Shape s = new Circle(); s.area()` → JVM finds Circle's vtable → Circle.area() executes.
📖 [Detailed notes](2_oop-and-core-concepts.md#how-runtime-polymorphism-works-internally)

---

## Generics & Type System

### 16. What are generics and why were they added?
**One-liner:** Generics provide compile-time type safety for parameterized types. Before Java 5, collections stored Object — requiring casting and allowing ClassCastException at runtime. Generics shift type errors to compile time and eliminate casts.
📖 [Detailed notes](3_generics-and-type-system.md#why-generics-exist)

### 17. What is type erasure? What are its limitations?
**One-liner:** Generic type info is removed at compile time for backward compatibility. JVM sees `List`, not `List<String>`. Limitations: can't do `new T()`, `instanceof List<String>`, or overload by generic type alone. Compiler inserts casts behind the scenes.
📖 [Detailed notes](3_generics-and-type-system.md#type-erasure--the-critical-internal-mechanism)

### 18. Explain the PECS principle.
**One-liner:** Producer Extends, Consumer Super. READ from generic → `? extends T`. WRITE to generic → `? super T`. Both read and write → exact type `T`. Example: `Collections.copy(List<? super T> dest, List<? extends T> src)`.
📖 [Detailed notes](3_generics-and-type-system.md#pecs--producer-extends-consumer-super)

### 19. Why is `List<Dog>` not a subtype of `List<Animal>`?
**One-liner:** Generics are invariant for type safety. If allowed, you could add a Cat to a `List<Animal>` reference pointing at a `List<Dog>`. Wildcards (`List<? extends Animal>`) provide read-only covariance.
📖 [Detailed notes](3_generics-and-type-system.md#wildcards--flexibility-in-generic-types)

### 20. What is the difference between `<? extends T>` and `<? super T>`?
**One-liner:** `? extends T` = any subtype of T — can read as T, can't write (producer). `? super T` = any supertype of T — can write T, can only read as Object (consumer). This is the PECS rule.
📖 [Detailed notes](3_generics-and-type-system.md#three-types-of-wildcards)

---

## Collections Framework

### 21. Explain how HashMap works internally.
**One-liner:** Array of buckets (default 16). `put()`: compute hashCode → bucket index via `hash & (capacity-1)` → if empty, create node; if collision, chain as linked list (or Red-Black Tree if chain ≥ 8 nodes). Resizes at 75% load factor (doubles capacity, rehashes all entries).
📖 [Detailed notes](4_collections-framework.md#hashmap--internal-deep-dive)

### 22. What happens if you don't override `hashCode()` for HashMap keys?
**One-liner:** Default `hashCode()` uses memory address. Two logically equal objects get different hash codes → different buckets → `get()` can't find the entry even though `equals()` returns true. Collections completely break.
📖 [Detailed notes](4_collections-framework.md#hashmap--internal-deep-dive)

### 23. ArrayList vs LinkedList — when to use each?
**One-liner:** ArrayList in 99% of cases. O(1) random access, CPU cache-friendly (contiguous memory), 4 bytes/element. LinkedList has 24 bytes/element overhead (node objects), O(n) access. Use LinkedList only for constant-time head/tail operations (Deque).
📖 [Detailed notes](4_collections-framework.md#arraylist-vs-linkedlist--the-real-comparison)

### 24. What is the difference between fail-fast and fail-safe iterators?
**One-liner:** Fail-fast (ArrayList, HashMap) throws `ConcurrentModificationException` on structural modification during iteration (tracked via `modCount`). Fail-safe (ConcurrentHashMap) works on a snapshot — never throws but may miss concurrent changes.
📖 [Detailed notes](4_collections-framework.md#fail-fast-vs-fail-safe-iterators)

### 25. How would you implement an LRU cache in Java?
**One-liner:** `LinkedHashMap` in access-order mode (`new LinkedHashMap<>(cap, 0.75f, true)`). Override `removeEldestEntry()` to evict when size exceeds capacity. Most recently accessed moves to tail; least recently used (eldest) at head gets evicted.
📖 [Detailed notes](4_collections-framework.md#linkedhashmap)

### 26. HashMap vs TreeMap vs LinkedHashMap — when to use each?
| Feature | HashMap | TreeMap | LinkedHashMap |
|---------|---------|---------|---------------|
| Order | None | Sorted by key | Insertion order |
| Get/Put | O(1) | O(log n) | O(1) |
| Use when | Default choice | Sorted keys, range queries | Need order or LRU cache |
📖 [Detailed notes](4_collections-framework.md#map-comparison)

### 27. Comparable vs Comparator — when to use each?
**One-liner:** `Comparable` = class defines its own natural ordering (one ordering, implements `compareTo()`). `Comparator` = external ordering strategy (multiple orderings, doesn't modify the class). Use Comparator when you can't modify the class or need multiple sort orders.
📖 [Detailed notes](4_collections-framework.md#comparable-vs-comparator)

### 28. What is ConcurrentHashMap and how does it differ from Hashtable?
**One-liner:** Both are thread-safe, but Hashtable synchronizes on the entire map (one lock). ConcurrentHashMap uses per-bucket locking (Java 8+ uses CAS + synchronized on individual bins). ConcurrentHashMap allows concurrent reads and writes; Hashtable serializes all access.
📖 [Detailed notes](4_collections-framework.md#concurrenthashmap)

---

## Streams & Lambdas

### 29. What is a functional interface?
**One-liner:** An interface with exactly one abstract method. Lambdas provide instances. `@FunctionalInterface` enforces at compile time. Built-ins: `Predicate<T>` (test), `Function<T,R>` (transform), `Consumer<T>` (action), `Supplier<T>` (factory).
📖 [Detailed notes](5_streams-and-lambdas.md#functional-interfaces--the-foundation)

### 30. What is the difference between `map()` and `flatMap()`?
**One-liner:** `map()` = 1-to-1 transformation (T → R). `flatMap()` = 1-to-many + flatten (T → Stream<R> → R). Use flatMap when each element maps to multiple results or when dealing with nested Optionals/Streams.
📖 [Detailed notes](5_streams-and-lambdas.md#flatmap--flatten-nested-structures)

### 31. How do parallel streams work? When should you use them?
**One-liner:** Use ForkJoinPool.commonPool(), split data via Spliterator, process chunks on separate threads, combine results. Use only for large datasets (100K+), CPU-intensive per-element work, with independent operations. Avoid for I/O, small collections, or shared mutable state.
📖 [Detailed notes](5_streams-and-lambdas.md#parallel-streams)

### 32. Why are streams lazy? What advantage does this give?
**One-liner:** Intermediate operations build a pipeline description without executing. Only terminal operations trigger processing. Advantages: short-circuiting (`findFirst` stops early), operation fusion (one pass per element), no intermediate collections.
📖 [Detailed notes](5_streams-and-lambdas.md#lazy-evaluation--why-it-matters)

### 33. When should you NOT use Optional?
**One-liner:** Never as a field (not serializable, memory overhead), never as a method parameter (forces callers to wrap), never for collections (return empty collection instead). Optional is only for method return types where "no result" is valid.
📖 [Detailed notes](5_streams-and-lambdas.md#optional-anti-patterns)

### 34. Explain effectively final. Why do lambdas require it?
**One-liner:** A variable assigned exactly once. Lambdas capture the VALUE of local variables. If reassignment were allowed, the lambda would hold a stale copy. Instance/static fields CAN be mutated (accessed via reference through `this`/class).
📖 [Detailed notes](5_streams-and-lambdas.md#effectively-final--lambda-variable-capture)

### 35. How does `reduce()` work? Give an example.
**One-liner:** Combines all stream elements into one result using an accumulator. `reduce(identity, accumulator)` — identity is the starting value, accumulator is a BinaryOperator. Example: `stream.reduce(0, Integer::sum)` sums all elements by repeatedly applying `(accumulated, next) → accumulated + next`.
📖 [Detailed notes](5_streams-and-lambdas.md#reduce--combine-all-elements)

### 36. Name 5 useful Collectors and their SQL equivalents.
| Collector | SQL |
|-----------|-----|
| `groupingBy(fn)` | `GROUP BY` |
| `groupingBy(fn, counting())` | `GROUP BY ... COUNT(*)` |
| `partitioningBy(pred)` | `CASE WHEN` |
| `joining(", ")` | `GROUP_CONCAT` |
| `summarizingInt(fn)` | `AVG, MIN, MAX, SUM, COUNT` |
📖 [Detailed notes](5_streams-and-lambdas.md#collectors--gathering-stream-results)

---

## Concurrency & Multithreading

### 37. What is the difference between `volatile` and `synchronized`?
**One-liner:** `volatile` = visibility (reads/writes go to main memory) + ordering, but NO atomicity. `synchronized` = visibility + ordering + atomicity. Use volatile for flags; synchronized for compound operations like `count++`.
📖 [Detailed notes](6_concurrency-and-multithreading.md#the-visibility-problem--why-volatile-exists)

### 38. What is a deadlock? How do you prevent it?
**One-liner:** Two+ threads blocked forever, each waiting for a lock held by the other. Four conditions: mutual exclusion, hold-and-wait, no preemption, circular wait. Prevent: consistent lock ordering, `tryLock` with timeouts, minimize lock scope.
📖 [Detailed notes](6_concurrency-and-multithreading.md#deadlock-livelock-starvation)

### 39. `synchronized` vs `ReentrantLock` — when to use each?
| Feature | synchronized | ReentrantLock |
|---------|-------------|---------------|
| Try without blocking | ❌ | `tryLock()` |
| Interruptible wait | ❌ | `lockInterruptibly()` |
| Fairness | ❌ | Configurable |
| Simplicity | ✅ | More code |
Use synchronized for simple cases; ReentrantLock when you need tryLock, timeouts, or multiple conditions.
📖 [Detailed notes](6_concurrency-and-multithreading.md#synchronized-vs-reentrantlock)

### 40. Why use thread pools instead of creating threads manually?
**One-liner:** Thread creation is expensive (~1MB stack, OS overhead). Pools reuse threads, bound resource usage, offer rejection policies. Use `ThreadPoolExecutor` directly with bounded queues — `Executors` factory methods use unbounded queues that can cause OOM.
📖 [Detailed notes](6_concurrency-and-multithreading.md#executor-framework--dont-create-threads-manually)

### 41. What is CompletableFuture and how does it improve over Future?
**One-liner:** `Future.get()` blocks. `CompletableFuture` supports non-blocking chaining (thenApply, thenCompose), error handling (exceptionally, handle), combining futures (allOf, anyOf). Java's equivalent of JavaScript Promises.
📖 [Detailed notes](6_concurrency-and-multithreading.md#completablefuture--asynchronous-programming)

### 42. What are virtual threads? How do they differ from platform threads?
**One-liner:** Lightweight JVM-managed threads (Java 21) using ~KB memory vs ~1MB. Multiplex onto few carrier (OS) threads. When blocking on I/O, virtual thread unmounts from carrier, freeing it. Millions of concurrent threads possible. Don't use for CPU-bound work.
📖 [Detailed notes](6_concurrency-and-multithreading.md#virtual-threads-project-loom--java-21)

### 43. What is ThreadLocal and what are its pitfalls?
**One-liner:** Per-thread storage — each thread gets its own copy. Used for user context, transaction ID without parameter passing. Critical pitfall: in thread pools, threads are reused — must call `remove()` or stale data leaks to next request.
📖 [Detailed notes](6_concurrency-and-multithreading.md#threadlocal--thread-confined-storage)

### 44. Explain the thread lifecycle in Java.
**One-liner:** NEW (created) → `start()` → RUNNABLE (eligible for CPU) → RUNNING → TERMINATED. Can transition to: BLOCKED (waiting for lock), WAITING (`wait()`, `join()`), TIMED_WAITING (`sleep(ms)`, `wait(ms)`). `start()` creates OS thread; `run()` directly executes on current thread.
📖 [Detailed notes](6_concurrency-and-multithreading.md#thread-lifecycle)

---

## Exception Handling & I/O

### 45. Checked vs Unchecked exceptions — what's the difference?
**One-liner:** Checked (IOException, SQLException) = external problems, compiler forces handling. Unchecked (NullPointerException, ClassCastException) = programming bugs, fix the code. Errors (OOM, StackOverflow) = JVM catastrophes, don't catch.
📖 [Detailed notes](7_exception-handling-and-io.md#the-three-categories)

### 46. Explain try-with-resources. How does it handle multiple exceptions?
**One-liner:** Auto-closes `AutoCloseable` resources on block exit. Resources closed in reverse order. If both try block and `close()` throw, close exception is suppressed (attached via `addSuppressed()`). Eliminates boilerplate finally blocks.
📖 [Detailed notes](7_exception-handling-and-io.md#try-with-resources-java-7)

### 47. When should you create custom exceptions?
**One-liner:** When you need domain-specific info (error codes, entity IDs), to distinguish your errors at catch sites, or for consistent error handling. Extend RuntimeException for programming errors, Exception for recoverable situations. Always preserve the cause chain.
📖 [Detailed notes](7_exception-handling-and-io.md#custom-exceptions)

### 48. `Path`/`Files` vs `File` — which should you use?
**One-liner:** Always `java.nio.file.Path` + `Files` (Java 7+). Better error handling (throws exceptions vs boolean), symbolic links, atomic operations, rich file attributes, lazy directory walking with Streams. `java.io.File` is legacy.
📖 [Detailed notes](7_exception-handling-and-io.md#javaiofile-vs-javaniofilepath)

### 49. What is the `transient` keyword?
**One-liner:** Excludes a field from Java serialization. Use for sensitive data (passwords), non-serializable fields (connections, threads), or derived values. The field gets its default value (null, 0) on deserialization.
📖 [Detailed notes](7_exception-handling-and-io.md#transient-keyword)

### 50. Why should you avoid Java's built-in serialization?
**One-liner:** Security risk (deserialization of untrusted data = remote code execution), fragile (class changes break compatibility), slow. Use JSON (Jackson), Protocol Buffers, or Avro — faster, safer, language-independent.
📖 [Detailed notes](7_exception-handling-and-io.md#why-java-serialization-is-problematic)

---

## Design Patterns & Best Practices

### 51. Explain the Singleton pattern. Best implementation?
**One-liner:** Ensures one instance. Best: Enum (JVM guarantees, serialization-safe, reflection-proof). Alternatives: Bill Pugh holder class (lazy), double-checked locking with volatile. Problems: hard to test, hidden dependencies — prefer DI container scope.
📖 [Detailed notes](8_design-patterns-and-best-practices.md#singleton--one-instance-global-access)

### 52. Factory vs Builder — when to use which?
**One-liner:** Factory creates different TYPES (decides which class — Circle or Rectangle?). Builder constructs ONE complex object step-by-step (configures how — large pizza, extra cheese, thin crust). Factory = what to create. Builder = how to construct.
📖 [Detailed notes](8_design-patterns-and-best-practices.md#builder--complex-object-construction)

### 53. Explain the Strategy pattern. How does it relate to lambdas?
**One-liner:** Encapsulate algorithms behind an interface, swap at runtime. With Java 8+ lambdas, strategy interfaces become functional interfaces — no need for concrete classes. `Comparator` is the classic Strategy. `list.sort((a,b) -> a.getAge() - b.getAge())` is Strategy via lambda.
📖 [Detailed notes](8_design-patterns-and-best-practices.md#strategy--swap-algorithms-at-runtime)

### 54. Adapter vs Decorator vs Proxy — what's the difference?
**One-liner:** Adapter converts interface (incompatible → compatible). Decorator adds behavior (enhancement). Proxy controls access (caching, security). Adapter = changes WHAT you can do. Decorator = adds to what it does. Proxy = controls WHETHER you can do it.
📖 [Detailed notes](8_design-patterns-and-best-practices.md#interview-perspective)

### 55. How do you make a Java class immutable?
**One-liner:** (1) Class `final`, (2) all fields `private final`, (3) no setters, (4) return new objects for mutations, (5) defensive-copy mutable fields in constructor and getters. Or use Records (Java 16+). Immutable = thread-safe + cache-friendly + hash-safe.
📖 [Detailed notes](8_design-patterns-and-best-practices.md#immutability-patterns)

---

## Java Language & Miscellaneous

### 56. What is `String` immutability and why does it matter?
**One-liner:** String objects can't be modified after creation. Any operation returns a new String. Why: (1) String pool sharing — immutability makes interning safe, (2) thread-safe without synchronization, (3) safe as HashMap keys (hashCode never changes), (4) security — class names, URLs can't be tampered with.

### 57. `String` vs `StringBuilder` vs `StringBuffer`?
| Type | Mutability | Thread-safe | Use when |
|------|-----------|-------------|----------|
| `String` | Immutable | Yes (immutable) | General use, few modifications |
| `StringBuilder` | Mutable | No | String building in single thread (loops) |
| `StringBuffer` | Mutable | Yes (synchronized) | String building in multi-thread (rare) |

### 58. What is the `final` keyword used for?
**One-liner:** `final` variable = can't be reassigned (reference is fixed, object contents can still change). `final` method = can't be overridden by subclasses. `final` class = can't be extended (e.g., `String`, `Integer`). Enables JIT optimizations and communicates design intent.

### 59. Explain `==` vs `.equals()` in Java.
**One-liner:** `==` compares references (memory addresses) — are they the same object? `.equals()` compares logical equality (content) — are they equivalent? For objects, always use `.equals()`. For primitives, `==` is correct (they have no `.equals()`). String pool can make `==` work for some strings, but it's unreliable.

### 60. What are the new features in Java 17 and Java 21 that matter most?
| Feature | Version | Impact |
|---------|---------|--------|
| Records | 16 | Eliminate DTO boilerplate |
| Sealed Classes | 17 | Exhaustive pattern matching |
| Pattern Matching instanceof | 16 | No redundant casting |
| Switch Pattern Matching | 21 | Powerful type-based branching |
| Virtual Threads | 21 | Millions of lightweight threads |
| Text Blocks | 15 | Multi-line strings (`"""`) |
| `var` | 10 | Local variable type inference |
📖 Records: [Detailed notes](2_oop-and-core-concepts.md#records-java-16) | Sealed: [Detailed notes](2_oop-and-core-concepts.md#sealed-classes-java-17) | Virtual Threads: [Detailed notes](6_concurrency-and-multithreading.md#virtual-threads-project-loom--java-21)
