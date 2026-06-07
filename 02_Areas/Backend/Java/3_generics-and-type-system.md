# Generics & Type System

> Generics enable type-safe, reusable code by allowing classes, interfaces, and methods to operate on parameterized types. They shift type errors from runtime (`ClassCastException`) to compile time, making code safer without sacrificing flexibility.

---

## Why Generics Exist

### The Problem — Pre-Generics Java

Before Java 5, collections stored raw `Object` references. You could put anything in and had to cast when taking things out.

```java
// Pre-generics — compiles fine, explodes at runtime
List names = new ArrayList();
names.add("Alice");
names.add(42);           // No error! List accepts Object
String name = (String) names.get(1);  // ClassCastException at RUNTIME
```

**Problems:**
1. **No compile-time safety** — the compiler can't verify types.
2. **Manual casting** — every retrieval requires a cast.
3. **Runtime failures** — bugs caught only in production.

### The Solution

```java
// With generics — type error caught at COMPILE time
List<String> names = new ArrayList<>();
names.add("Alice");
names.add(42);           // COMPILE ERROR: incompatible types
String name = names.get(0);  // No cast needed — compiler knows it's String
```

### Mental Model

Generics are like **labeled containers**. Without generics, you have a box labeled "STUFF" — anything goes in, and you have to inspect each item when you take it out. With generics, the box is labeled "BOOKS ONLY" — the compiler prevents you from putting in non-books, and you know exactly what you're getting out.

---

## Generic Classes

```java
// T is a type parameter — a placeholder for an actual type
public class Box<T> {
    private T item;
    
    public void set(T item) { this.item = item; }
    public T get() { return item; }
}

// Usage — T is replaced with String
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String value = stringBox.get();  // No cast

// T is replaced with Integer
Box<Integer> intBox = new Box<>();
intBox.set(42);
Integer num = intBox.get();
```

### Multiple Type Parameters

```java
public class Pair<K, V> {
    private K key;
    private V value;
    
    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
    
    public K getKey() { return key; }
    public V getValue() { return value; }
}

Pair<String, Integer> entry = new Pair<>("age", 25);
```

### Common Type Parameter Naming Conventions

| Letter | Convention |
|--------|-----------|
| `T` | Type (general purpose) |
| `E` | Element (used in collections) |
| `K` | Key (used in maps) |
| `V` | Value (used in maps) |
| `N` | Number |
| `R` | Return type |

---

## Generic Methods

A method can declare its own type parameters, independent of the class.

```java
public class Utils {
    // <T> declares the type parameter; T is used in return type and parameter
    public static <T> T getFirst(List<T> list) {
        return list.isEmpty() ? null : list.get(0);
    }
    
    // Multiple type parameters
    public static <T, R> R transform(T input, Function<T, R> transformer) {
        return transformer.apply(input);
    }
}

// Type inference — compiler figures out T from the argument
String first = Utils.getFirst(List.of("a", "b", "c"));  // T inferred as String
Integer num = Utils.getFirst(List.of(1, 2, 3));          // T inferred as Integer
```

---

## Bounded Type Parameters

### Problem

Sometimes `T` is too open — you need to restrict what types are allowed.

### Upper Bound — `extends`

```java
// T must be Number or a subclass of Number
public static <T extends Number> double sum(List<T> numbers) {
    return numbers.stream().mapToDouble(Number::doubleValue).sum();
}

sum(List.of(1, 2, 3));         // OK — Integer extends Number
sum(List.of(1.5, 2.5));        // OK — Double extends Number
sum(List.of("a", "b"));        // COMPILE ERROR — String doesn't extend Number
```

### Multiple Bounds

```java
// T must extend Comparable AND implement Serializable
public static <T extends Comparable<T> & Serializable> T findMax(List<T> items) {
    return items.stream().max(Comparable::compareTo).orElseThrow();
}
// Note: class bound must come first, then interface bounds
// <T extends SomeClass & Interface1 & Interface2>
```

---

## Type Erasure — The Critical Internal Mechanism

### What Happens

> At compile time, Java checks all generic type safety. At runtime, **all generic type information is erased**. The JVM has no knowledge of generic types.

```java
// What you write
List<String> names = new ArrayList<>();
names.add("Alice");
String name = names.get(0);

// What the JVM actually sees (after erasure)
List names = new ArrayList();
names.add("Alice");
String name = (String) names.get(0);  // Compiler inserts the cast
```

### Why Type Erasure Exists

