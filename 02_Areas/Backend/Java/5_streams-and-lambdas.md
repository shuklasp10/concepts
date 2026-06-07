# Streams & Lambdas

> Streams and Lambdas (Java 8) transformed Java from a verbose, imperative language into one capable of concise, declarative data processing. Streams are NOT data structures — they are lazy, composable pipelines that describe WHAT you want, not HOW to iterate.

---

## Functional Interfaces — The Foundation

### Problem They Solve

Before Java 8, passing behavior as a parameter required anonymous inner classes — verbose and unreadable.

```java
// Java 7 — Anonymous inner class (5 lines for one operation)
Collections.sort(names, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.compareTo(b);
    }
});

// Java 8 — Lambda (1 line)
Collections.sort(names, (a, b) -> a.compareTo(b));

// Even shorter — Method reference
names.sort(String::compareTo);
```

### What is a Functional Interface?

> An interface with exactly ONE abstract method. It can have any number of default or static methods.

```java
@FunctionalInterface  // Optional but recommended — compiler enforces single abstract method
public interface Predicate<T> {
    boolean test(T t);
}
```

### Built-in Functional Interfaces (java.util.function)

| Interface | Signature | Purpose | Example |
|-----------|----------|---------|---------|
| `Predicate<T>` | `T → boolean` | Test/filter | `s -> s.isEmpty()` |
| `Function<T, R>` | `T → R` | Transform | `s -> s.length()` |
| `Consumer<T>` | `T → void` | Side effect | `s -> System.out.println(s)` |
| `Supplier<T>` | `() → T` | Factory/provide | `() -> new ArrayList<>()` |
| `UnaryOperator<T>` | `T → T` | Transform (same type) | `s -> s.toUpperCase()` |
| `BinaryOperator<T>` | `(T, T) → T` | Reduce | `(a, b) -> a + b` |
| `BiFunction<T, U, R>` | `(T, U) → R` | Transform two inputs | `(s, i) -> s.repeat(i)` |
| `BiPredicate<T, U>` | `(T, U) → boolean` | Test two inputs | `(s, i) -> s.length() > i` |

---

## Lambda Expressions

### Syntax

```java
// Full form
(String a, String b) -> { return a.compareTo(b); }

// Type inference — compiler infers types from context
(a, b) -> { return a.compareTo(b); }

// Single expression — no braces, no return keyword
(a, b) -> a.compareTo(b)

// Single parameter — no parentheses needed
name -> name.toUpperCase()

// No parameters
() -> System.out.println("Hello")
```

### How Lambdas Work Internally

Lambdas are NOT anonymous inner classes. The compiler generates:
1. A **private static method** in the enclosing class (for the lambda body).
2. An `invokedynamic` bytecode instruction that, at first invocation, calls `LambdaMetafactory` to generate a lightweight implementation of the functional interface.

```
// This lambda:
Predicate<String> p = s -> s.isEmpty();

// Generates something like:
private static boolean lambda$0(String s) {
    return s.isEmpty();
}
// + invokedynamic bootstrap that creates a Predicate implementation
// pointing to lambda$0
```

> **Why not anonymous classes?** Anonymous classes create a `.class` file for each one, have object allocation overhead, and capture `this` by default. Lambdas are lighter — no extra class file, potentially no object allocation (JVM can optimize to a singleton for non-capturing lambdas).

### Effectively Final — Lambda Variable Capture

Lambdas can access local variables from the enclosing scope, but those variables must be **effectively final** (assigned only once).

```java
int threshold = 10;  // Effectively final — never reassigned
Predicate<Integer> isAbove = n -> n > threshold;  // OK

int counter = 0;
Runnable r = () -> counter++;  // COMPILE ERROR — counter is not effectively final
```

> **Why?** Lambdas capture the VALUE of local variables (not a reference to the stack variable). If the variable could change after capture, the lambda would have a stale copy — confusing and bug-prone.

---

## Method References

