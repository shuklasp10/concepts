# Concurrency & Multithreading

> Concurrency is the ability of a program to manage multiple tasks at once. Multithreading is Java's primary mechanism for achieving this. Misunderstanding concurrency leads to race conditions, deadlocks, and data corruption — the hardest bugs to reproduce and fix.

---

## Why Concurrency Matters

### Problem

A web server handling one request at a time wastes resources. While waiting for a database query (I/O), the CPU sits idle. On a 16-core machine, a single-threaded app uses only 6.25% of available compute power.

### The Solution

Multiple threads allow a program to handle multiple tasks concurrently. While Thread A waits for I/O, Thread B uses the CPU to process another request.

### Mental Model

Think of a **restaurant kitchen**:
- **Single-threaded:** One chef does everything — prep, cook, plate. While waiting for the oven, he stands idle.
- **Multi-threaded:** Multiple chefs work simultaneously. While Chef A waits for the oven, Chef B preps the next order. They share the kitchen (shared memory), so they need rules to avoid collisions (synchronization).

> **Key Distinction:**
> - **Concurrency:** Managing multiple tasks (switching between them). Even one CPU core can be concurrent.
> - **Parallelism:** Executing multiple tasks simultaneously. Requires multiple CPU cores.

---

## Thread Fundamentals

### Creating Threads

```java
// Way 1: Extend Thread (NOT recommended — wastes single inheritance)
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Running in: " + Thread.currentThread().getName());
    }
}
new MyThread().start();

// Way 2: Implement Runnable (preferred — doesn't waste inheritance)
Runnable task = () -> System.out.println("Running in: " + Thread.currentThread().getName());
new Thread(task).start();

// Way 3: Implement Callable (returns a result)
Callable<Integer> computation = () -> {
    Thread.sleep(1000);
    return 42;
};
```

### Thread Lifecycle

```
                    ┌──────────┐
      new Thread()  │   NEW    │
                    └────┬─────┘
                         │ .start()
                    ┌────▼─────┐
            ┌──────►│ RUNNABLE │◄──────────────────────┐
            │       └────┬─────┘                       │
            │            │ scheduler picks             │
            │       ┌────▼─────┐                       │
            │       │ RUNNING  │                       │
            │       └─┬──┬──┬─┘                       │
            │         │  │  │                          │
            │  sleep()/│  │  │ wait()/                  │
            │  join()  │  │  │ I/O block                │
            │    ┌─────▼┐ │ ┌▼─────────┐              │
            │    │TIMED_│ │ │  WAITING/ │    notify()/  │
            │    │WAITING│ │ │  BLOCKED │    sleep done │
            │    └───┬───┘ │ └────┬─────┘              │
            │        │     │      │                     │
            └────────┘     │      └─────────────────────┘
                           │
                      run() completes
                    ┌──────▼──────┐
                    │ TERMINATED  │
                    └─────────────┘
```

| State | When |
|-------|------|
| **NEW** | Thread object created, `start()` not yet called |
| **RUNNABLE** | Eligible to run, waiting for CPU time from scheduler |
| **RUNNING** | Actively executing on a CPU core |
| **BLOCKED** | Waiting to acquire a `synchronized` lock |
| **WAITING** | Waiting indefinitely (`wait()`, `join()`, `LockSupport.park()`) |
| **TIMED_WAITING** | Waiting with timeout (`sleep(ms)`, `wait(ms)`, `join(ms)`) |
| **TERMINATED** | `run()` completed or threw an uncaught exception |

> **Critical:** `start()` creates a new OS thread and invokes `run()` on it. Calling `run()` directly executes on the current thread — no new thread is created.

---

## The Visibility Problem — Why `volatile` Exists

### Problem

Each CPU core has its own **cache**. When Thread A writes to a variable, the change may stay in Core 1's cache without being visible to Thread B running on Core 2.

```
Core 1 (Thread A)          Core 2 (Thread B)
┌──────────────┐           ┌──────────────┐
│ Cache: flag=1│           │ Cache: flag=0│  ← Stale!
└──────┬───────┘           └──────┬───────┘
       │                          │
       └──────────┬───────────────┘
           ┌──────▼──────┐
           │ Main Memory │
           │   flag = 1  │  ← Updated, but Thread B hasn't seen it
           └─────────────┘
```

```java
// BUG: flag change may never be visible to the reader thread
boolean flag = false;  // Shared variable

// Thread A
flag = true;

// Thread B — may loop FOREVER because it reads cached value
while (!flag) {
    // Spin...
}
```

