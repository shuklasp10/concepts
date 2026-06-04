# Scaling & Performance

> A Node.js application that works for 100 users will crumble under 100,000 unless you understand how to scale it. This chapter covers the mechanisms — from process-level scaling to application-level optimization — that transform a prototype into a production system.

---

## The Scaling Problem

### Why a Single Node.js Process Isn't Enough

Node.js runs JavaScript on a **single thread**. A modern server has 8, 16, or 64 CPU cores. A single Node process uses **one core** — the rest sit idle. Additionally, a single process has a memory limit (~1.5GB default V8 heap). For production workloads, you need to utilize all available resources.

### Two Dimensions of Scaling

| Dimension | Approach | How |
|-----------|----------|-----|
| **Vertical** | Make the process use more of the machine | Worker Threads, increase memory |
| **Horizontal** | Run more processes/machines | Cluster module, load balancer, Kubernetes |

---

## Cluster Module

### Problem It Solves

Utilize all CPU cores by forking multiple identical Node.js processes that share the same server port.

### How It Works Internally

```
                    ┌──────────────┐
                    │ Master Process│  ← Manages workers, doesn't serve requests
                    │   (PID: 100)  │
                    └──────┬───────┘
                           │ fork()
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌─────▼────┐ ┌─────▼────┐
        │ Worker 1  │ │ Worker 2  │ │ Worker 3  │  ← Each is a full Node process
        │ PID: 101  │ │ PID: 102  │ │ PID: 103  │     sharing port 3000
        └──────────┘ └──────────┘ └──────────┘
              ▲            ▲            ▲
              └────────────┼────────────┘
                           │
                    Incoming requests
                    (OS distributes via
                     round-robin / SO_REUSEPORT)
```

### Implementation