A shorthand for lambdas that simply call an existing method.

| Type | Lambda | Method Reference |
|------|--------|-----------------|
| Static method | `s -> Integer.parseInt(s)` | `Integer::parseInt` |
| Instance method (on parameter) | `s -> s.toUpperCase()` | `String::toUpperCase` |
| Instance method (on specific object) | `s -> printer.print(s)` | `printer::print` |
| Constructor | `s -> new ArrayList<>(s)` | `ArrayList::new` |

```java
List<String> numbers = List.of("1", "2", "3");
List<Integer> parsed = numbers.stream()
    .map(Integer::parseInt)     // Static method ref
    .toList();

List<String> names = List.of("alice", "bob");
List<String> upper = names.stream()
    .map(String::toUpperCase)   // Instance method ref (called on each element)
    .toList();
```

---

## Stream API — Core Concepts

### What is a Stream?

> A Stream is a sequence of elements that supports declarative, composable operations. It is NOT a data structure — it doesn't store data. It is a pipeline that processes data from a source (collection, array, generator).

### Mental Model

Think of a Stream like an **assembly line in a factory**:
- The **source** (collection) is the raw materials warehouse.
- **Intermediate operations** (filter, map) are workers on the line — each transforms or selects items.
- The **terminal operation** (collect, forEach) is the packaging station that produces the final product.
- **Nothing moves on the assembly line until someone orders a product** (terminal operation) — this is **lazy evaluation**.

```
┌──────────┐    ┌────────┐    ┌───────┐    ┌──────────┐    ┌─────────┐
│  Source   │───►│ filter │───►│  map  │───►│  sorted  │───►│ collect │
│(List,Set) │    │(inter) │    │(inter)│    │ (inter)  │    │(terminal│
└──────────┘    └────────┘    └───────┘    └──────────┘    └─────────┘
                                                                │
                  LAZY — nothing executes                    TRIGGER
                  until terminal is called                  (executes
                                                           the pipeline)
```

### Intermediate vs Terminal Operations

| Type | Returns | Lazy? | Examples |
|------|---------|-------|---------|
| **Intermediate** | Another `Stream` | Yes | `filter`, `map`, `flatMap`, `sorted`, `distinct`, `peek`, `limit`, `skip` |
| **Terminal** | Result or void | No (triggers execution) | `collect`, `forEach`, `reduce`, `count`, `findFirst`, `anyMatch`, `toList` |

### Stream Lifecycle Rules

1. **A stream can only be consumed ONCE.** After a terminal operation, the stream is closed.
2. **Intermediate operations are lazy.** They do nothing until a terminal operation is invoked.
3. **Streams don't modify the source.** The original collection is untouched.

```java
Stream<String> stream = names.stream();
stream.forEach(System.out::println);
stream.forEach(System.out::println);  // IllegalStateException: stream already closed
```

---

## Common Stream Operations

### filter — Select Elements

```java
List<String> names = List.of("Alice", "Bob", "Amanda", "Charlie");

List<String> aNames = names.stream()
    .filter(name -> name.startsWith("A"))
    .toList();  // [Alice, Amanda]
```

### map — Transform Elements

```java
List<String> names = List.of("alice", "bob", "charlie");

List<Integer> lengths = names.stream()
    .map(String::length)
    .toList();  // [5, 3, 7]

List<String> upper = names.stream()
    .map(String::toUpperCase)
    .toList();  // [ALICE, BOB, CHARLIE]
```

### flatMap — Flatten Nested Structures

```java
// Problem: map produces Stream<Stream<String>>
List<List<String>> nested = List.of(
    List.of("A", "B"),
    List.of("C", "D"),
    List.of("E")
);

// flatMap flattens: Stream<List<String>> → Stream<String>
List<String> flat = nested.stream()
    .flatMap(Collection::stream)
    .toList();  // [A, B, C, D, E]
```

**Mental Model:** `map` is 1-to-1 transformation. `flatMap` is 1-to-many transformation that flattens the result.

