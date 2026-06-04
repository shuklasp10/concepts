# Asynchronous Programming

> Asynchronous programming is the backbone of Node.js. It evolved from callbacks → Promises → async/await, each solving the limitations of the previous approach. Mastering these patterns is non-negotiable for backend development.

---

## Why Async Matters in Node.js

### The Problem

Node.js has a **single main thread**. If you perform a synchronous operation that takes 5 seconds (reading a large file, querying a database), the entire server is blocked — no other requests can be handled. For a server handling 1,000 concurrent users, this is catastrophic.

### The Solution

Every I/O operation in Node.js has an **asynchronous version**. Instead of waiting for the result, you provide instructions for what to do **when the result arrives** (via callbacks, Promises, or async/await). The event loop continues handling other work in the meantime.

```javascript
// ❌ Synchronous — blocks the event loop for the entire read
const data = fs.readFileSync('/huge-file.csv', 'utf-8');
processData(data);

// ✅ Asynchronous — event loop is free while file is being read
fs.readFile('/huge-file.csv', 'utf-8', (err, data) => {
  processData(data);
});
```

---

## Phase 1: Callbacks

### The Pattern

A callback is a function passed as an argument to another function, executed when the async operation completes. Node.js uses the **error-first callback** convention.

```javascript
// Error-first callback pattern:
// First argument is always the error (null if no error)
// Second argument is the result

fs.readFile('/data.txt', 'utf-8', (err, data) => {
  if (err) {
    console.error('Failed to read file:', err.message);
    return; // ← Important! Stop execution on error
  }
  console.log(data);
});
```

### Why Error-First?

Without a standard, every library would handle errors differently. The error-first convention ensures:
1. You always check for errors first.
2. If `err` is `null` or `undefined`, the operation succeeded.
3. Every Node core API follows this pattern consistently.

### Callback Hell (Pyramid of Doom)

The fundamental flaw of callbacks — sequential async operations lead to deeply nested code that is impossible to read, debug, or maintain.

```javascript
// Read a file → parse it → query DB → send email → log result
fs.readFile('config.json', 'utf-8', (err, configData) => {
  if (err) return handleError(err);
  const config = JSON.parse(configData);
  
  db.query('SELECT * FROM users', (err, users) => {
    if (err) return handleError(err);
    
    emailService.send(users[0].email, config.template, (err, result) => {
      if (err) return handleError(err);
      
      logger.log('Email sent', (err) => {
        if (err) return handleError(err);
        console.log('All done!');
      });
    });
  });
});
```

**Problems:**
1. **Readability:** Code moves right, not down. Hard to follow the flow.
2. **Error handling:** Duplicated `if (err)` blocks at every level.
3. **Control flow:** Implementing parallel operations, retries, or timeouts is extremely complex.

---

## Phase 2: Promises

### Problem They Solve

Promises solve callback hell by providing a **chainable, flat structure** for async operations, with centralized error handling.

### Mental Model

A Promise is like an **order receipt at a restaurant**. When you place an order:
- You get a receipt immediately (the Promise object).
- The receipt doesn't have your food yet (pending state).
- Eventually, the kitchen either **delivers your food** (fulfilled/resolved) or **tells you they're out of that dish** (rejected).

### Three States

```
Promise Lifecycle:
                    ┌──→ Fulfilled (resolved with a value)
Pending ────────────┤
                    └──→ Rejected (rejected with a reason/error)

Once settled (fulfilled or rejected), a Promise NEVER changes state again.
```

### Creating and Using Promises

```javascript
// Creating a Promise
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) reject(err);   // transition to rejected
      else resolve(data);     // transition to fulfilled
    });
  });
}

// Using the Promise — flat chain instead of nested callbacks
readFileAsync('config.json')
  .then(configData => JSON.parse(configData))
  .then(config => db.query('SELECT * FROM users'))
  .then(users => emailService.send(users[0].email))
  .then(result => logger.log('Email sent'))
  .catch(err => {
    // ONE centralized error handler for the entire chain
    console.error('Something failed:', err.message);
  })
  .finally(() => {
    // Runs regardless of success or failure (cleanup)
    console.log('Operation complete');
  });
```

