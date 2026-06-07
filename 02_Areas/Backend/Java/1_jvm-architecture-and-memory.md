# JVM Architecture & Memory Model

> The Java Virtual Machine (JVM) is an abstract computing machine that enables Java's "write once, run anywhere" promise. It loads, verifies, and executes bytecode, manages memory automatically, and provides a runtime environment with garbage collection, security, and cross-platform abstraction.

---

## Why Java Needs a Virtual Machine

### Problem

In C/C++, you compile code directly to machine code for a specific OS and CPU architecture. A binary compiled on Linux x86 won't run on macOS ARM. You need to recompile for every target platform. This creates a distribution nightmare — especially for enterprise software running on heterogeneous infrastructure.

### The Solution

Java introduces an intermediate layer: **bytecode**. Instead of compiling to machine code, `javac` compiles `.java` files to `.class` files containing platform-independent bytecode. The JVM — which IS platform-specific — reads this bytecode and translates it to native machine code at runtime.

```
┌──────────────┐     javac      ┌──────────────┐      JVM       ┌──────────────┐
│  Hello.java  │  ──────────►  │  Hello.class  │  ──────────►  │ Machine Code │
│ (Source Code) │  (Compiler)   │  (Bytecode)   │  (Runtime)    │ (Native)     │
└──────────────┘               └──────────────┘               └──────────────┘
                                       │
                        Runs on ANY platform with a JVM
                        (Windows, Linux, macOS, ARM, x86)
```

### Mental Model

Think of bytecode as **sheet music**. A composer (you) writes music once on paper (bytecode). Any musician (JVM) who can read sheet music can perform it on any instrument (hardware). The sheet music is universal — the performer adapts it to the specific instrument.

> **Key Insight:** Java is not truly "interpreted" — modern JVMs use JIT (Just-In-Time) compilation to convert hot bytecode directly to optimized machine code at runtime, achieving near-native performance.

---

## JVM Architecture — The Complete Picture

```
┌─────────────────────────────────────────────────────────────┐
│                       JVM Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Class Loader Subsystem                   │   │
│  │  Loading → Linking (Verify/Prepare/Resolve) → Init   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Runtime Data Areas (Memory)              │   │
│  │                                                       │   │
│  │  ┌─────────┐ ┌───────┐ ┌───────────┐ ┌───────────┐  │   │
│  │  │  Heap   │ │ Stack │ │ Metaspace │ │ PC Register│  │   │
│  │  │(shared) │ │(per   │ │ (shared)  │ │(per thread)│  │   │
│  │  │         │ │thread)│ │           │ │            │  │   │
│  │  └─────────┘ └───────┘ └───────────┘ └───────────┘  │   │
│  │                     ┌──────────────┐                  │   │
│  │                     │ Native Method│                  │   │
│  │                     │    Stack     │                  │   │
│  │                     └──────────────┘                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Execution Engine                         │   │
│  │  Interpreter → JIT Compiler (C1/C2) → GC             │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         Native Method Interface (JNI)                 │   │
│  │              + Native Libraries                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Class Loading — How Java Finds and Loads Your Code

### Core Idea

> The ClassLoader subsystem is responsible for finding `.class` files, loading their bytecode into memory, verifying their correctness, and preparing them for execution.

### The Three Built-in ClassLoaders

Java uses a **delegation hierarchy** — each ClassLoader asks its parent first before loading a class itself.

```
┌───────────────────────────┐
│  Bootstrap ClassLoader     │  ← Loads core Java classes (java.lang.*, java.util.*)
│  (Written in C/C++)       │     From: $JAVA_HOME/lib
└─────────────┬─────────────┘
              │ delegates up
┌─────────────▼─────────────┐
│  Platform ClassLoader      │  ← Loads platform/extension classes
│  (formerly Extension)      │     From: $JAVA_HOME/lib/ext (Java 8), modules (Java 9+)
└─────────────┬─────────────┘
              │ delegates up