```javascript
import cluster from 'cluster';
import os from 'os';
import express from 'express';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers — one per CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code})`);
    console.log('Starting a new worker...');
    cluster.fork(); // Auto-restart
  });

} else {
  // Workers share the same port
  const app = express();

  app.get('/', (req, res) => {
    res.json({ worker: process.pid });
  });

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

### How Port Sharing Works

Workers don't each open port 3000 independently. The master process creates the listening socket and distributes incoming connections to workers using:
- **Round-robin** (default on Linux/macOS) — master accepts and distributes.
- **OS-level** (Windows) — the OS kernel distributes connections to workers.

### IPC (Inter-Process Communication)

Workers and the master can communicate via messages:

```javascript
// Master → Worker
worker.send({ type: 'CONFIG_UPDATE', data: newConfig });

// Worker → Master
process.send({ type: 'TASK_COMPLETE', workerId: process.pid });

// Listening
cluster.on('message', (worker, message) => {
  console.log(`Message from worker ${worker.process.pid}:`, message);
});
```

---

## Worker Threads vs Cluster Module

### The Critical Difference

| Feature | Cluster Module | Worker Threads |
|---------|---------------|----------------|
| **Creates** | Separate OS processes | Threads within the same process |
| **Memory** | Each process has its own memory (~30-50MB overhead each) | Share memory via `SharedArrayBuffer` |
| **Use Case** | Scale I/O-bound HTTP servers | Offload CPU-bound computation |
| **Communication** | IPC (serialized messages) | `postMessage()` + shared memory |
| **Port Sharing** | ✅ Multiple processes share one port | ❌ Not for HTTP servers |
| **Crash Isolation** | ✅ One worker crash doesn't affect others | ⚠️ Thread crash may affect main thread |

### Mental Model

- **Cluster** = Opening multiple branches of a restaurant (each fully independent, own kitchen, own staff).
- **Worker Threads** = Hiring extra cooks in the SAME kitchen (share ingredients, faster communication).

### Worker Threads Example

```javascript
// main.js
import { Worker } from 'worker_threads';

function runHeavyTask(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-task.js', {
      workerData: data,
    });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}

// In your route handler
app.get('/report', async (req, res) => {
  // Offload CPU-heavy work to a separate thread
  const result = await runHeavyTask({ type: 'generate_report', userId: req.user.id });
  res.json(result);
});
```

```javascript
// heavy-task.js
import { workerData, parentPort } from 'worker_threads';

// This runs in a separate thread — won't block the event loop
function generateReport(userId) {
  // CPU-intensive work: parsing, calculations, PDF generation, etc.
  let result = 0;
  for (let i = 0; i < 1_000_000_000; i++) {
    result += Math.sqrt(i);
  }
  return { userId, total: result };
}

const result = generateReport(workerData.userId);
parentPort.postMessage(result);
```

### When to Use Which

| Scenario | Use |
|----------|-----|
| Scaling an HTTP server to use all CPU cores | **Cluster** |
| Image/video processing in a web app | **Worker Threads** |
| Machine learning model inference | **Worker Threads** |
| Running multiple instances for high availability | **Cluster** (or PM2/Kubernetes) |
| One-off heavy computation (hash cracking, data parsing) | **Worker Threads** |

---

## PM2 — Production Process Manager

PM2 handles clustering, monitoring, log management, and auto-restart without you writing cluster code.

```bash
# Start with cluster mode (auto-detect CPUs)
pm2 start app.js -i max

# Or specify number of instances
pm2 start app.js -i 4

# Common commands
pm2 list                    # Show all running processes
pm2 logs                    # Stream logs
pm2 monit                   # Real-time monitoring dashboard
pm2 reload app              # Zero-downtime reload (graceful)
pm2 restart app             # Hard restart (drops connections)
pm2 delete app              # Stop and remove

# Ecosystem file (pm2.config.js) — recommended for production
module.exports = {
  apps: [{
    name: 'api-server',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

> **`pm2 reload` vs `pm2 restart`:** `reload` does zero-downtime — it starts new workers before killing old ones. `restart` kills all workers and starts fresh, causing brief downtime.

---

## Profiling CPU Bottlenecks

### Tools

| Tool | How | Best For |
|------|-----|----------|
| `--prof` flag | `node --prof app.js` → generates V8 log → `node --prof-process` to analyze | Finding hot functions |
| `--inspect` flag | `node --inspect app.js` → Chrome DevTools | CPU profiling, heap snapshots, live debugging |
| `clinic.js` | `clinic doctor -- node app.js` | Auto-detect event loop delays, I/O issues |
| `0x` | `0x app.js` | Generate flame graphs |

### Using Chrome DevTools

```bash
# Start with inspector
node --inspect src/server.js

# Open in Chrome: chrome://inspect
# Go to "Performance" tab → Record → Make requests → Stop
# Analyze the flame chart to find slow functions
```

### Identifying Event Loop Blocking

```javascript
// Simple event loop lag monitor
let lastCheck = Date.now();

setInterval(() => {
  const now = Date.now();
  const lag = now - lastCheck - 1000; // Expected interval is 1000ms
  if (lag > 100) {
    console.warn(`⚠️ Event loop lag: ${lag}ms`);
  }
  lastCheck = now;
}, 1000);
```

---

## Memory Leak Detection

### Common Causes

1. **Growing global arrays/maps** used as caches without eviction.
2. **Event listeners** added but never removed.
3. **Closures** capturing large objects unnecessarily.
4. **Unclosed** streams, database connections, or file handles.

### Detection Strategy

```javascript
// Monitor heap usage over time
setInterval(() => {
  const { heapUsed, heapTotal, rss } = process.memoryUsage();
  console.log({
    heapUsed: `${(heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(rss / 1024 / 1024).toFixed(2)} MB`,
  });
}, 10000);

// If heapUsed grows steadily without ever decreasing → memory leak
```

### Using Heap Snapshots

```bash
# Start with inspector
node --inspect src/server.js

# In Chrome DevTools → Memory tab:
# 1. Take a heap snapshot (baseline)
# 2. Run your workload for a few minutes
# 3. Take another heap snapshot
# 4. Compare snapshots — look for objects that grew
```

---

## Caching Strategies

### In-Memory Caching (Simple)

```javascript
// Simple in-memory cache with TTL
class MemoryCache {
  constructor(ttlMs = 60000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, { value, expiry: Date.now() + this.ttl });
  }
}

const cache = new MemoryCache(30000); // 30s TTL

app.get('/api/products', async (req, res) => {
  const cached = cache.get('products');
  if (cached) return res.json(cached);

  const products = await Product.find();
  cache.set('products', products);
  res.json(products);
});
```

> **Limitation:** In-memory caches are per-process. In a clustered environment, each worker has its own cache. Use Redis for shared caching.

### Redis Caching (Production)

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
});

// Cache middleware factory
function cacheMiddleware(ttlSeconds = 60) {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    const cached = await redis.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Monkey-patch res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      redis.setex(key, ttlSeconds, JSON.stringify(data));
      return originalJson(data);
    };

    next();
  };
}

// Usage
app.get('/api/products', cacheMiddleware(300), async (req, res) => {
  const products = await Product.find();
  res.json(products); // Automatically cached for 5 minutes
});
```