### How `.then()` Chaining Works Internally

Each `.then()` returns a **new Promise**. This is what makes chaining possible.

```javascript
// What's actually happening:
const p1 = readFileAsync('config.json');           // Promise<string>
const p2 = p1.then(data => JSON.parse(data));      // Promise<object>
const p3 = p2.then(config => fetchUsers(config));   // Promise<User[]>

// If any Promise in the chain rejects, the error "falls through"
// to the nearest .catch()
```

> **Key Insight:** If you return a **value** from `.then()`, it's automatically wrapped in `Promise.resolve(value)`. If you return a **Promise**, the chain waits for it to settle. If you **throw** an error, it's wrapped in `Promise.reject(error)`.

---

## Phase 3: Async/Await

### Problem It Solves

Promise chains are better than callbacks but still require `.then()` nesting for complex flows. `async/await` makes asynchronous code **look and behave like synchronous code**, while remaining non-blocking.

### How It Works Internally

`async/await` is **syntactic sugar over Promises**. Under the hood:
- `async function` always returns a Promise.
- `await` pauses the function execution (not the event loop!) until the Promise resolves.
- The paused function is resumed by the microtask queue when the Promise settles.

```javascript
// Promise chain:
function getUser() {
  return fetch('/api/user')
    .then(res => res.json())
    .then(user => fetch(`/api/posts/${user.id}`))
    .then(res => res.json());
}

// Same logic with async/await:
async function getUser() {
  const res = await fetch('/api/user');
  const user = await res.json();
  const postsRes = await fetch(`/api/posts/${user.id}`);
  return await postsRes.json();
}
```

### Error Handling with Try/Catch

```javascript
async function processOrder(orderId) {
  try {
    const order = await db.findOrder(orderId);
    const payment = await paymentService.charge(order.total);
    const shipment = await shippingService.ship(order.address);
    return { order, payment, shipment };
  } catch (err) {
    // Catches errors from ANY of the awaited operations
    console.error('Order processing failed:', err.message);
    throw err; // Re-throw to propagate to caller
  }
}
```

### The Forgotten `await` Bug

```javascript
async function dangerous() {
  try {
    // ⚠️ FORGOT await — the Promise is NOT awaited
    riskyAsyncOperation(); // This returns a Promise, but we don't await it
    console.log('This runs IMMEDIATELY, not after the operation');
  } catch (err) {
    // ❌ This catch will NEVER catch errors from the async operation
    // because we didn't await the Promise
    console.error(err);
  }
}
```

> **Rule:** If you forget `await`, the try/catch doesn't catch the error. The Promise rejection becomes an **unhandled rejection**, which will crash Node.js in newer versions.

---

## Promise Combinators

### Comparison Table

| Method | Resolves When | Rejects When | Use Case |
|--------|--------------|-------------|----------|
| `Promise.all()` | **All** Promises resolve | **Any one** rejects | Fetch multiple independent resources. Fail-fast. |
| `Promise.allSettled()` | **All** Promises settle (resolve or reject) | **Never** rejects | Get results of all operations, even if some fail |
| `Promise.race()` | **First** Promise settles (resolve or reject) | **First** Promise rejects | Timeout pattern, fastest response |
| `Promise.any()` | **First** Promise resolves | **All** reject (AggregateError) | First successful result from multiple sources |

### Examples

```javascript
// Promise.all — Parallel fetching (fail-fast)
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);
// If fetchPosts() fails → ENTIRE Promise.all rejects
// Users and comments results are lost

// Promise.allSettled — Get everything, handle failures individually
const results = await Promise.allSettled([
  fetchUsers(),
  fetchPosts(),     // Even if this fails...
  fetchComments(),
]);
// results = [
//   { status: 'fulfilled', value: [...users] },
//   { status: 'rejected', reason: Error('DB down') },
//   { status: 'fulfilled', value: [...comments] }
// ]

// Promise.race — Timeout pattern
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  ),
]);

// Promise.any — First success from redundant sources
const fastest = await Promise.any([
  fetchFromCDN1(),
  fetchFromCDN2(),
  fetchFromCDN3(),
]);
// Returns the first one that resolves (ignores rejections)
```