┌─────────────▼─────────────┐
│  Application ClassLoader   │  ← Loads YOUR application classes
│  (System ClassLoader)      │     From: classpath (-cp, CLASSPATH, maven deps)
└───────────────────────────┘
```

### Delegation Model (Parent-First)

When you use `new MyClass()`, this happens:

1. Application ClassLoader receives the request.
2. It **delegates to its parent** (Platform ClassLoader) first.
3. Platform delegates to **Bootstrap ClassLoader**.
4. Bootstrap checks its scope → Not found → returns to Platform.
5. Platform checks its scope → Not found → returns to Application.
6. Application ClassLoader loads `MyClass` from the classpath.

> **Why Parent-First?** Security. It prevents user code from replacing core Java classes. You can't create a malicious `java.lang.String` in your classpath and have it load instead of the real one — Bootstrap always loads it first.

### The Three Phases of Class Loading

| Phase | What Happens |
|-------|-------------|
| **Loading** | Finds the `.class` file, reads bytecode, creates a `Class<?>` object in memory |
| **Linking** | **Verify** (bytecode is valid Java) → **Prepare** (allocate memory for static fields, set defaults) → **Resolve** (replace symbolic references with direct memory references) |
| **Initialization** | Execute `static` blocks and initialize static fields with actual values. This happens **lazily** — only when the class is first actively used |

### When Does Initialization Happen?

A class is initialized on first **active use**:
- `new ClassName()`
- Accessing/modifying a static field (not `final` compile-time constants)
- Calling a static method
- Reflection (`Class.forName()`)
- The main class at JVM startup

> **Common Interview Trap:** Accessing a `static final int CONSTANT = 42;` does NOT trigger initialization because compile-time constants are inlined by the compiler.

---

## JVM Memory Model — Where Everything Lives

### Mental Model

Think of JVM memory like an **office building**:
- **Heap** = The open warehouse where all products (objects) are stored. Everyone shares it.
- **Stack** = Each employee's personal desk (per thread). They track their own task progress here.
- **Metaspace** = The filing cabinet room where blueprints (class metadata) are stored.
- **PC Register** = A sticky note on each employee's desk saying which instruction they're on.

### Memory Areas in Detail

```
┌─────────────────────────────────────────────────────────────────┐
│                     HEAP (Shared across all threads)             │
│                                                                  │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │   Young Generation   │    │       Old Generation           │  │
│  │                      │    │     (Tenured Space)            │  │
│  │  ┌──────┐ ┌───────┐ │    │                                │  │
│  │  │ Eden │ │  S0/S1 │ │    │  Long-lived objects promoted   │  │
│  │  │      │ │(Survi- │ │    │  from Young Generation         │  │
│  │  │ New  │ │ vor)   │ │    │                                │  │
│  │  │ objs │ │        │ │    │  Major GC runs here            │  │
│  │  └──────┘ └───────┘ │    │  (slower, stop-the-world)      │  │
│  │                      │    │                                │  │
│  │  Minor GC runs here  │    │                                │  │
│  │  (fast, frequent)    │    │                                │  │
│  └─────────────────────┘    └────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                METASPACE (Native Memory — not in Heap)           │
│  Class metadata, method bytecode, constant pools, annotations   │
│  Grows dynamically (replaces PermGen from Java 8+)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Thread Stack 1  │  │  Thread Stack 2  │  │  Thread Stack N  │
│  ┌─────────────┐ │  │  ┌─────────────┐ │  │  ┌─────────────┐ │
│  │ Stack Frame │ │  │  │ Stack Frame │ │  │  │ Stack Frame │ │
│  │ (method A)  │ │  │  │ (method X)  │ │  │  │ (method P)  │ │
│  ├─────────────┤ │  │  ├─────────────┤ │  │  ├─────────────┤ │
│  │ Stack Frame │ │  │  │ Stack Frame │ │  │  │ Stack Frame │ │
│  │ (method B)  │ │  │  │ (method Y)  │ │  │  │ (method Q)  │ │
│  └─────────────┘ │  │  └─────────────┘ │  │  └─────────────┘ │
│  + PC Register   │  │  + PC Register   │  │  + PC Register   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
      Per Thread            Per Thread            Per Thread