### The Solution: `volatile`

```java
volatile boolean flag = false;

// Thread A
flag = true;  // Writes directly to main memory, invalidates caches

// Thread B
while (!flag) { }  // Always reads from main memory — sees the update
```

**What `volatile` guarantees:**
1. **Visibility:** Reads and writes go to main memory, not CPU cache.
2. **Ordering:** Prevents instruction reordering around volatile reads/writes.

**What `volatile` does NOT guarantee:**
- **Atomicity.** `count++` on a volatile int is still three operations: read, increment, write. Two threads can interleave.

---

## The Atomicity Problem — Race Conditions

### Problem

```java
// Two threads running count++ simultaneously
int count = 0;

// count++ is actually THREE operations:
// 1. READ  count (0)
// 2. ADD   count + 1 (1)
// 3. WRITE count = 1

Thread A: READ 0 → ADD 1 → (context switch before WRITE)
Thread B: READ 0 → ADD 1 → WRITE 1
Thread A: (resumes) → WRITE 1

// Result: count = 1, not 2. One increment was LOST.
```

### Solution 1: `synchronized`

```java
public class Counter {
    private int count = 0;
    
    // Only ONE thread can execute this method at a time
    public synchronized void increment() {
        count++;
    }
    
    public synchronized int getCount() {
        return count;
    }
}
```

#### How `synchronized` Works

Every Java object has an **intrinsic lock (monitor)**. When a thread enters a `synchronized` block:
1. It acquires the lock on the specified object.
2. No other thread can enter ANY synchronized block on the same object.
3. When the thread exits, it releases the lock.

```java
// Synchronized on 'this'
public synchronized void method() { ... }

// Equivalent to:
public void method() {
    synchronized (this) { ... }
}

// Synchronized on a specific lock object (finer granularity)
private final Object lock = new Object();
public void method() {
    synchronized (lock) {
        // Only this critical section is locked
    }
}
```

> **Key Insight:** `synchronized` guarantees BOTH atomicity AND visibility. When a thread releases a lock, all changes are flushed to main memory. When a thread acquires a lock, it reads from main memory.

### Solution 2: Atomic Classes

For simple operations, `java.util.concurrent.atomic` provides lock-free, thread-safe operations using **Compare-And-Swap (CAS)**.

```java
AtomicInteger count = new AtomicInteger(0);

count.incrementAndGet();       // Atomic increment, returns new value
count.getAndIncrement();       // Atomic increment, returns old value
count.compareAndSet(5, 10);    // Set to 10 only if current value is 5
count.addAndGet(5);            // Atomic add
```

**How CAS works internally:**
```
1. READ current value from memory (expected = 5)
2. Compute new value (desired = 6)
3. COMPARE-AND-SWAP: "If memory still equals 5, set it to 6"
   ├── Success → Done
   └── Failure (another thread changed it) → Retry from step 1
```

> **When to use Atomics vs synchronized:** Atomics for single-variable updates (counters, flags). `synchronized` for multi-variable or complex operations.

---

## ReentrantLock — Explicit Locking

### Why Not Just Use `synchronized`?

`synchronized` lacks flexibility:
- Can't try to acquire without blocking (`tryLock`).
- Can't interrupt a waiting thread.
- Can't use fairness (longest-waiting thread goes first).
- Lock scope is tied to the code block structure.

```java
import java.util.concurrent.locks.ReentrantLock;

public class SharedResource {
    private final ReentrantLock lock = new ReentrantLock();
    
    public void process() {
        lock.lock();  // Explicit acquire
        try {
            // Critical section
        } finally {
            lock.unlock();  // MUST unlock in finally — or deadlock!
        }
    }
    
    public boolean tryProcess() {
        if (lock.tryLock()) {  // Non-blocking attempt
            try {
                // Got the lock — do work
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;  // Lock not available — do something else
    }
}
```

### synchronized vs ReentrantLock

| Feature | synchronized | ReentrantLock |
|---------|-------------|---------------|
| Acquire | Implicit (entering block) | `lock.lock()` |
| Release | Implicit (leaving block) | `lock.unlock()` (MUST be in finally) |
| Try without blocking | ❌ | `tryLock()` |
| Interruptible wait | ❌ | `lockInterruptibly()` |
| Fairness | ❌ | `new ReentrantLock(true)` |
| Condition variables | `wait()`/`notify()` (single set) | `lock.newCondition()` (multiple) |
| Simplicity | ✅ Simpler | More code, risk of forgetting unlock |

---

