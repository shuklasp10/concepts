# Architecture & Event Loop

> Node.js is a JavaScript runtime built on Chrome's V8 engine and libuv. It uses a single-threaded, event-driven, non-blocking I/O model that makes it lightweight and efficient for building scalable network applications.

---

## What is Node.js?

### Problem It Solves

Traditional web servers (like Apache) create a **new thread for every incoming request**. If 10,000 users connect simultaneously, the server needs 10,000 threads. Each thread consumes memory (~2MB stack), and the constant context-switching between threads kills performance. This is the **C10K problem** — how do you handle 10,000 concurrent connections efficiently?

### The Solution

Node.js takes a radically different approach: **one thread, one event loop, non-blocking I/O**. Instead of spawning thousands of threads, Node uses a single thread that delegates heavy I/O work (file reads, database queries, network calls) to the operating system or a thread pool. When the work completes, a callback is placed on the event queue, and the single thread picks it up.

### Mental Model

Think of a **restaurant with one waiter** (single thread) vs a restaurant with **one waiter per table** (multi-threaded server like Apache).

- **Apache model:** Each table gets a dedicated waiter. If 100 tables are occupied, you need 100 waiters. Most waiters are idle — just standing around waiting for the kitchen (I/O). Expensive.
- **Node.js model:** One waiter takes all orders. He doesn't stand and wait at the kitchen window. He places the order, moves to the next table, and when the kitchen rings a bell (callback), he picks up the food and delivers it. One waiter can serve the entire restaurant.

> **Key Insight:** Node.js is not "faster" than Java or Go in raw computation. It is faster for **I/O-bound workloads** because it never blocks the thread waiting for I/O.

---

## The Three Pillars of Node.js

Node.js is not just JavaScript. It is a combination of three technologies:

```
┌──────────────────────────────┐
│        Your JavaScript       │  ← Application code
├──────────────────────────────┤
│       Node.js Bindings       │  ← C++ glue (connects JS to system)
│          (Node API)          │
├──────────┬───────────────────┤
│    V8    │      libuv        │  ← Engine + Async I/O
│ (Google) │  (Cross-platform) │
└──────────┴───────────────────┘
```

### 1. V8 Engine (by Google)

- **What it does:** Compiles JavaScript directly to machine code (no interpreter step).
- **How:** Uses **Just-In-Time (JIT) compilation**. It first compiles JS to unoptimized machine code (Ignition — bytecode interpreter), then identifies "hot" functions (frequently called) and recompiles them with aggressive optimizations (TurboFan — optimizing compiler).
- **Hidden Classes:** V8 creates hidden classes for objects to make property access as fast as C++ struct access. If you dynamically add/delete properties, V8 creates new hidden classes, slowing things down.

### 2. libuv (Cross-platform Async I/O)

- **What it does:** Provides the **event loop** and a **thread pool** (default: 4 threads) for operations the OS can't do asynchronously.
- **Thread pool handles:** File system operations, DNS lookups, compression (zlib), crypto operations.
- **OS-level async handles:** Network I/O (TCP/UDP), pipes, signals — these use OS-level mechanisms (epoll on Linux, kqueue on macOS, IOCP on Windows).

### 3. Node.js Bindings (C++ Addons)

- The bridge between your JavaScript and the C/C++ world. When you call `fs.readFile()`, you're calling a JavaScript function that internally invokes C++ code through V8's bindings.

| Component | Role | Written In |
|-----------|------|------------|
| V8 | Compiles and executes JS | C++ |
| libuv | Event loop, async I/O, thread pool | C |
| Node Bindings | Connects JS ↔ C++ | C++ |
| Your Code | Application logic | JavaScript |

---

## The Event Loop — Deep Dive

### Core Idea

> The event loop is the heart of Node.js. It is an infinite loop that waits for tasks, executes them, and then sleeps until more tasks arrive.

### Why Understanding It Matters

If you don't understand the event loop, you will:
1. Accidentally block the main thread and freeze your server.
2. Misorder your async operations.
3. Fail to debug race conditions and timing bugs.
4. Not understand why `process.nextTick()` fires before `setTimeout()`.

### The Six Phases

The event loop runs through **six phases** in a fixed order. Each phase has a FIFO queue of callbacks to execute.

```
   ┌───────────────────────────┐
┌─►│         timers             │ ← setTimeout, setInterval callbacks
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │     pending callbacks      │ ← I/O callbacks deferred to next loop
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │       idle, prepare        │ ← Internal use only (Node internals)
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │          poll              │ ← Retrieve new I/O events; execute I/O callbacks
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │          check             │ ← setImmediate() callbacks
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │      close callbacks       │ ← socket.on('close', ...)
│  └───────────┴───────────────┘
│              │
└──────────────┘  (loop back to timers)
```

#### Phase 1 — Timers
Executes callbacks scheduled by `setTimeout()` and `setInterval()`. A timer specifies a **minimum delay**, not a guaranteed exact time. The callback runs as soon as the event loop reaches this phase after the delay has elapsed.