```

### Heap vs Stack — The Critical Distinction

| Aspect | Heap | Stack |
|--------|------|-------|
| **Stores** | Objects, arrays, class instances | Primitive local variables, method frames, object references |
| **Scope** | Shared across ALL threads | Private to each thread |
| **Lifetime** | Until garbage collected | Until method returns (auto-cleaned) |
| **Size** | Large (configurable: `-Xmx`) | Small (default ~512KB–1MB per thread) |
| **Speed** | Slower (dynamic allocation) | Faster (LIFO push/pop) |
| **Error** | `OutOfMemoryError: Java heap space` | `StackOverflowError` |
| **Thread-safe** | No (needs synchronization) | Yes (thread-private) |

### What Goes Where?

```java
public void processOrder() {
    int quantity = 5;                    // Stack — primitive
    double price = 29.99;               // Stack — primitive
    String name = "Widget";             // Stack: reference, Heap: String object
    Order order = new Order(name, qty); // Stack: reference, Heap: Order object
    // When processOrder() returns, stack frame is popped
    // order and name references are gone
    // But the Order and String objects stay on Heap until GC
}
```

> **Key Insight:** The **reference** (pointer) lives on the Stack. The **object** lives on the Heap. When the method returns, the reference is destroyed, but the object lingers on the Heap until the garbage collector determines nothing else references it.

### Stack Frame Anatomy

Every method invocation creates a stack frame containing:

1. **Local Variable Array** — stores `this`, method parameters, and local variables
2. **Operand Stack** — working memory for bytecode operations (like a calculator)
3. **Frame Data** — return address, reference to runtime constant pool

```
┌─────────────────────────────┐
│        Stack Frame           │
├─────────────────────────────┤
│  Local Variable Array        │  ← this, args, local vars
│  [0] this                    │
│  [1] param1                  │
│  [2] localVar                │
├─────────────────────────────┤
│  Operand Stack               │  ← intermediate computation values
├─────────────────────────────┤
│  Frame Data                  │  ← return address, constant pool ref
└─────────────────────────────┘
```

---

## JIT Compilation — Why Java Isn't Slow

### The Problem with Pure Interpretation

Early JVMs interpreted bytecode instruction by instruction — extremely slow. Each bytecode instruction required multiple native instructions. The overhead of the interpretation loop itself was massive.

### The Solution: Just-In-Time Compilation

Modern JVMs use **tiered compilation** — a hybrid approach:

```
Source Code (.java)
      │
      ▼  javac (Ahead-of-Time)
Bytecode (.class)
      │
      ▼  JVM starts
┌─────────────────────────────────────────┐
│  Tier 0: Interpreter                     │  ← Runs immediately, no warmup
│  Collects profiling data (method counts, │
│  branch frequencies, type info)          │
│                                          │
│  When method is called enough times...   │
│           │                              │
│           ▼                              │
│  Tier 1-3: C1 Compiler (Client)         │  ← Quick compilation, moderate optimization
│  Produces reasonably fast machine code   │
│  Continues collecting profiling data     │
│           │                              │
│           ▼  (if method is "hot")        │
│  Tier 4: C2 Compiler (Server)           │  ← Aggressive optimization
│  Inlining, escape analysis, loop        │
│  unrolling, dead code elimination        │
│  Produces highly optimized machine code  │
└─────────────────────────────────────────┘
```

### Key JIT Optimizations

| Optimization | What It Does | Example |
|-------------|-------------|---------|
| **Method Inlining** | Replaces method call with method body | `getX()` call replaced with direct field access |
| **Escape Analysis** | Detects objects that don't escape the method scope → allocates on stack instead of heap | `Point p = new Point(x, y)` may never touch the heap |
| **Loop Unrolling** | Reduces loop overhead by repeating the body | Loop of 4 iterations → 4 copies of the body, no loop |
| **Dead Code Elimination** | Removes unreachable or unused code | `if (false) { ... }` block is removed |
| **Branch Prediction** | Optimizes for the most likely branch based on profiling | `if (x > 0)` that is true 99% of the time |

### Deoptimization

If the JIT compiler made assumptions that later prove wrong (e.g., a polymorphic call site that was assumed monomorphic), the JVM **deoptimizes** — falls back to interpreter or recompiles with fewer assumptions.

> **Practical Impact:** Java applications get faster over time as the JIT "warms up." This is why benchmarking Java requires a **warmup period**. The first few thousand invocations are slow (interpreted), then performance jumps dramatically.

---

## Garbage Collection — Automatic Memory Management

### Core Idea

> Garbage Collection (GC) automatically reclaims memory occupied by objects that are no longer reachable from any live reference. You don't `free()` memory manually — the GC does it for you.

### How "Reachability" Works

The GC starts from **GC Roots** and traces all references. Anything not reachable from a root is garbage.

**GC Roots include:**
- Local variables in active stack frames
- Active threads
- Static fields of loaded classes
- JNI references

```
GC Roots
  │
  ├──► Object A ──► Object B ──► Object C    ← All reachable (ALIVE)
  │
  ├──► Object D                               ← Reachable (ALIVE)
  │
  └──► Object E ──► Object F                  ← Reachable (ALIVE)

       Object G ──► Object H                  ← NOT reachable from any root (GARBAGE)
       Object I (isolated)                     ← GARBAGE