```
map:     [1, 2, 3] → map(x → x*2) → [2, 4, 6]

flatMap: [[1,2], [3,4]] → flatMap(list → list.stream()) → [1, 2, 3, 4]
```

### reduce — Combine All Elements

```java
// Sum all numbers
int sum = List.of(1, 2, 3, 4, 5).stream()
    .reduce(0, Integer::sum);  // 15

// Without identity (returns Optional)
Optional<Integer> max = List.of(1, 2, 3).stream()
    .reduce(Integer::max);  // Optional[3]

// String concatenation
String joined = List.of("a", "b", "c").stream()
    .reduce("", (a, b) -> a + b);  // "abc"  (prefer String.join or Collectors.joining)
```

**How reduce works internally:**
```
reduce(0, (a, b) -> a + b)

Step 1: accumulator = 0 + 1 = 1
Step 2: accumulator = 1 + 2 = 3
Step 3: accumulator = 3 + 3 = 6
Step 4: accumulator = 6 + 4 = 10
Step 5: accumulator = 10 + 5 = 15
```

### sorted, distinct, limit, skip

```java
List<Integer> result = List.of(3, 1, 4, 1, 5, 9, 2, 6, 5).stream()
    .distinct()             // Remove duplicates: [3, 1, 4, 5, 9, 2, 6]
    .sorted()               // Sort: [1, 2, 3, 4, 5, 6, 9]
    .skip(2)                // Skip first 2: [3, 4, 5, 6, 9]
    .limit(3)               // Take first 3: [3, 4, 5]
    .toList();
```

---

## Collectors — Gathering Stream Results

### Common Collectors

```java
List<Employee> employees = ...;

// toList, toSet, toUnmodifiableList
List<String> names = employees.stream().map(Employee::getName).toList();

// toMap
Map<Integer, String> idToName = employees.stream()
    .collect(Collectors.toMap(Employee::getId, Employee::getName));

// groupingBy — GROUP BY equivalent
Map<String, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment));

// groupingBy + counting — GROUP BY with COUNT
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));

// partitioningBy — split into true/false groups
Map<Boolean, List<Employee>> partitioned = employees.stream()
    .collect(Collectors.partitioningBy(e -> e.getSalary() > 50000));

// joining
String allNames = employees.stream()
    .map(Employee::getName)
    .collect(Collectors.joining(", "));  // "Alice, Bob, Charlie"

// summarizingInt — statistics
IntSummaryStatistics stats = employees.stream()
    .collect(Collectors.summarizingInt(Employee::getSalary));
// stats.getAverage(), stats.getMax(), stats.getMin(), stats.getSum(), stats.getCount()
```

### Collector Cheat Sheet

| Collector | Returns | SQL Equivalent |
|-----------|---------|---------------|
| `toList()` | `List<T>` | — |
| `toSet()` | `Set<T>` | `DISTINCT` |
| `toMap(keyFn, valueFn)` | `Map<K,V>` | — |
| `groupingBy(classifier)` | `Map<K, List<T>>` | `GROUP BY` |
| `groupingBy(classifier, counting())` | `Map<K, Long>` | `GROUP BY ... COUNT(*)` |
| `partitioningBy(predicate)` | `Map<Boolean, List<T>>` | `CASE WHEN` |
| `joining(delimiter)` | `String` | `GROUP_CONCAT` |
| `summarizingInt(fn)` | `IntSummaryStatistics` | `AVG, MIN, MAX, SUM, COUNT` |

---

## Optional — Eliminating NullPointerException

### Problem

`null` is the "billion-dollar mistake." Every method that returns an object might return null. Every caller must check for null. Forget once → `NullPointerException` in production.

### The Solution

`Optional<T>` is a container that either holds a value or is empty. It forces the caller to explicitly handle the absence case.