---

## Event Emitter Pattern

### Core Idea

The Event Emitter is Node's implementation of the **Observer/Pub-Sub pattern**. An object emits named events, and listener functions are called when those events fire.

### How It Works

```javascript
import { EventEmitter } from 'events';

class OrderService extends EventEmitter {
  placeOrder(order) {
    // Business logic...
    this.emit('orderPlaced', order);       // Fire event with data
    this.emit('notification', order.userId); // Fire another event
  }
}

const orderService = new OrderService();

// Register listeners
orderService.on('orderPlaced', (order) => {
  console.log(`Order ${order.id} placed — updating inventory`);
});

orderService.on('orderPlaced', (order) => {
  console.log(`Order ${order.id} placed — sending confirmation email`);
});

orderService.on('notification', (userId) => {
  console.log(`Notifying user ${userId}`);
});

orderService.placeOrder({ id: 1, userId: 42 });
```

### Key Methods

| Method | Description |
|--------|-------------|
| `emitter.on(event, fn)` | Register a listener (alias: `addListener`) |
| `emitter.once(event, fn)` | Register a one-time listener (auto-removed after first call) |
| `emitter.emit(event, ...args)` | Fire the event, calling all listeners synchronously |
| `emitter.off(event, fn)` | Remove a specific listener (alias: `removeListener`) |
| `emitter.removeAllListeners(event)` | Remove all listeners for an event |
| `emitter.listenerCount(event)` | Number of listeners registered for an event |

> **Important:** Listeners registered with `.on()` are called **synchronously** in the order they were registered. This is different from browser events which are asynchronous.

### Building a Custom Event Emitter (Interview Favorite)

```javascript
class MyEventEmitter {
  constructor() {
    this.events = {}; // { eventName: [fn1, fn2, ...] }
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return this; // for chaining
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(listener => listener(...args));
    return true;
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(fn => fn !== listener);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper); // remove after first call
    };
    this.on(event, wrapper);
    return this;
  }
}
```

---

## `util.promisify()`

### Problem It Solves

Many older Node.js APIs and npm packages only support the error-first callback pattern. `util.promisify()` converts them to Promise-based APIs.

```javascript
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';

// Before — callback style
fs.readFile('data.txt', 'utf-8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// After — promisified
const readFile = promisify(fs.readFile);
const data = await readFile('data.txt', 'utf-8');
console.log(data);

// Promisify exec for shell commands
const execAsync = promisify(exec);
const { stdout } = await execAsync('ls -la');
```

> **Note:** Most Node core modules now have a built-in Promise API via the `fs/promises`, `dns/promises`, `stream/promises` sub-modules. Prefer these over `promisify()`.

```javascript
// Modern approach — no promisify needed
import { readFile } from 'fs/promises';
const data = await readFile('data.txt', 'utf-8');
```

---

## Retry Mechanism for Failing API Calls

### Implementation

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`All ${maxRetries} attempts failed for ${url}`);
      }
      
      // Exponential backoff: 1s → 2s → 4s
      const backoff = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

// Usage
const data = await fetchWithRetry('https://api.example.com/data', {}, 3, 1000);
```

### Why Exponential Backoff?

If a server is overwhelmed and 1,000 clients all retry simultaneously after 1 second, they hit the server again in a burst. Exponential backoff spaces retries out (1s, 2s, 4s, 8s...), reducing thundering-herd pressure.

---

## Preventing Event Loop Blocking

### The Problem

Processing large arrays synchronously blocks the event loop:

```javascript
// ❌ Blocks the event loop — no requests served during this
function processMillionRecords(records) {
  for (let i = 0; i < records.length; i++) {
    heavyComputation(records[i]); // CPU-bound work
  }
}
```

### Solutions

**1. Break into chunks with `setImmediate()`:**

```javascript
function processInChunks(records, chunkSize = 100) {
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunkSize, records.length);
    for (let i = index; i < end; i++) {
      heavyComputation(records[i]);
    }
    index = end;

    if (index < records.length) {
      // Yield to event loop — let it handle pending I/O
      setImmediate(processChunk);
    }
  }

  processChunk();
}
```

**2. Use Worker Threads for CPU-heavy work:**

```javascript
import { Worker } from 'worker_threads';

function runInWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-task.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

---

## Unhandled Rejections

```javascript
// Always handle rejected Promises!
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // In production: log to monitoring service, then exit
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // ALWAYS exit after uncaughtException — the process is in an undefined state
  process.exit(1);
});
```

> **Best Practice:** In production, use `unhandledRejection` and `uncaughtException` handlers to log errors to a monitoring service (like Sentry) and then **exit the process**. Let your process manager (PM2, Kubernetes) restart it.

---

## Interview Perspective

**Q: Explain the transition from callbacks to Promises, and then to async/await. What problems did each solve?**

Callbacks enabled async programming but caused "callback hell" — deeply nested, hard-to-read code with duplicated error handling. Promises solved nesting by providing flat `.then()` chains and centralized `.catch()` error handling. `async/await` (syntactic sugar over Promises) solved the remaining readability issue by making async code look synchronous while remaining non-blocking.

**Q: How does `Promise.all()` differ from `Promise.allSettled()`, and when would you use each?**

`Promise.all()` fails fast — if any Promise rejects, the entire result is lost. Use it when all operations must succeed (e.g., loading all required data for a page). `Promise.allSettled()` waits for every Promise to settle and returns each result with its status. Use it when you want partial results even if some operations fail (e.g., sending notifications to multiple users).

**Q: What happens if you forget to `await` an async function inside a try/catch block?**

The async function returns a Promise immediately, and the code continues without waiting. The try/catch won't catch any errors from that Promise because the rejection happens asynchronously after the catch block has already completed. The error becomes an unhandled rejection.

**Q: How do you prevent blocking the event loop when processing large arrays of data?**

Break the work into chunks using `setImmediate()` to yield control to the event loop between chunks, allowing I/O events to be processed. For CPU-heavy operations, use Worker Threads to offload computation to separate threads entirely.

**Q: How do you implement a retry mechanism for a failing asynchronous API call?**

Use a loop with a counter, try/catch inside, and exponential backoff delay between retries. On each failure, wait `delay * 2^attempt` milliseconds before retrying. After the max number of retries, throw the final error. This prevents thundering-herd problems and gives transient failures time to recover.

**Q: How do you use `util.promisify`, and why is it useful?**

`util.promisify()` takes a function that follows the error-first callback pattern and returns a version that returns a Promise. It's useful for converting legacy callback-based APIs to modern Promise-based code. Modern Node.js provides built-in Promise APIs (e.g., `fs/promises`) which should be preferred.

**Q: What is the Event Emitter? How would you build a custom Event Emitter class?**

The Event Emitter is Node's implementation of the observer pattern. It maintains a map of event names to arrays of listener functions. `on()` pushes a listener, `emit()` iterates and calls all listeners synchronously, `off()` filters out a specific listener, and `once()` wraps the listener in a function that removes itself after the first call.

---

## Key Takeaways

- **Callbacks → Promises → async/await** is an evolution, not a replacement. All three still exist in Node.
- **Error-first callback** is the universal Node convention: `(err, result) => {}`.
- **Promise chains are flat.** Each `.then()` returns a new Promise. Errors fall through to `.catch()`.
- **`async/await` is syntactic sugar.** `await` pauses the function, not the event loop.
- **Forgotten `await`** = unhandled rejection = potential crash.
- **`Promise.all` fails fast.** `Promise.allSettled` gets everything.
- **Break CPU work into chunks** with `setImmediate()` or use Worker Threads.
- **Always handle** `unhandledRejection` and `uncaughtException` in production.