## ReadWriteLock — Optimizing Read-Heavy Workloads

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Multiple threads can read simultaneously
public String read() {
    rwLock.readLock().lock();
    try {
        return data;
    } finally {
        rwLock.readLock().unlock();
    }
}

// Only one thread can write, and no readers during write
public void write(String newData) {
    rwLock.writeLock().lock();
    try {
        this.data = newData;
    } finally {
        rwLock.writeLock().unlock();
    }
}
```

> Use when reads vastly outnumber writes (e.g., configuration, caches). Multiple readers run in parallel; writes have exclusive access.

---

## Executor Framework — Don't Create Threads Manually

### Problem

Creating a new thread per task is expensive (~1MB stack memory, OS thread creation overhead). For a server handling 10,000 requests/second, creating 10,000 threads would crash the system.

### The Solution: Thread Pools

```java
// Fixed pool — known workload, bounded threads
ExecutorService pool = Executors.newFixedThreadPool(10);

// Cached pool — dynamic, creates threads as needed, reuses idle ones
ExecutorService cached = Executors.newCachedThreadPool();

// Single thread — sequential execution, guaranteed ordering
ExecutorService single = Executors.newSingleThreadExecutor();

// Scheduled — delayed/periodic tasks
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(5);
```

### How Thread Pools Work

```
┌─────────────────────────────────────────┐
│           ExecutorService                │
│                                          │
│  ┌──────────────────────────────┐       │
│  │        Task Queue             │       │
│  │  [Task1] [Task2] [Task3] ... │       │
│  └──────────┬───────────────────┘       │
│             │ Workers pick tasks        │
│  ┌──────────▼───────────────────┐       │
│  │        Thread Pool            │       │
│  │  Thread-1: executing Task1    │       │
│  │  Thread-2: executing Task2    │       │
│  │  Thread-3: idle (waiting)     │       │
│  │  Thread-4: executing Task3    │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
```

### Submitting Tasks

```java
ExecutorService pool = Executors.newFixedThreadPool(4);

// Fire-and-forget (Runnable)
pool.execute(() -> System.out.println("Task running"));

// Get a result (Callable → Future)
Future<Integer> future = pool.submit(() -> {
    Thread.sleep(1000);
    return 42;
});
Integer result = future.get();  // Blocks until done

// Shutdown properly
pool.shutdown();           // Stop accepting new tasks, finish running ones
pool.awaitTermination(30, TimeUnit.SECONDS);  // Wait for completion
pool.shutdownNow();        // Interrupt running tasks (last resort)
```

### Production-Grade Thread Pool

```java
// DON'T use Executors factory methods in production — they use unbounded queues
// DO configure ThreadPoolExecutor directly
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10,                            // corePoolSize — minimum threads
    50,                            // maxPoolSize — maximum threads
    60, TimeUnit.SECONDS,          // keepAliveTime for idle threads beyond core
    new LinkedBlockingQueue<>(1000), // bounded queue — prevents OOM
    new ThreadPoolExecutor.CallerRunsPolicy()  // rejection policy
);
```

> **Why avoid `Executors.newFixedThreadPool()`?** It uses an unbounded `LinkedBlockingQueue`. If tasks arrive faster than threads process them, the queue grows infinitely → `OutOfMemoryError`.

---

## CompletableFuture — Asynchronous Programming

### Problem with `Future`

`Future.get()` is **blocking**. You can't compose futures, chain them, or handle errors declaratively.

### CompletableFuture — The Solution

```java
// Async execution — runs on ForkJoinPool.commonPool()
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return fetchFromAPI();  // Runs asynchronously
});

// Chain transformations (non-blocking)
CompletableFuture<Integer> result = CompletableFuture
    .supplyAsync(() -> fetchUser(userId))           // Step 1: Fetch user
    .thenApply(user -> user.getOrderIds())          // Step 2: Get order IDs
    .thenApply(orderIds -> orderIds.size())          // Step 3: Count orders
    .exceptionally(ex -> {
        log.error("Failed", ex);
        return 0;                                    // Fallback value
    });
```

### Key Methods

| Method | Purpose | Analogy |
|--------|---------|---------|
| `supplyAsync(Supplier)` | Start async computation with result | Promise constructor |
| `thenApply(Function)` | Transform result (sync) | `.then()` with return |
| `thenAccept(Consumer)` | Consume result (no return) | `.then()` without return |
| `thenCompose(Function)` | Chain dependent futures (flatMap) | `.then()` returning a Promise |
| `thenCombine(Future, BiFunction)` | Combine two independent futures | `Promise.all` for two |
| `exceptionally(Function)` | Handle errors | `.catch()` |
| `handle(BiFunction)` | Handle result OR error | `.then(resolve, reject)` |

### Combining Multiple Futures

```java
CompletableFuture<String> user = CompletableFuture.supplyAsync(() -> fetchUser());
CompletableFuture<String> orders = CompletableFuture.supplyAsync(() -> fetchOrders());