#### Phase 2 — Pending Callbacks
Executes I/O callbacks that were deferred to the next loop iteration. Example: some TCP errors (like `ECONNREFUSED`) are reported here.

#### Phase 3 — Idle, Prepare
Used internally by Node.js. You never interact with this phase directly.

#### Phase 4 — Poll (Most Important)
This is where the event loop spends most of its time. It does two things:
1. **Calculates** how long it should block and poll for I/O.
2. **Processes** events in the poll queue (file read completions, incoming network data, etc.).

If the poll queue is empty:
- If `setImmediate()` callbacks are scheduled → move to the **check** phase.
- If timers have expired → loop back to the **timers** phase.
- Otherwise → **block here** waiting for new I/O events.

#### Phase 5 — Check
Executes `setImmediate()` callbacks. This phase always runs after the poll phase, making `setImmediate()` fire before any timers scheduled during the poll phase.

#### Phase 6 — Close Callbacks
Handles close events like `socket.on('close', ...)`. If a socket was abruptly destroyed, the `close` event fires here.

---

## Microtasks vs Macrotasks

### The Critical Distinction

Between **every phase** of the event loop, Node.js drains two special queues:
1. **`process.nextTick()` queue** (highest priority)
2. **Promise microtask queue** (`.then()`, `.catch()`, `.finally()`)

These are NOT part of the six phases. They run **between** phases.

```
timers → [drain nextTick queue] → [drain microtask queue] →
pending → [drain nextTick queue] → [drain microtask queue] →
idle    → ...
poll    → [drain nextTick queue] → [drain microtask queue] →
check   → [drain nextTick queue] → [drain microtask queue] →
close   → [drain nextTick queue] → [drain microtask queue] →
(loop)
```

### Terminology

| Term | Examples | When It Runs |
|------|----------|-------------|
| **Microtask** | `Promise.then()`, `queueMicrotask()` | Between event loop phases |
| **`process.nextTick()`** | `process.nextTick(cb)` | Before microtasks, between phases |
| **Macrotask** | `setTimeout`, `setInterval`, `setImmediate`, I/O | During the appropriate phase |

### Execution Order

```javascript
console.log('1 — synchronous');

setTimeout(() => console.log('2 — setTimeout (timers phase)'), 0);

setImmediate(() => console.log('3 — setImmediate (check phase)'));

Promise.resolve().then(() => console.log('4 — Promise microtask'));

process.nextTick(() => console.log('5 — process.nextTick'));

console.log('6 — synchronous');
```

**Output:**
```
1 — synchronous
6 — synchronous
5 — process.nextTick        ← nextTick fires first (highest priority)
4 — Promise microtask       ← then promises
2 — setTimeout (timers)     ← macrotask (order with setImmediate is non-deterministic here)
3 — setImmediate (check)
```

> **Why is `setTimeout` vs `setImmediate` order non-deterministic in the main module?** Because it depends on how fast the process starts. If the event loop enters the timers phase before 1ms elapses (minimum `setTimeout` delay), `setImmediate` fires first. If it enters after, `setTimeout` fires first. **Inside an I/O callback, `setImmediate` always fires first** because the I/O callback runs in the poll phase, and the check phase (setImmediate) comes right after.

---

## `process.nextTick()` vs `setImmediate()` vs `setTimeout()`

| Feature | `process.nextTick()` | `setImmediate()` | `setTimeout(fn, 0)` |
|---------|----------------------|-------------------|---------------------|
| **When** | Before any I/O, between phases | After poll phase (check phase) | After minimum delay (timers phase) |
| **Priority** | Highest | Medium | Depends on delay |
| **Starvation risk** | **Yes** — recursive calls block the loop | No | No |
| **Use case** | Ensure callback runs immediately after current operation, before I/O | Execute after I/O events are processed | Delay execution by minimum ~1ms |

### The Starvation Problem

```javascript
// DANGER: This will starve the event loop!
// No I/O, timers, or anything else will ever run.
function recursiveNextTick() {
  process.nextTick(recursiveNextTick);
}
recursiveNextTick();
```

`process.nextTick()` is drained **completely** before moving to the next phase. If it keeps adding to itself, the event loop never progresses. `setImmediate` does not have this problem because it runs in a dedicated phase.

> **Best Practice:** Use `setImmediate()` unless you have a specific reason to use `process.nextTick()`. The Node.js docs recommend `setImmediate()` for most cases.

---

## V8 Garbage Collection

### How It Works

V8 uses a **generational garbage collector** with two main regions:

1. **Young Generation (New Space):** Small (~1–8 MB). Newly allocated objects live here. Collected very frequently using the **Scavenger** (minor GC). Objects that survive two GC cycles are promoted to the Old Generation.

2. **Old Generation (Old Space):** Larger (~1.5 GB default). Long-lived objects. Collected less frequently using **Mark-Sweep** and **Mark-Compact** (major GC).

### Mental Model

- **Young Generation** = A desk where you put sticky notes (temporary variables). You clean it off every few minutes.
- **Old Generation** = A filing cabinet for permanent documents. You reorganize it occasionally.