```

> **Important:** Circular references (A→B→A) are NOT a problem in Java. Unlike reference counting (Python/Swift), Java's tracing GC only cares about reachability from GC Roots. If no root reaches the cycle, all objects in the cycle are collected.

### Generational Hypothesis

> **Most objects die young.** In typical Java applications, 90–95% of objects are short-lived (temporary strings, iterators, lambda captures). Only a few survive long-term (caches, singletons, connection pools).

This insight drives the **generational GC design**:

```
Object Created
      │
      ▼
┌──────────┐   survives Minor GC    ┌──────────┐   survives N GCs   ┌──────────┐
│   Eden    │  ──────────────────►  │ Survivor  │  ────────────────► │   Old    │
│  (Young)  │                       │   (S0/S1) │   (promoted)       │(Tenured) │
└──────────┘                       └──────────┘                     └──────────┘
  Fast alloc                        Copied between                   Major GC
  Minor GC                          S0 and S1                        (expensive)
  (frequent)                        each cycle
```

### Minor GC (Young Generation)

1. New objects allocate in **Eden**.
2. When Eden fills up → Minor GC triggers.
3. Mark all live objects (reachable from GC roots).
4. Copy live objects from Eden + current Survivor to the **other Survivor space**.
5. Dead objects in Eden are reclaimed instantly (no deallocation needed — just reset the pointer).
6. Objects that survive enough cycles (default: 15) are **promoted** to Old Generation.

> **Why Two Survivor Spaces?** It eliminates fragmentation. By copying live objects to a fresh space each time, objects are compacted automatically. No holes, no fragmentation.

### Major GC (Old Generation)

Runs less frequently but is more expensive. Typically uses **Mark-Sweep-Compact**:

1. **Mark** — Walk from GC roots, mark all reachable objects.
2. **Sweep** — Reclaim memory of unmarked objects.
3. **Compact** — Move surviving objects together to eliminate fragmentation.

### Garbage Collector Choices

| GC | Best For | Behavior | Flag |
|----|---------|----------|------|
| **Serial GC** | Small apps, single-core | Single thread, stop-the-world | `-XX:+UseSerialGC` |
| **Parallel GC** | Throughput-focused (batch jobs) | Multiple GC threads, stop-the-world | `-XX:+UseParallelGC` |
| **G1 GC** | General purpose (default since Java 9) | Region-based, concurrent marking, predictable pauses | `-XX:+UseG1GC` |
| **ZGC** | Ultra-low latency (<10ms pauses) | Concurrent, no stop-the-world compaction | `-XX:+UseZGC` |
| **Shenandoah** | Low latency (OpenJDK) | Concurrent compaction | `-XX:+UseShenandoahGC` |

### G1 GC — The Modern Default

G1 (Garbage-First) divides the heap into **equal-sized regions** (~1–32MB each) instead of fixed Young/Old spaces:

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  E  │  E  │  S  │  O  │  O  │  E  │  H  │  O  │
│(Eden│(Eden│(Sur-│(Old)│(Old)│(Eden│(Hum-│(Old)│
│)    │)    │vvr) │     │     │)    │ong) │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

E = Eden region    S = Survivor region
O = Old region     H = Humongous (object > 50% of region size)
```

**How G1 achieves predictable pauses:**
1. Tracks "garbage ratio" per region.
2. During collection, prioritizes regions with the most garbage (hence "Garbage-First").
3. You set a target pause time (`-XX:MaxGCPauseMillis=200`), and G1 adjusts how many regions to collect per cycle.

---

## Common Memory Errors

### `OutOfMemoryError: Java heap space`

**Cause:** Heap is full, GC can't reclaim enough space.
**Common reasons:**
- Unbounded collections (Lists/Maps that grow forever)
- Memory leaks (objects unintentionally held by static references)
- Processing huge datasets in memory instead of streaming

```java
// Classic memory leak — static collection grows forever
public class LeakyCache {
    private static final Map<String, byte[]> cache = new HashMap<>();
    
    public static void store(String key, byte[] data) {
        cache.put(key, data);  // Never removed! Grows until OOM
    }
}
```

**Fix:** Use bounded caches (`LinkedHashMap` with `removeEldestEntry`), `WeakHashMap`, or proper cache libraries (Caffeine, Guava Cache).

### `StackOverflowError`

**Cause:** Thread stack is full — too many nested method calls (infinite/deep recursion).

```java
// Infinite recursion
public int factorial(int n) {
    return n * factorial(n - 1);  // Missing base case → StackOverflowError
}
```

**Fix:** Add base cases, convert recursion to iteration, increase stack size (`-Xss2m`) as a last resort.

### `OutOfMemoryError: Metaspace`