**Backward compatibility.** When generics were added in Java 5, there were billions of lines of pre-generics Java code. Type erasure ensured that `List<String>` and raw `List` produce the same bytecode, so old and new code could interoperate without recompilation.

### Consequences of Type Erasure

| What You Can't Do | Why |
|-------------------|-----|
| `new T()` | JVM doesn't know what T is at runtime |
| `new T[10]` | Array type must be known at creation time |
| `instanceof List<String>` | Type parameter is erased — JVM only sees `List` |
| `T.class` | No `Class` object for type parameters |
| Overload by generic type alone | `void process(List<String>)` and `void process(List<Integer>)` have the same erasure |

```java
// This WON'T compile — both methods have same erasure: process(List)
public void process(List<String> strings) { }
public void process(List<Integer> numbers) { }  // COMPILE ERROR: same erasure
```

### How to Work Around Type Erasure

```java
// Problem: Can't create T[] directly
// Solution: Pass a Class<T> or use an IntFunction
public static <T> T[] toArray(List<T> list, Class<T> type) {
    T[] array = (T[]) Array.newInstance(type, list.size());
    return list.toArray(array);
}

// Or use the modern approach
String[] arr = list.toArray(String[]::new);
```

---

## Wildcards — Flexibility in Generic Types

### Problem

```java
// This does NOT work — List<Dog> is NOT a subtype of List<Animal>
public void printAll(List<Animal> animals) { ... }

List<Dog> dogs = List.of(new Dog());
printAll(dogs);  // COMPILE ERROR!
```

**Why?** Because generics are **invariant**. `Dog extends Animal`, but `List<Dog>` does NOT extend `List<Animal>`. If it did:

```java
List<Dog> dogs = new ArrayList<>();
List<Animal> animals = dogs;  // Hypothetically allowed
animals.add(new Cat());       // Legal — Cat IS an Animal
Dog dog = dogs.get(0);        // BOOM — it's actually a Cat!
```

### Three Types of Wildcards

#### 1. Unbounded Wildcard: `<?>`

"I don't care what the type is."

```java
public void printList(List<?> list) {
    for (Object item : list) {
        System.out.println(item);
    }
}

printList(List.of("a", "b"));   // Works
printList(List.of(1, 2, 3));    // Works
```

#### 2. Upper-Bounded Wildcard: `<? extends T>` (Read)

"Any type that IS-A T or a subtype of T." Use for **reading** (producing) data.

```java
// Accepts List<Number>, List<Integer>, List<Double>, etc.
public double sum(List<? extends Number> numbers) {
    double total = 0;
    for (Number n : numbers) {
        total += n.doubleValue();  // Safe to READ as Number
    }
    // numbers.add(42);  // COMPILE ERROR — can't write!
    return total;
}
```

**Why can't you write?** The list might be `List<Double>`. Adding an `Integer` would corrupt it. The compiler prevents this.

#### 3. Lower-Bounded Wildcard: `<? super T>` (Write)

"Any type that IS-A T or a supertype of T." Use for **writing** (consuming) data.

```java
// Accepts List<Integer>, List<Number>, List<Object>
public void addNumbers(List<? super Integer> list) {
    list.add(1);     // Safe to WRITE Integer
    list.add(2);
    // Integer n = list.get(0);  // COMPILE ERROR — can only read as Object
}
```

**Why can't you read as Integer?** The list might be `List<Number>` or `List<Object>`. You can only safely read as `Object`.

---

## PECS — Producer Extends, Consumer Super

> **The most important rule for wildcards.** If you can only remember one thing about wildcards, remember PECS.

| Role | Wildcard | You Can | Example |
|------|----------|---------|---------|
| **Producer** (you READ from it) | `? extends T` | `get()` — read as T | Source collection |
| **Consumer** (you WRITE to it) | `? super T` | `add()` — write T | Destination collection |

### Real-World Example: `Collections.copy()`

```java
// src PRODUCES elements (we read from it) → extends
// dest CONSUMES elements (we write to it) → super
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));
    }
}

List<Integer> ints = List.of(1, 2, 3);
List<Number> nums = new ArrayList<>(List.of(0, 0, 0));
Collections.copy(nums, ints);  // dest=List<Number>(super Integer), src=List<Integer>(extends Number)
```

### PECS Decision Flowchart

```
Do you READ from the generic structure?
  YES → Use <? extends T>  (Producer Extends)
  
Do you WRITE to the generic structure?
  YES → Use <? super T>    (Consumer Super)
  
Do you both READ and WRITE?
  YES → Use exact type <T>  (no wildcard)
```