### Identifying Memory Leaks

Common causes:
1. **Global variables** that grow indefinitely (arrays, maps used as caches without eviction).
2. **Closures** that accidentally capture large objects.
3. **Event listeners** that are never removed.
4. **Unclosed** database connections or streams.

Tools:
- `--inspect` flag + Chrome DevTools (Memory tab → Heap Snapshots)
- `process.memoryUsage()` — returns `{ rss, heapTotal, heapUsed, external }`
- `node --max-old-space-size=4096` — increase heap if needed (not a fix, a band-aid)

```javascript
// Check memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
}, 5000);
```

---

## How Node.js Handles Concurrent Requests

### Step-by-Step Flow

```
Client A sends HTTP request
        │
        ▼
┌─────────────────────┐
│   Main Thread        │  1. Parses request
│   (Event Loop)       │  2. Calls your route handler
│                      │  3. Encounters db.query() — async I/O
│                      │  4. Delegates to libuv thread pool
│                      │  5. IMMEDIATELY moves to next request
└────────┬────────────┘
         │
Client B sends HTTP request
         │
         ▼
   Main Thread handles B   ← No waiting! B is processed while A's DB query runs
         │
   ┌─────▼──────┐
   │  Thread Pool │ ← A's DB query completes
   └─────┬──────┘
         │
         ▼
   Callback queued on event loop
         │
         ▼
   Main Thread picks up A's callback → sends response to Client A
```

> **Key Insight:** The single thread never waits. It delegates I/O, serves other requests, and picks up results when they're ready. This is why Node.js handles thousands of concurrent I/O operations with minimal resources.

### When Node.js Struggles

Node.js is **not suitable** for **CPU-bound** tasks (image processing, video encoding, heavy computation). A single CPU-heavy operation blocks the event loop, and every other request waits. Solutions:
- **Worker Threads** — offload CPU work to separate threads.
- **Child Processes** — spawn separate processes.
- **Cluster Module** — fork multiple Node processes.

---

## Interview Perspective

**Q: Explain the Node.js Event Loop architecture. What are its different phases?**

The event loop has six phases: timers (setTimeout/setInterval), pending callbacks (deferred I/O), idle/prepare (internal), poll (I/O events — where most time is spent), check (setImmediate), and close callbacks. Between every phase, the `process.nextTick()` queue and Promise microtask queue are drained completely.

**Q: How does Node.js handle concurrent requests despite being single-threaded?**

Node uses a single thread for executing JavaScript but delegates I/O operations to the OS kernel (for network I/O) or libuv's thread pool (for file system, DNS, crypto). While I/O is in progress, the main thread continues handling other requests. When I/O completes, a callback is enqueued on the event loop. This allows thousands of concurrent I/O operations without the overhead of thread-per-request.

**Q: What is the role of libuv in Node.js?**

libuv is a C library that provides the event loop implementation and a cross-platform abstraction for async I/O. It handles the thread pool (default 4 threads for file system, DNS, crypto), uses OS-level async mechanisms (epoll/kqueue/IOCP) for network I/O, and provides APIs for timers, child processes, and signals.

**Q: Explain the difference between `process.nextTick()`, `setImmediate()`, and `setTimeout()`.**

`process.nextTick()` fires immediately after the current operation completes, before any I/O — it has the highest priority and can starve the event loop if used recursively. `setImmediate()` fires in the check phase, after the poll phase processes I/O. `setTimeout(fn, 0)` fires in the timers phase with a minimum ~1ms delay. Inside an I/O callback, `setImmediate` always fires before `setTimeout(fn, 0)`.

**Q: How does the V8 engine compile and execute JavaScript in a Node environment?**

V8 uses JIT (Just-In-Time) compilation. It first parses JavaScript into an Abstract Syntax Tree, then compiles it to bytecode via Ignition (the interpreter). Frequently executed ("hot") functions are identified and recompiled with aggressive optimizations by TurboFan (the optimizing compiler) directly to machine code. If assumptions fail (deoptimization), V8 falls back to the bytecode.

**Q: Describe the difference between a microtask and a macrotask in the context of the event loop.**

Macrotasks (setTimeout, setInterval, setImmediate, I/O callbacks) execute in their respective event loop phases. Microtasks (Promise callbacks, queueMicrotask) and `process.nextTick()` callbacks execute between phases — the entire queue is drained before the event loop moves on. `process.nextTick()` has higher priority than Promise microtasks.

---

## Key Takeaways

- **Node.js = V8 + libuv + C++ bindings.** V8 compiles JS, libuv provides async I/O and the event loop.
- **Single-threaded does not mean single-process.** I/O is delegated to the OS or a thread pool.
- **Event loop has 6 phases.** Poll is where most time is spent. Microtasks run between every phase.
- **`process.nextTick()` > Promise microtasks > macrotasks** in priority.
- **Never block the event loop** with CPU-heavy synchronous work. Use Worker Threads or child processes.
- **Node excels at I/O-bound workloads.** Not suitable for raw CPU computation on the main thread.
