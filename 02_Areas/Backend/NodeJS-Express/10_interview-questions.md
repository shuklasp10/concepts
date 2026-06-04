# Node.js & Express Interview Questions — Quick Reference

> 50 questions covering mid-level to senior concepts. Each answer references the detailed notes for deep understanding. Curated for a 4+ year experienced developer targeting top product-based companies.

---

## Core Node.js Mechanics & Architecture

### 1. Explain the Node.js Event Loop architecture. What are its different phases?
**One-liner:** The event loop has six phases — timers, pending callbacks, idle/prepare, poll, check, close callbacks — with microtask queues drained between every phase.
- The poll phase is where most time is spent (waiting for I/O). `process.nextTick()` and Promise microtasks run between phases, not during them.
📖 [Detailed notes](1_architecture-and-event-loop.md#the-event-loop--deep-dive)

### 2. How does Node.js handle concurrent requests despite being single-threaded?
**One-liner:** Node delegates I/O to the OS kernel (network) or libuv's thread pool (file system, DNS, crypto), keeping the single main thread free to handle other requests.
- The main thread never waits for I/O — it queues callbacks that fire when I/O completes. This is why Node handles thousands of concurrent connections with minimal resources.
📖 [Detailed notes](1_architecture-and-event-loop.md#how-nodejs-handles-concurrent-requests)

### 3. What is the role of libuv in Node.js?
**One-liner:** libuv is a C library that provides the event loop, a cross-platform abstraction for async I/O, and a thread pool (default 4 threads) for blocking operations.
- Thread pool handles: file system, DNS, crypto, zlib. OS-level async handles: network I/O (epoll/kqueue/IOCP).
📖 [Detailed notes](1_architecture-and-event-loop.md#the-three-pillars-of-nodejs)

### 4. Explain the difference between `process.nextTick()`, `setImmediate()`, and `setTimeout()`.
**One-liner:** `process.nextTick()` fires between phases (highest priority, can starve), `setImmediate()` fires in the check phase (after poll), `setTimeout(fn, 0)` fires in the timers phase (~1ms delay).
| Feature | `process.nextTick()` | `setImmediate()` | `setTimeout(fn, 0)` |
|---------|---------------------|-------------------|---------------------|
| Priority | Highest | Medium | Depends on delay |
| Starvation | Yes | No | No |
📖 [Detailed notes](1_architecture-and-event-loop.md#processnexttick-vs-setimmediate-vs-settimeout)

### 5. How does the V8 engine compile and execute JavaScript in a Node environment?
**One-liner:** V8 uses JIT compilation — first compiles to bytecode via Ignition (interpreter), then identifies hot functions and recompiles with TurboFan (optimizing compiler) to machine code.
📖 [Detailed notes](1_architecture-and-event-loop.md#1-v8-engine-by-google)

### 6. What are the differences between CommonJS and ES Modules in Node.js?
**One-liner:** CommonJS uses `require()`/`module.exports` (synchronous, runtime-resolved), ESM uses `import`/`export` (asynchronous, statically-analyzed, tree-shakeable).
| CJS | ESM |
|-----|-----|
| Synchronous loading | Asynchronous loading |
| Runtime resolution | Static analysis (parse time) |
| No tree-shaking | Tree-shaking possible |
| Default in Node | Requires `"type": "module"` or `.mjs` |
📖 [Detailed notes](2_modules-and-runtime.md#commonjs-vs-es-modules)

### 7. Explain how garbage collection works in V8 and how you would identify a memory leak.
**One-liner:** V8 uses generational GC — Young Generation (Scavenger, frequent, for short-lived objects) and Old Generation (Mark-Sweep/Mark-Compact, infrequent, for long-lived objects).
- **Identify leaks:** Monitor `process.memoryUsage().heapUsed` over time. If it grows steadily without dipping, there's a leak. Use `--inspect` + Chrome DevTools heap snapshots to compare allocations.
📖 [Detailed notes](1_architecture-and-event-loop.md#v8-garbage-collection)

### 8. What is the Event Emitter? How would you build a custom Event Emitter class?
**One-liner:** Node's observer/pub-sub implementation. Maintain a `Map<event, listeners[]>`. `on()` pushes listener, `emit()` calls all listeners synchronously, `off()` filters out a listener, `once()` wraps listener to auto-remove after first call.
📖 [Detailed notes](3_asynchronous-programming.md#building-a-custom-event-emitter-interview-favorite)

### 9. How does Node.js interact with the underlying operating system?
**One-liner:** Through libuv (C library) and V8's C++ bindings. JavaScript calls like `fs.readFile()` go through Node's C++ bindings → libuv handles the async I/O using OS-level mechanisms (epoll on Linux, IOCP on Windows) or the thread pool for blocking operations.
📖 [Detailed notes](1_architecture-and-event-loop.md#the-three-pillars-of-nodejs)

### 10. Describe the difference between a microtask and a macrotask in the context of the event loop.
**One-liner:** Macrotasks (setTimeout, setImmediate, I/O) run during their event loop phases. Microtasks (Promise callbacks, `process.nextTick()`) run between phases — the entire queue is drained before the loop moves on.
📖 [Detailed notes](1_architecture-and-event-loop.md#microtasks-vs-macrotasks)

---

## Advanced Express.js & Middleware Patterns

### 11. Explain the exact request-response lifecycle within an Express application.
**One-liner:** Request enters → Express creates `req`/`res` → middleware stack runs sequentially (body parsing → CORS → auth → logger) → route handler matched and executed → response sent. Errors skip to error middleware (4 params).
📖 [Detailed notes](5_express-fundamentals.md#request-response-lifecycle)

### 12. How does middleware execution order work in Express, and why is it critical?
**One-liner:** Middleware executes in registration order. Body parsers must run before route handlers (otherwise `req.body` is undefined), auth before protected routes, and error handlers must be registered last.
📖 [Detailed notes](6_middleware-and-error-handling.md#middleware-execution-order)

### 13. Design a robust, centralized global error-handling architecture in Express.
**One-liner:** Three layers: (1) Custom `ApiError` class with status codes, (2) `asyncHandler` wrapper that catches rejected Promises and passes to `next(err)`, (3) Global error middleware (4 params) registered last that normalizes errors and sends formatted responses.
📖 [Detailed notes](6_middleware-and-error-handling.md#centralized-global-error-handling)

### 14. How would you implement role-based access control (RBAC) middleware?
**One-liner:** Create an `authorize(...roles)` factory function that returns middleware. It checks `req.user.role` (set by auth middleware) against allowed roles. Match → `next()`. No match → 403 Forbidden.
📖 [Detailed notes](7_authentication-and-security.md#role-based-access-control-rbac)

### 15. Explain how to securely handle large file uploads in Express.
**One-liner:** Use Multer with: size limits (`limits.fileSize`), MIME type validation (`fileFilter`), unique filenames, storage to dedicated directory or cloud. Never trust client-provided filenames or Content-Type.
📖 [Detailed notes](6_middleware-and-error-handling.md#file-uploads-with-multer)

### 16. What is the purpose of `express.Router()`, and how do you use it for modular routing?
**One-liner:** Creates a mini Express app for modular routing. Define routes relative to a base path, apply scoped middleware, mount with `app.use('/prefix', router)`. Each resource gets its own file.
📖 [Detailed notes](5_express-fundamentals.md#expressrouter--modular-routing)

### 17. How do you manage database connections efficiently within an Express application?
**One-liner:** Use connection pooling (Mongoose `maxPoolSize`, pg `Pool`). Connect to the database before calling `app.listen()`. Handle reconnection events. Never create a new connection per request.
📖 [Detailed notes](8_scaling-and-performance.md#database-connection-pooling)

### 18. Discuss the differences between `app.use()` and `app.get()`/`app.post()`.
**One-liner:** `app.use()` matches ALL HTTP methods with prefix path matching. `app.get()` matches only GET with exact path matching. Use `app.use()` for middleware and routers, `app.get()` for route handlers.
📖 [Detailed notes](5_express-fundamentals.md#appuse-vs-appgetapppost)

### 19. How would you implement request validation before hitting your controllers?
**One-liner:** Create a `validate(schema)` middleware factory using Zod/Joi. It validates `req.body`, `req.params`, `req.query` against the schema. Fail → 400 with error details. Pass → `next()`.
📖 [Detailed notes](6_middleware-and-error-handling.md#request-validation-joi--zod)

### 20. Explain how to gracefully shut down an Express server without dropping active connections.
**One-liner:** Listen for `SIGTERM`/`SIGINT` → call `server.close()` (stops new connections, waits for active ones) → close DB/Redis connections → set force-exit timeout → `process.exit(0)`.
📖 [Detailed notes](6_middleware-and-error-handling.md#graceful-shutdown)

---

## Asynchronous Programming & Data Handling

### 21. Explain the differences between Streams and Buffers in Node.js.
**One-liner:** A Buffer is a fixed-size chunk of binary data in memory (entire data at once). A Stream processes data piece-by-piece over time (constant memory regardless of size).
📖 [Detailed notes](4_streams-and-buffers.md#streams--the-core-pattern)

### 22. When would you use `fs.createReadStream` instead of `fs.readFile`?
**One-liner:** For files >10MB, streaming HTTP responses, or line-by-line processing. `createReadStream` uses ~64KB regardless of file size. `readFile` loads the entire file into memory.
📖 [Detailed notes](4_streams-and-buffers.md#fscreatereadstream-vs-fsreadfile)

### 23. What are the four types of streams in Node.js? Provide a use case for each.
**One-liner:** Readable (file reads, HTTP req), Writable (file writes, HTTP res), Duplex (TCP sockets — read/write independently), Transform (gzip compression — modify data in flight).
📖 [Detailed notes](4_streams-and-buffers.md#four-types-of-streams)

### 24. How do you handle "backpressure" when piping streams?
**One-liner:** When `writable.write()` returns `false`, pause the Readable. Resume when Writable emits `drain`. Use `pipeline()` from `stream/promises` — it handles backpressure, error propagation, and cleanup automatically.
📖 [Detailed notes](4_streams-and-buffers.md#backpressure)

### 25. Explain the transition from callbacks to Promises, and then to async/await. What problems did each solve?
**One-liner:** Callbacks → callback hell (deep nesting, duplicated error handling). Promises → flat chains + centralized `.catch()`. Async/await → synchronous-looking code, natural try/catch. Each solved the readability and error handling limitations of the previous.
📖 [Detailed notes](3_asynchronous-programming.md#phase-1-callbacks)

### 26. How does `Promise.all()` differ from `Promise.allSettled()`?
**One-liner:** `Promise.all()` fails fast — if any Promise rejects, the entire result is lost. `Promise.allSettled()` waits for all and returns each result with its status (fulfilled/rejected).
| `Promise.all()` | `Promise.allSettled()` |
|-----------------|----------------------|
| Rejects on first failure | Never rejects |
| Use when all must succeed | Use when you want partial results |
📖 [Detailed notes](3_asynchronous-programming.md#promise-combinators)

### 27. What happens if you forget to `await` an asynchronous function inside a try/catch block?
**One-liner:** The async function returns a Promise immediately. The try/catch won't catch its errors because the rejection happens asynchronously after the catch block has completed. The error becomes an unhandled rejection.
📖 [Detailed notes](3_asynchronous-programming.md#the-forgotten-await-bug)

### 28. How do you prevent blocking the event loop when processing large arrays of data?
**One-liner:** Break work into chunks using `setImmediate()` to yield control between chunks. For CPU-heavy operations, use Worker Threads to offload computation to separate threads.
📖 [Detailed notes](3_asynchronous-programming.md#preventing-event-loop-blocking)

### 29. Explain how to implement a retry mechanism for a failing asynchronous API call.
**One-liner:** Loop with a counter, try/catch inside, exponential backoff delay (`delay * 2^attempt`) between retries. After max retries, throw the final error. Prevents thundering-herd problems.
📖 [Detailed notes](3_asynchronous-programming.md#retry-mechanism-for-failing-api-calls)

### 30. How do you use `util.promisify`, and why is it useful?
**One-liner:** Converts error-first callback functions to Promise-returning functions. Modern Node.js provides built-in Promise APIs (`fs/promises`, `dns/promises`) which should be preferred.
📖 [Detailed notes](3_asynchronous-programming.md#utilpromisify)

---

## Scaling, Performance & Security

### 31. How does the Node.js cluster module work, and how does it help scale an application?
**One-liner:** Forks the master process into worker processes (one per CPU core). Workers share the server port via OS-level distribution (round-robin). If a worker crashes, the master forks a replacement.
📖 [Detailed notes](8_scaling-and-performance.md#cluster-module)

### 32. Explain the difference between the cluster module and Worker Threads. When should you use which?
**One-liner:** Cluster creates separate OS processes (own memory, ~30-50MB each) — for scaling I/O-bound servers. Worker Threads create threads within one process (shared memory) — for offloading CPU-bound computation.
📖 [Detailed notes](8_scaling-and-performance.md#worker-threads-vs-cluster-module)

### 33. How would you profile a Node.js application to find CPU bottlenecks?
**One-liner:** Use `node --inspect` + Chrome DevTools Performance tab for flame charts. Use `clinic.js doctor` for automated detection. Monitor event loop lag with a simple interval timer.
📖 [Detailed notes](8_scaling-and-performance.md#profiling-cpu-bottlenecks)

### 34. What strategies would you use to optimize the startup time of a Node.js server?
**One-liner:** Warm up DB/Redis connections before `app.listen()`, lazy-load heavy modules, remove unused dependencies, pre-compile templates at build time.
📖 [Detailed notes](8_scaling-and-performance.md#server-startup-optimization)

### 35. How do you implement rate limiting in an Express application to prevent DDoS attacks?
**One-liner:** Use `express-rate-limit` with a window (15 min) and max requests (100). Apply stricter limits to auth endpoints (5 attempts per 15 min). Use Redis store for clustered environments.
📖 [Detailed notes](7_authentication-and-security.md#rate-limiting)

### 36. What is Helmet.js, and what specific security headers does it set?
**One-liner:** Helmet is middleware that sets security HTTP headers: Content-Security-Policy (XSS), X-Content-Type-Options: nosniff (MIME sniffing), X-Frame-Options (clickjacking), Strict-Transport-Security (force HTTPS), Referrer-Policy (URL leakage).
📖 [Detailed notes](7_authentication-and-security.md#helmetjs--security-headers)

### 37. Explain Cross-Origin Resource Sharing (CORS) and how to configure it securely in Express.
**One-liner:** CORS is a browser mechanism where the server sends `Access-Control-Allow-Origin` headers to whitelist origins. Configure by specifying allowed origins (not `*`), methods, headers, and `credentials: true` if needed. Non-simple requests trigger an OPTIONS preflight.
📖 [Detailed notes](7_authentication-and-security.md#cors-cross-origin-resource-sharing)

### 38. How do you prevent SQL Injection and NoSQL Injection in your applications?
**One-liner:** SQL: Always use parameterized queries/prepared statements — never concatenate user input. NoSQL: Use `express-mongo-sanitize` to strip `$` operators, validate types with Zod/Joi (ensure values are strings, not objects).
📖 [Detailed notes](7_authentication-and-security.md#injection-prevention)

### 39. What are the best practices for securely storing passwords and sensitive configuration variables?
**One-liner:** Passwords: Hash with bcrypt (salt rounds 12+) or argon2. Never store plaintext. Config: Use `.env` files (never committed) with `dotenv` in dev. Use secrets managers (AWS Secrets Manager, Vault) in production. Different secrets per environment.
📖 [Detailed notes](7_authentication-and-security.md#password-security)

### 40. How would you handle session management and CSRF protection in a stateless REST API?
**One-liner:** JWT in Authorization header is naturally CSRF-immune (browsers don't auto-send custom headers). For cookie-based auth, use CSRF tokens. For JWT, focus on XSS prevention — store tokens in httpOnly cookies, use short-lived access tokens with refresh token rotation.
📖 [Detailed notes](7_authentication-and-security.md#csrf-protection)

---

## System Design, Databases & Architecture

### 41. Explain the differences between monolithic and microservices architectures using Node.js.
**One-liner:** Monolithic = all features in one codebase/process (simple, but scales as a unit). Microservices = each feature is an independent service with its own DB (scales independently, but complex infrastructure). Start monolithic, split when needed.
📖 [Detailed notes](9_databases-and-architecture.md#monolithic-vs-microservices)

### 42. How would you implement stateless authentication using JSON Web Tokens (JWT)?
**One-liner:** Login → verify credentials → `jwt.sign({id, role}, secret, {expiresIn})` → send token. Subsequent requests: extract token from `Authorization: Bearer <token>` header → `jwt.verify(token, secret)` → attach decoded user to `req.user` → `next()`.
📖 [Detailed notes](7_authentication-and-security.md#jwt-authentication--deep-dive)

### 43. Discuss caching strategies. How would you integrate Redis with a Node/Express app?
**One-liner:** Use Redis as a shared cache across clustered workers. Common pattern: check Redis first → if hit, return cached data → if miss, query DB → store result in Redis with TTL → return data. Invalidate on writes.
| Strategy | Trade-off |
|----------|-----------|
| TTL | Simple, stale for TTL duration |
| Write-through | Always fresh, complex |
| Cache-aside | Most common, requires invalidation logic |
📖 [Detailed notes](8_scaling-and-performance.md#caching-strategies)

### 44. How do you design and version a RESTful API?
**One-liner:** Resource-based URLs (nouns), HTTP methods for CRUD, query params for filtering/pagination, URL versioning (`/api/v1/`), consistent response shape (`{success, data, error}`), proper HTTP status codes.
📖 [Detailed notes](9_databases-and-architecture.md#restful-api-design--versioning)

### 45. Explain how you would implement real-time features using WebSockets alongside an Express server.
**One-liner:** Create HTTP server from Express app with `createServer(app)`, attach Socket.io to it. Both REST and WebSocket share the same port. Use events for real-time communication, rooms for scoped broadcasting.
📖 [Detailed notes](9_databases-and-architecture.md#websockets--socketio)

### 46. Compare MongoDB (NoSQL) with PostgreSQL (SQL). When would you choose one over the other?
**One-liner:** MongoDB for flexible schemas, hierarchical data, horizontal scaling. PostgreSQL for complex relationships (JOINs), strict ACID transactions, complex reporting. Choose based on data relationships and consistency requirements.
📖 [Detailed notes](9_databases-and-architecture.md#mongodb-vs-postgresql--when-to-use-which)

### 47. How do you handle database migrations in a Node.js environment?
**One-liner:** Version-controlled migration files with `up` (apply) and `down` (revert) functions. Use Prisma Migrate or Sequelize CLI. Track applied migrations in a special DB table. Run `migrate deploy` in CI/CD pipeline.
📖 [Detailed notes](9_databases-and-architecture.md#database-migrations)

### 48. Describe a typical CI/CD pipeline for testing and deploying a Node.js application.
**One-liner:** Code push → `npm ci` (install) → lint (ESLint) → test (unit + integration) → build Docker image → push to registry → deploy to staging → verify health checks → deploy to production.
📖 [Detailed notes](9_databases-and-architecture.md#cicd-pipeline-for-nodejs)

### 49. How would you monitor the health and performance of your Node.js application in production?
**One-liner:** `/health` endpoint checking DB/Redis connectivity and memory usage. PM2 for process management. Sentry for error tracking. Prometheus + Grafana for metrics. Winston for structured logging.
📖 [Detailed notes](9_databases-and-architecture.md#application-monitoring--health-checks)

### 50. Walk me through how you would design a URL shortener service using Node.js and Express.
**One-liner:** POST `/api/shorten` → generate short code (Base62 or nanoid) → store `{shortCode, longUrl, clicks}` in DB → return short URL. GET `/:code` → check Redis cache → query DB → 301 redirect to long URL → async increment clicks. Rate limit creation, add analytics endpoint, cluster for scale.
📖 [Detailed notes](9_databases-and-architecture.md#interview-perspective)