---

## Raw Types — Why They're Dangerous

```java
// Raw type — generic parameter omitted
List rawList = new ArrayList();      // No type parameter
rawList.add("hello");
rawList.add(42);                     // No compile error
String s = (String) rawList.get(1);  // ClassCastException at RUNTIME

// Parameterized type — type-safe
List<String> safeList = new ArrayList<>();
safeList.add(42);  // COMPILE ERROR — caught immediately
```

> **Rule:** Never use raw types in new code. They exist only for backward compatibility with pre-Java 5 code. The compiler issues warnings for raw type usage.

| Expression | What It Means |
|-----------|---------------|
| `List<String>` | A list that holds only Strings (type-safe) |
| `List<?>` | A list of unknown type (type-safe, read-only) |
| `List` | A raw list (NOT type-safe, bypasses generics entirely) |

---

## Generics with Inheritance

### Generic Classes and Subtyping

```
                    Object
                      │
              ┌───────┴───────┐
           Number           String
           │    │
        Integer Double

BUT for generics (invariant):

    List<Number>        List<Integer>        List<Double>
         │                    │                    │
    (NO RELATIONSHIP — these are SIBLING types, not parent-child)

With wildcards (covariant):
    List<? extends Number> IS a supertype of List<Integer> and List<Double>
```

### Generic Interfaces in the Real World

```java
public interface Comparable<T> {
    int compareTo(T other);
}

// String implements Comparable<String>
public class String implements Comparable<String> {
    @Override
    public int compareTo(String other) {
        // Compare character by character
    }
}
```

---

## Interview Perspective

**Q: What are generics and why were they added to Java?**

Generics provide compile-time type safety for collections and other parameterized types. Before generics, collections stored `Object` references, requiring manual casting and allowing runtime `ClassCastException`. Generics shift these errors to compile time, eliminate casts, and enable reusable type-safe code.

**Q: What is type erasure and what are its limitations?**

Type erasure removes all generic type information at runtime for backward compatibility with pre-Java 5 code. The JVM sees `List`, not `List<String>`. This means you can't use `new T()`, `instanceof` with generic types, or overload methods that differ only in generic parameters. The compiler inserts casts behind the scenes.

**Q: Explain the PECS principle.**

Producer Extends, Consumer Super. If you READ from a generic structure (it produces values), use `? extends T`. If you WRITE to it (it consumes values), use `? super T`. If you both read and write, use the exact type `T`. This rule governs wildcard usage in method parameters — `Collections.copy(List<? super T> dest, List<? extends T> src)` is the canonical example.

**Q: Why is `List<Dog>` not a subtype of `List<Animal>` even though `Dog` extends `Animal`?**

Because generics are invariant for type safety. If `List<Dog>` were a subtype of `List<Animal>`, you could assign it to a `List<Animal>` reference and then add a `Cat` to it (since Cat IS an Animal). When you read from the original `List<Dog>`, you'd get a Cat — type safety broken. Wildcards (`List<? extends Animal>`) provide read-only covariance.

**Q: What's the difference between `<? extends T>` and `<? super T>`?**

`? extends T` means "any subtype of T" — you can read as T but can't write (don't know the exact type). `? super T` means "any supertype of T" — you can write T but can only read as Object (don't know the exact supertype). `extends` for producers (read), `super` for consumers (write).

**Q: Can you create an instance of a generic type parameter? Why or why not?**

No. `new T()` is illegal because type erasure removes T at runtime — the JVM doesn't know what constructor to call. Workarounds: pass a `Class<T>` and use `clazz.getDeclaredConstructor().newInstance()`, or pass a `Supplier<T>` factory.

---

## Key Takeaways

- **Generics provide compile-time type safety.** They eliminate `ClassCastException` by catching type errors early.
- **Type erasure** removes generic info at runtime. This is why you can't do `new T()` or `instanceof List<String>`.
- **Generics are invariant:** `List<Dog>` is NOT a subtype of `List<Animal>`. Use wildcards for flexibility.
- **PECS:** Producer Extends (read from `? extends`), Consumer Super (write to `? super`). The single most important wildcard rule.
- **Bounded types** (`<T extends Comparable<T>>`) restrict what types can be used as type arguments.
- **Never use raw types.** Use `List<?>` if the type is unknown, not `List`.
- **Generic methods** can have their own type parameters independent of the class.