// Wait for BOTH — like Promise.all()
CompletableFuture<Void> both = CompletableFuture.allOf(user, orders);
both.thenRun(() -> {
    String u = user.join();
    String o = orders.join();
    processUserOrders(u, o);
});

// Wait for FIRST — like Promise.race()
CompletableFuture<Object> first = CompletableFuture.anyOf(user, orders);
```

---

## ThreadLocal — Thread-Confined Storage

### Problem

In a multi-threaded server, you need per-request data (user ID, transaction context) accessible throughout the call stack without passing it as a parameter everywhere.

### The Solution

```java
public class UserContext {
    private static final ThreadLocal<String> currentUser = new ThreadLocal<>();
    
    public static void set(String userId) { currentUser.set(userId); }
    public static String get() { return currentUser.get(); }
    public static void clear() { currentUser.remove(); }
}

// In middleware/filter
UserContext.set(authenticatedUserId);
try {
    // Deep in the call stack, any method can access:
    String userId = UserContext.get();  // No parameter passing needed
} finally {
    UserContext.clear();  // CRITICAL — prevents memory leaks with thread pools
}
```

> **Critical Warning:** Always call `ThreadLocal.remove()` when done. In thread pools, threads are reused — stale ThreadLocal values leak to the next request, causing data corruption or memory leaks.

---

## Deadlock, Livelock, Starvation

### Deadlock

> Two or more threads blocked forever, each waiting for a lock held by the other.

```
Thread A: holds Lock1, waiting for Lock2
Thread B: holds Lock2, waiting for Lock1
→ Both wait forever — DEADLOCK

┌──────────┐     waiting for     ┌──────────┐
│ Thread A  │──────────────────►│  Lock 2   │
│ holds     │                    │ held by   │
│  Lock 1   │◄──────────────────│ Thread B  │
└──────────┘     waiting for     └──────────┘
```

**Four conditions (ALL must be true):**
1. **Mutual exclusion** — only one thread can hold the lock.
2. **Hold and wait** — thread holds one lock while waiting for another.
3. **No preemption** — locks can't be forcibly taken.
4. **Circular wait** — A waits for B, B waits for A.

**Prevention:**
- **Lock ordering** — always acquire locks in the same global order.
- **Timeout** — use `tryLock(timeout)` instead of blocking indefinitely.
- **Avoid nested locks** when possible.

### Livelock

Threads are not blocked but keep changing state in response to each other, making no progress. Like two people in a hallway who keep stepping aside in the same direction.

### Starvation

A thread never gets CPU time because higher-priority threads constantly take precedence. Solved with fair locks (`new ReentrantLock(true)`).

---

## Virtual Threads (Project Loom — Java 21+)

### Problem with Platform Threads

Each Java thread maps 1:1 to an OS thread. OS threads are expensive (~1MB stack, kernel scheduling overhead). With 10,000 concurrent connections, you need 10,000 OS threads — not feasible.

### The Solution: Virtual Threads

Virtual threads are **lightweight, JVM-managed threads** that are scheduled on a small pool of carrier (platform) threads.

```java
// Creating virtual threads
Thread vThread = Thread.ofVirtual().start(() -> {
    System.out.println("Running on virtual thread");
});