```java
// BAD — Returns null, caller might forget to check
public String findEmail(int userId) {
    User user = database.find(userId);
    return user != null ? user.getEmail() : null;
}

// GOOD — Returns Optional, caller MUST handle absence
public Optional<String> findEmail(int userId) {
    return Optional.ofNullable(database.find(userId))
                   .map(User::getEmail);
}
```

### Creating Optionals

```java
Optional<String> present = Optional.of("hello");       // Non-null value
Optional<String> nullable = Optional.ofNullable(value); // May be null
Optional<String> empty = Optional.empty();              // Explicitly empty
```

### Using Optionals — The Right Way

```java
Optional<User> user = findUser(id);

// Transform
Optional<String> email = user.map(User::getEmail);

// Chain — flatMap when the mapper itself returns Optional
Optional<String> city = user.flatMap(User::getAddress)  // getAddress returns Optional<Address>
                            .map(Address::getCity);

// Default value
String name = user.map(User::getName).orElse("Unknown");

// Lazy default
String name = user.map(User::getName).orElseGet(() -> fetchDefault());

// Throw if absent
User u = user.orElseThrow(() -> new NotFoundException("User not found"));

// Conditional action
user.ifPresent(u -> sendWelcomeEmail(u));

// ifPresentOrElse (Java 9+)
user.ifPresentOrElse(
    u -> System.out.println("Found: " + u.getName()),
    () -> System.out.println("Not found")
);

// Stream (Java 9+) — useful for filtering a stream of Optionals
List<String> emails = users.stream()
    .map(User::getEmail)            // Stream<Optional<String>>
    .flatMap(Optional::stream)       // Stream<String> — empty Optionals are dropped
    .toList();
```

### Optional Anti-Patterns

```java
// ❌ DON'T use Optional as a field
public class User {
    private Optional<String> middleName;  // BAD — not serializable, overhead
}

// ❌ DON'T use Optional as a method parameter
public void process(Optional<String> input) { }  // BAD — callers now wrap values

// ❌ DON'T use get() without isPresent()
optional.get();  // NoSuchElementException if empty

// ❌ DON'T use Optional for collections
public Optional<List<String>> getNames() { }  // BAD — return empty list instead

// ✅ DO use Optional ONLY for return types that might have no result
public Optional<User> findById(int id) { }  // GOOD
```

---

## Parallel Streams

### How They Work

```java
// Sequential — one thread processes all elements
list.stream().filter(...).map(...).collect(...);

// Parallel — elements split across ForkJoinPool threads
list.parallelStream().filter(...).map(...).collect(...);
// Or: list.stream().parallel()
```

### Internal Working

Parallel streams use the **ForkJoinPool.commonPool()** (shared across the entire application, default threads = CPU cores - 1). They:

1. **Split** the source into chunks (using `Spliterator`).
2. **Process** each chunk on a separate thread.
3. **Combine** results (merge).

```
        [1, 2, 3, 4, 5, 6, 7, 8]
               Split
        ┌──────────┴──────────┐
    [1,2,3,4]              [5,6,7,8]
       Split                 Split
    ┌────┴────┐          ┌────┴────┐
  [1,2]    [3,4]       [5,6]    [7,8]
  Thread1  Thread2     Thread3  Thread4
    │         │          │         │
    ▼         ▼          ▼         ▼
  Process   Process    Process   Process
    │         │          │         │
    └────┬────┘          └────┬────┘
       Merge               Merge
         └────────┬────────┘
                Merge
              Final Result
```

### When to Use Parallel Streams

| ✅ Use When | ❌ Avoid When |
|------------|-------------|
| Large datasets (100K+ elements) | Small collections (overhead > benefit) |
| CPU-intensive per-element work | I/O-bound operations (blocking threads) |
| Independent operations (no shared state) | Operations depend on encounter order |
| Source splits efficiently (ArrayList) | Source splits poorly (LinkedList, I/O) |

### Parallel Stream Pitfalls