**Cause:** Too many classes loaded (common in apps with dynamic class generation — JPA proxies, CGLib, heavy reflection).

**Fix:** `-XX:MaxMetaspaceSize=512m`, investigate classloader leaks in hot-reloading setups.

---

## JVM Tuning — Essential Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `-Xms` | Initial heap size | `-Xms512m` |
| `-Xmx` | Maximum heap size | `-Xmx4g` |
| `-Xss` | Thread stack size | `-Xss1m` |
| `-XX:+UseG1GC` | Use G1 garbage collector | |
| `-XX:MaxGCPauseMillis` | Target max GC pause | `-XX:MaxGCPauseMillis=200` |
| `-XX:+HeapDumpOnOutOfMemoryError` | Dump heap on OOM | Critical for debugging production |
| `-XX:HeapDumpPath` | Where to save heap dump | `-XX:HeapDumpPath=/var/dumps/` |
| `-XX:MaxMetaspaceSize` | Limit metaspace growth | `-XX:MaxMetaspaceSize=256m` |

> **Best Practice:** Always set `-Xms` equal to `-Xmx` in production. This avoids expensive heap resizing at runtime. The JVM pre-allocates the full heap at startup.

---

## Interview Perspective

**Q: Explain the JVM architecture. What are its main components?**

The JVM has three main subsystems: (1) Class Loader Subsystem — loads, links, and initializes classes using a parent-delegation model; (2) Runtime Data Areas — Heap (shared, objects), Stack (per-thread, method frames), Metaspace (class metadata), PC Register; (3) Execution Engine — Interpreter for initial execution, JIT compiler (C1/C2) for optimizing hot code, and the Garbage Collector for memory management.

**Q: What is the difference between Heap and Stack memory?**

Stack is per-thread, stores primitives and references, auto-cleaned when methods return, fast (LIFO), and causes `StackOverflowError`. Heap is shared across threads, stores all objects, cleaned by GC, slower, and causes `OutOfMemoryError`. References live on the Stack; the objects they point to live on the Heap.

**Q: How does garbage collection work in Java? Explain the generational model.**

The GC uses a generational model based on the observation that most objects die young. New objects go to Eden (Young Gen). Minor GC copies survivors to Survivor spaces. After surviving ~15 cycles, objects are promoted to Old Generation. Major GC (less frequent, more expensive) collects Old Gen. G1 GC (default) divides the heap into regions and prioritizes collecting the most garbage-filled regions to meet pause-time targets.

**Q: What is JIT compilation and why does Java get faster over time?**

JIT compilation converts frequently-executed ("hot") bytecode into optimized native machine code at runtime. The JVM uses tiered compilation: Tier 0 (interpreter, collects profiling data) → Tiers 1–3 (C1, moderate optimization) → Tier 4 (C2, aggressive optimization with inlining, escape analysis, loop unrolling). This is why Java apps need a warmup period and why benchmarks must account for JIT warmup.

**Q: How would you diagnose and fix a memory leak in a Java application?**

Monitor heap usage over time — if it grows steadily without dipping after GC, there's a leak. Steps: (1) Enable `-XX:+HeapDumpOnOutOfMemoryError`, (2) Take heap dumps with `jmap` or JVisualVM, (3) Analyze with Eclipse MAT — look for dominator tree and retained size, (4) Common culprits: static collections without eviction, unclosed resources, listeners never unregistered, ThreadLocal values not removed.

**Q: What is the ClassLoader delegation model and why does it exist?**

ClassLoaders follow a parent-first delegation model: Application → Platform → Bootstrap. When asked to load a class, each loader delegates to its parent first. This ensures core Java classes (`java.lang.String`) are always loaded by Bootstrap, preventing malicious replacement. It also prevents duplicate class loading — a class is uniquely identified by its fully-qualified name AND the ClassLoader that loaded it.

---

## Key Takeaways

- **JVM = Class Loader + Runtime Data Areas + Execution Engine.** Bytecode is the universal intermediate language.
- **Heap is shared, Stack is per-thread.** References on Stack, objects on Heap. Never confuse the two.
- **JIT compilation (C1/C2)** makes Java fast. Hot methods get compiled to optimized native code. Java gets faster as it runs.
- **Generational GC** exploits the fact that most objects die young. Minor GC is fast and frequent; Major GC is slow and rare.
- **G1 GC** is the modern default — region-based, predictable pause times, good for most workloads.
- **Always set `-Xms = -Xmx`** in production. Enable heap dumps on OOM. Monitor GC logs.
- **ClassLoader delegation** exists for security — prevents user code from overriding core Java classes.