// ExecutorService with virtual threads — one thread per task, essentially free
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));  // Blocking is FINE — virtual thread unmounts
            return fetchFromDB();
        });
    }
}
```

### How Virtual Threads Work

```
┌──────────────────────────────────────────────┐
│              JVM Scheduler                    │
│                                              │
│  Virtual Thread 1 ──┐                        │
│  Virtual Thread 2 ──┼──► Carrier Thread 1    │  (Platform/OS Thread)
│  Virtual Thread 3 ──┘    (unmount/mount)     │
│                                              │
│  Virtual Thread 4 ──┐                        │
│  Virtual Thread 5 ──┼──► Carrier Thread 2    │
│  Virtual Thread 6 ──┘                        │
│                                              │
│  ...1,000,000 virtual threads on ~16 carrier │
│  threads (one per CPU core)                  │
└──────────────────────────────────────────────┘
```

When a virtual thread encounters a blocking operation (I/O, `sleep`):
1. The virtual thread **unmounts** from its carrier thread.
2. The carrier thread picks up another virtual thread.
3. When the I/O completes, the virtual thread is **remounted** on any available carrier.

### Platform vs Virtual Threads

| Aspect | Platform Threads | Virtual Threads |
|--------|-----------------|-----------------|
| Memory | ~1MB stack each | ~few KB |
| Max count | Thousands | **Millions** |
| Scheduling | OS kernel | JVM scheduler |
| Blocking cost | Expensive (holds OS thread) | Cheap (unmounts from carrier) |
| Use for | CPU-bound work | I/O-bound work |
| Pooling needed? | Yes (thread pools) | No (create per task) |

> **Key Insight:** With virtual threads, the "thread-per-request" model is viable again. No need for reactive programming complexity (Project Reactor, RxJava) for I/O concurrency. Just write simple blocking code — virtual threads make it efficient.

### When NOT to Use Virtual Threads

- CPU-bound work (they still share a few carrier threads)
- `synchronized` blocks that perform I/O (pins the carrier thread — use `ReentrantLock` instead)
- ThreadLocal with large per-thread data (millions of copies = massive memory)

---

## Interview Perspective

**Q: What is the difference between `synchronized` and `ReentrantLock`?**

Both provide mutual exclusion. `synchronized` is simpler (auto-release, implicit lock on `this`). `ReentrantLock` offers `tryLock()` (non-blocking attempt), `lockInterruptibly()` (cancel waiting), fairness (longest-waiting thread first), and multiple `Condition` objects. Always prefer `synchronized` for simple cases; use `ReentrantLock` when you need its advanced features.

**Q: What is a deadlock? How do you prevent it?**

A deadlock is when two or more threads are blocked forever, each waiting for a lock held by the other. Four conditions must be true: mutual exclusion, hold-and-wait, no preemption, circular wait. Prevent by: (1) acquiring locks in a consistent global order, (2) using `tryLock` with timeouts, (3) minimizing lock scope, (4) avoiding nested locking.

**Q: Explain `volatile` vs `synchronized`.**

`volatile` guarantees visibility (reads/writes go to main memory) and ordering, but NOT atomicity. `synchronized` guarantees visibility, ordering, AND atomicity. Use `volatile` for flags/status variables read by one thread and written by another. Use `synchronized` for compound operations (read-modify-write like `count++`).

**Q: What are virtual threads and how do they differ from platform threads?**

Virtual threads (Java 21) are lightweight, JVM-managed threads that multiplex onto a small pool of carrier (OS) threads. They use ~KB of memory vs ~1MB for platform threads, allowing millions of concurrent threads. When a virtual thread blocks on I/O, it unmounts from its carrier, freeing it for other virtual threads. Ideal for I/O-bound servers. Don't use for CPU-bound work.

**Q: Why should you use thread pools instead of creating threads manually?**

Thread creation is expensive (~1MB stack, OS overhead). Thread pools reuse a fixed set of threads, provide bounded resource usage (preventing OOM), offer rejection policies for overload, and manage lifecycle. Use `ThreadPoolExecutor` directly in production with bounded queues — `Executors` factory methods use unbounded queues that can cause OOM.

**Q: What is `CompletableFuture` and how does it improve over `Future`?**

`Future.get()` blocks. `CompletableFuture` supports non-blocking chaining (`thenApply`, `thenCompose`), error handling (`exceptionally`, `handle`), combining futures (`allOf`, `anyOf`), and runs on the ForkJoinPool by default. It's Java's equivalent of JavaScript Promises — enabling async programming without callback hell.

---

## Key Takeaways

- **`volatile`** = visibility guarantee. **`synchronized`** = visibility + atomicity. **Atomic classes** = lock-free atomicity for single variables.
- **Never create threads manually** in production. Use `ExecutorService` with bounded queues.
- **Deadlock prevention:** Lock ordering, `tryLock` with timeouts, minimize lock scope.
- **CompletableFuture** is Java's Promise — chain async operations without blocking.
- **Virtual threads** (Java 21) enable millions of lightweight threads. Write blocking code, get async performance.
- **ThreadLocal** must be cleaned up (`remove()`) in thread pools — otherwise data leaks between requests.
- **Read-heavy workloads:** Use `ReadWriteLock` for concurrent reads with exclusive writes.
- **`Executors` factory methods are dangerous** — use `ThreadPoolExecutor` with bounded queues in production.