### Cache Invalidation Strategies

| Strategy | How | Trade-off |
|----------|-----|-----------|
| **TTL (Time-to-Live)** | Cache expires after X seconds | Simple, but stale data for TTL duration |
| **Write-through** | Update cache when DB is written | Always fresh, but complex |
| **Cache-aside** | App checks cache first, falls back to DB | Most common, requires invalidation logic |
| **Event-driven** | Invalidate cache when data changes (pub/sub) | Real-time, but complex infrastructure |

---

## Database Connection Pooling

### The Problem

Opening a new database connection for every request is expensive (~50-100ms per connection). With 1,000 concurrent requests, you'd need 1,000 connections — most databases cap out at 100-200.

### The Solution

Maintain a **pool** of reusable connections. When a request needs a connection, it borrows one from the pool. When done, it returns it.

```javascript
// PostgreSQL with pg pool
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  max: 20,             // Maximum connections in pool
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail if can't connect in 2s
});

// Usage in routes
app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users LIMIT 100');
  res.json(rows);
  // Connection is automatically returned to the pool
});

// Mongoose (MongoDB) connection pooling is built-in
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,  // Default is 100
  minPoolSize: 2,
});
```

---

## Server Startup Optimization

| Strategy | How | Impact |
|----------|-----|--------|
| **Lazy-load modules** | Import heavy modules only when first needed | Faster cold start |
| **Pre-compile templates** | Compile view templates at build time | Faster first request |
| **Warm up connections** | Connect to DB/Redis before `listen()` | First requests aren't slow |
| **Reduce dependencies** | Audit and remove unused npm packages | Smaller startup footprint |

```javascript
// Warm up connections before accepting traffic
async function startServer() {
  // 1. Connect to database
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Database connected');

  // 2. Connect to Redis
  await redis.ping();
  console.log('✅ Redis connected');

  // 3. THEN start accepting requests
  app.listen(3000, () => {
    console.log('✅ Server ready on port 3000');
  });
}

startServer().catch((err) => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});
```

---

## Interview Perspective

**Q: How does the Node.js cluster module work, and how does it help scale an application?**

The cluster module forks the main process into multiple child worker processes (one per CPU core). Each worker is a full Node.js process running the same server code. They share the server port — the OS or the master process distributes incoming connections across workers (round-robin). If a worker crashes, the master can automatically fork a replacement. This utilizes all CPU cores and provides basic fault tolerance.

**Q: Explain the difference between the cluster module and Worker Threads. When should you use which?**

Cluster creates separate OS processes — each with its own memory space (~30-50MB overhead). Use it to scale I/O-bound HTTP servers across CPU cores. Worker Threads create threads within the same process — they share memory via SharedArrayBuffer. Use them to offload CPU-bound computation (image processing, data parsing) without blocking the event loop. Cluster for scaling servers, Worker Threads for parallelizing computation.

**Q: How would you profile a Node.js application to find CPU bottlenecks?**

Start the app with `node --inspect` and use Chrome DevTools Performance tab to record and analyze flame charts. For automated analysis, use clinic.js (`clinic doctor`) to detect event loop delays and I/O bottlenecks. For production, monitor event loop lag with a simple interval timer. Use `node --prof` for V8-level function profiling.

**Q: What strategies would you use to optimize the startup time of a Node.js server?**

Warm up database and Redis connections before calling `app.listen()`. Lazy-load heavy modules that aren't needed at startup. Remove unused dependencies. Pre-compile templates at build time. Use `--max-semi-space-size` V8 flag to optimize garbage collection for short-lived objects during startup.

---

## Key Takeaways

- **Cluster module** = multiple processes sharing one port. For I/O-bound scaling.
- **Worker Threads** = threads sharing memory. For CPU-bound computation.
- **PM2** handles clustering, monitoring, and zero-downtime reloads in production.
- **Redis caching** is essential for production — in-memory caches are per-process.
- **Connection pooling** prevents database connection exhaustion.
- **Warm up connections before `app.listen()`** — don't let the first request pay the connection cost.
- **Monitor event loop lag** — any delay > 100ms means you're blocking the thread.
- **Memory leaks** show as steadily growing `heapUsed` — use heap snapshots to diagnose.