```java
// ❌ DANGER: Shared mutable state
List<Integer> results = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(results::add);  // Race condition!
// Use .collect(Collectors.toList()) instead

// ❌ DANGER: Blocking operations in the shared ForkJoinPool
list.parallelStream()
    .map(id -> httpClient.get("/api/" + id))  // Blocks common pool threads!
    .collect(toList());
```

---

## Lazy Evaluation — Why It Matters

```java
List<String> names = List.of("Alice", "Bob", "Charlie", "David", "Eve");

String result = names.stream()
    .filter(name -> {
        System.out.println("filtering: " + name);
        return name.length() > 3;
    })
    .map(name -> {
        System.out.println("mapping: " + name);
        return name.toUpperCase();
    })
    .findFirst()
    .orElse("");
```

**Output:**
```
filtering: Alice
mapping: Alice
```

It processes element-by-element (not operation-by-operation). Once `findFirst()` finds a match, the rest of the stream is never processed. Without lazy evaluation, it would filter ALL elements, then map ALL filtered results, then find the first — wasting work.

> **Key Insight:** Streams process elements **vertically** (one element through all operations), not **horizontally** (all elements through one operation). This enables short-circuiting and minimizes unnecessary work.

---

## Interview Perspective

**Q: What is the difference between `map()` and `flatMap()`?**

`map()` transforms each element 1-to-1 (T → R). `flatMap()` transforms each element to a stream, then flattens all streams into one (T → Stream<R> → R). Use `flatMap` when each element maps to multiple results, or when dealing with `Optional<Optional<T>>` or `Stream<Stream<T>>`.

**Q: How do parallel streams work internally?**

Parallel streams use the ForkJoinPool.commonPool(). They split the source data using a Spliterator, process each chunk on separate threads, and combine results. The common pool has `Runtime.getRuntime().availableProcessors() - 1` threads. Beware: all parallel streams in the app share this pool — one blocking operation can starve others.

**Q: Why are streams lazy? What is the advantage?**

Intermediate operations build a pipeline description without executing anything. Only terminal operations trigger processing. This enables: (1) short-circuiting — `findFirst()` stops after finding one match, (2) operation fusion — multiple operations are applied per-element in one pass, (3) no intermediate collections — results flow directly through the pipeline.

**Q: When should you NOT use Optional?**

Never as a field (not serializable, memory overhead), never as a method parameter (forces callers to wrap), never for collections (return empty collection instead). Optional is designed exclusively for method return types where "no result" is a valid outcome.

**Q: What is a functional interface?**

An interface with exactly one abstract method. It can have default and static methods. Annotate with `@FunctionalInterface` for compile-time enforcement. Lambdas provide instances of functional interfaces. Key built-ins: `Predicate<T>` (test), `Function<T,R>` (transform), `Consumer<T>` (action), `Supplier<T>` (factory).

**Q: Explain effectively final and why lambdas require it.**

A variable is effectively final if it's assigned exactly once. Lambdas capture the VALUE of local variables (not a reference to the stack slot). If the variable could be reassigned after capture, the lambda would hold a stale copy, leading to confusing bugs. Instance and static fields CAN be mutated because they're accessed by reference through `this` or the class.

---

## Key Takeaways

- **Functional interfaces** have exactly one abstract method. Lambdas provide concise implementations.
- **Streams are not data structures.** They are lazy, composable pipelines. Nothing executes until a terminal operation.
- **Lazy evaluation** processes element-by-element (vertical), enabling short-circuiting and fusion.
- **`map` = 1-to-1, `flatMap` = 1-to-many + flatten.** This distinction matters everywhere.
- **Collectors** are the SQL of Java — `groupingBy`, `partitioningBy`, `counting`, `summarizing`.
- **Optional** is for return types only. Never for fields, parameters, or collections.
- **Parallel streams** use the shared ForkJoinPool. Use only for large, CPU-intensive, independent operations.
- **Method references** (`ClassName::method`) are cleaner than lambdas when you're just delegating to an existing method.
