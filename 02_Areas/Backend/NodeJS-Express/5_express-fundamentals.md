# Express Fundamentals

> Express.js is a minimal, unopinionated web framework for Node.js that provides a thin layer of abstractions over Node's built-in `http` module. It handles routing, middleware, request/response helpers, and application structure — the essentials for building web APIs and applications.

---

## What Express Abstracts Over

### The Problem with Raw `http` Module

Node.js has a built-in `http` module for creating servers, but it's extremely low-level:

```javascript
import http from 'http';

const server = http.createServer((req, res) => {
  // No routing — you manually parse req.url
  if (req.method === 'GET' && req.url === '/users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
  } else if (req.method === 'POST' && req.url === '/users') {
    // No body parsing — you manually collect stream chunks
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const user = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000);
```

**Pain points:** No routing system, no body parsing, no middleware chain, manual header management, no static file serving, no template engine integration.

### The Express Solution

```javascript
import express from 'express';
const app = express();

app.use(express.json()); // Body parsing — one line

app.get('/users', (req, res) => {
  res.json({ users: [] }); // Automatic Content-Type + JSON serialization
});

app.post('/users', (req, res) => {
  res.status(201).json(req.body); // Body already parsed
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

> **Mental Model:** If Node's `http` module is like building a house with raw lumber and nails, Express is like using pre-fabricated walls and a blueprint. You still have full control, but the common patterns are handled for you.

---

## Request-Response Lifecycle

### Step-by-Step Flow

```
Client sends HTTP request
         │
         ▼
┌─────────────────────────────────┐
│  Express App receives request    │
│                                  │
│  1. Parse URL, method, headers   │
│  2. Create req and res objects   │
│                                  │
│  3. Run middleware stack:        │
│     ├─ express.json()            │  ← Body parsing
│     ├─ cors()                    │  ← CORS headers
│     ├─ authMiddleware()          │  ← Authentication
│     ├─ loggerMiddleware()        │  ← Logging
│     │                            │
│  4. Match route handler          │
│     ├─ app.get('/users', handler)│  ← Route matched!
│     │                            │
│  5. Execute route handler        │
│     ├─ handler sends response    │
│     │   res.json({ data })       │
│                                  │
│  6. Error? → Error middleware    │
│     ├─ (err, req, res, next)     │
└─────────────────────────────────┘
         │
         ▼
Client receives HTTP response
```

> **Key Insight:** Express processes the request through a **sequential chain** of middleware functions. Each middleware either: (1) passes control to the next middleware via `next()`, or (2) ends the cycle by sending a response.

---

## Routing

### Route Definition Syntax

```javascript
app.METHOD(PATH, HANDLER);
// app.get('/users', (req, res) => { ... });
```

### HTTP Methods

| Method | Purpose | Idempotent? | Has Body? |
|--------|---------|-------------|-----------|
| `GET` | Retrieve data | Yes | No |
| `POST` | Create new resource | No | Yes |
| `PUT` | Replace entire resource | Yes | Yes |
| `PATCH` | Partially update resource | No | Yes |
| `DELETE` | Remove resource | Yes | Optional |
| `HEAD` | Same as GET but no body (metadata only) | Yes | No |
| `OPTIONS` | Check supported methods/CORS preflight | Yes | No |

> **Idempotent** means calling the same request multiple times produces the same result. `GET /users/1` always returns the same user. `DELETE /users/1` called twice still results in user 1 being gone. `POST /users` called twice creates TWO users.

### Route Parameters

```javascript
// Route params — part of the URL path
app.get('/users/:userId/posts/:postId', (req, res) => {
  console.log(req.params.userId);  // '42'
  console.log(req.params.postId);  // '7'
  // GET /users/42/posts/7
});

// Query strings — after the ?
app.get('/search', (req, res) => {
  console.log(req.query.q);       // 'nodejs'
  console.log(req.query.page);    // '2'
  // GET /search?q=nodejs&page=2
});
```

### Route Patterns

```javascript
// Exact match
app.get('/about', handler);

// Parameter
app.get('/users/:id', handler);

// Optional parameter
app.get('/users/:id?', handler); // Matches /users and /users/42

// Regex pattern
app.get(/.*fly$/, handler); // Matches /butterfly, /dragonfly

// Multiple handlers (mini middleware chain)
app.get('/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({ dashboard: 'admin data' });
});
```

### `app.route()` — Chaining Methods on Same Path

```javascript
app.route('/users')
  .get((req, res) => {
    res.json({ users: [] });
  })
  .post((req, res) => {
    res.status(201).json({ created: true });
  })
  .put((req, res) => {
    res.json({ updated: true });
  });
```

---

## `express.Router()` — Modular Routing

### Problem It Solves

As your application grows, putting all routes in a single file becomes unmaintainable. `express.Router()` lets you create **modular, mountable route handlers** — mini-applications with their own middleware and routes.

### How It Works

```javascript
// routes/users.js
import { Router } from 'express';
const router = Router();

// All routes here are relative to wherever this router is mounted
router.get('/', (req, res) => {
  res.json({ users: [] });
});

router.get('/:id', (req, res) => {
  res.json({ user: req.params.id });
});

router.post('/', (req, res) => {
  res.status(201).json(req.body);
});

export default router;
```

```javascript
// app.js
import express from 'express';
import userRouter from './routes/users.js';
import postRouter from './routes/posts.js';

const app = express();

app.use(express.json());

// Mount routers with path prefixes
app.use('/api/users', userRouter);  // /api/users, /api/users/:id
app.use('/api/posts', postRouter);  // /api/posts, /api/posts/:id

app.listen(3000);
```

### Benefits of Router

| Benefit | Description |
|---------|-------------|
| **Modularization** | Each feature/resource gets its own file |
| **Path Prefixing** | Routes are relative — easily change the base path |
| **Scoped Middleware** | Apply middleware only to specific routes |
| **Team Scaling** | Different developers can work on different routers |
| **Testing** | Test individual routers in isolation |

---

## `app.use()` vs `app.get()`/`app.post()`

### The Key Difference

| Feature | `app.use()` | `app.get()` / `app.post()` |
|---------|------------|---------------------------|
| **HTTP Method** | Matches **ALL** methods | Matches **specific** method only |
| **Path Matching** | Prefix matching (`/api` matches `/api/users/1`) | Exact matching (`/api` only matches `/api`) |
| **Primary Use** | Middleware, mounting routers | Route handlers |

```javascript
// app.use — matches ANY method, ANY path starting with /api
app.use('/api', (req, res, next) => {
  console.log('API request:', req.method, req.url);
  next(); // Must call next() or request hangs
});

// app.get — matches ONLY GET requests to EXACTLY /api/users
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});
```

> **Mental Model:** `app.use()` is like a security checkpoint — everyone passes through it regardless of where they're going. `app.get()` is like a specific office door — only people going to that exact destination enter.

---

## The Request Object (`req`)

The `req` object wraps the incoming HTTP request with useful properties:

| Property | Description | Example |
|----------|-------------|---------|
| `req.params` | Route parameters | `{ id: '42' }` |
| `req.query` | Query string parsed | `{ page: '2', sort: 'name' }` |
| `req.body` | Parsed request body (requires middleware) | `{ name: 'John' }` |
| `req.headers` | HTTP headers (lowercase keys) | `{ 'content-type': 'application/json' }` |
| `req.method` | HTTP method | `'GET'` |
| `req.url` | Full URL path + query | `'/users?page=2'` |
| `req.path` | URL path only | `'/users'` |
| `req.ip` | Client IP address | `'127.0.0.1'` |
| `req.cookies` | Parsed cookies (requires cookie-parser) | `{ session: 'abc123' }` |
| `req.hostname` | Hostname from Host header | `'example.com'` |
| `req.protocol` | `http` or `https` | `'https'` |
| `req.get(header)` | Get specific header value | `req.get('Content-Type')` |

---

## The Response Object (`res`)

The `res` object wraps the outgoing HTTP response:

| Method | Description | Example |
|--------|-------------|---------|
| `res.json(obj)` | Send JSON response (sets Content-Type) | `res.json({ ok: true })` |
| `res.send(data)` | Send string, Buffer, or object | `res.send('Hello')` |
| `res.status(code)` | Set HTTP status code (chainable) | `res.status(404).json({ error: 'Not found' })` |
| `res.redirect(url)` | Redirect to another URL | `res.redirect('/login')` |
| `res.render(view)` | Render a template (requires engine) | `res.render('index', { title: 'Home' })` |
| `res.set(header, val)` | Set response header | `res.set('X-Custom', 'value')` |
| `res.cookie(name, val)` | Set a cookie | `res.cookie('session', 'abc123')` |
| `res.download(path)` | Prompt file download | `res.download('/files/report.pdf')` |
| `res.sendFile(path)` | Send file as response | `res.sendFile('/public/index.html')` |
| `res.sendStatus(code)` | Set status and send status text | `res.sendStatus(204)` |

> **Important:** You can only send ONE response per request. Calling `res.json()` after `res.send()` will throw `Error: Can't set headers after they are sent`.

---

## Serving Static Files

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// With a virtual path prefix
app.use('/assets', express.static(path.join(__dirname, 'public')));
// /assets/style.css → serves public/style.css
```

### How `express.static` Works

1. When a request comes in (e.g., `GET /style.css`), Express checks the `public/` directory.
2. If `public/style.css` exists → serve it with proper Content-Type headers.
3. If not found → call `next()` (pass to the next middleware/route).
4. Sets `Cache-Control`, `ETag`, and `Last-Modified` headers automatically.

---

## Application Structure — Production Pattern

```
project/
├── src/
│   ├── app.js              ← Express app setup (middleware, routes)
│   ├── server.js            ← HTTP server + listen (entry point)
│   ├── config/
│   │   └── index.js         ← Environment config, DB URLs
│   ├── routes/
│   │   ├── index.js         ← Route aggregator
│   │   ├── users.js         ← /api/users routes
│   │   └── posts.js         ← /api/posts routes
│   ├── controllers/
│   │   ├── userController.js ← Business logic for user routes
│   │   └── postController.js
│   ├── middleware/
│   │   ├── auth.js           ← Authentication middleware
│   │   ├── validate.js       ← Request validation
│   │   └── errorHandler.js   ← Centralized error handler
│   ├── models/
│   │   ├── User.js           ← Database model
│   │   └── Post.js
│   ├── services/
│   │   ├── userService.js    ← Business logic (DB interactions)
│   │   └── emailService.js
│   └── utils/
│       └── ApiError.js       ← Custom error class
├── .env
├── .env.example
├── package.json
└── README.md
```

### Why Separate `app.js` and `server.js`?

```javascript
// app.js — Express configuration (testable without starting server)
import express from 'express';
import userRouter from './routes/users.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);

export default app;

// server.js — Entry point (starts the server)
import app from './app.js';
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

> **Why?** This separation lets you import `app` in tests without actually starting the server. You can use `supertest` to make requests against the app object directly.

---

## Interview Perspective

**Q: Explain the exact request-response lifecycle within an Express application.**

The request enters Express, which creates `req` and `res` objects. It then runs through the middleware stack in order of registration — each middleware calls `next()` to pass control or sends a response to end the cycle. If the URL and method match a route handler, that handler executes. If an error occurs, Express skips to the error-handling middleware (4 arguments: `err, req, res, next`). Finally, the response is sent to the client.

**Q: Discuss the differences between `app.use()` and `app.get()`/`app.post()`.**

`app.use()` matches ALL HTTP methods and does prefix path matching (`/api` matches `/api/users`). `app.get()`/`app.post()` matches only the specific HTTP method and does exact path matching. `app.use()` is primarily for middleware and mounting routers. `app.get()` etc. are for route handlers.

**Q: What is the purpose of `express.Router()`, and how do you use it for modular routing?**

`express.Router()` creates a mini Express application that handles only routing. You define routes relative to a base path, apply scoped middleware, and mount the router on the main app with `app.use('/prefix', router)`. This enables modular, testable route definitions — each resource (users, posts, etc.) gets its own file.

---

## Key Takeaways

- **Express wraps Node's `http` module** with routing, middleware, body parsing, and response helpers.
- **Request flows through middleware sequentially.** Each must call `next()` or send a response.
- **`app.use()` = all methods + prefix matching.** `app.get()` = specific method + exact matching.
- **`express.Router()`** creates modular, mountable route handlers with scoped middleware.
- **Separate `app.js` and `server.js`** for testability.
- **`req` is a Readable stream.** `res` is a Writable stream. Express enhances them with helpers.
- **One response per request.** Sending twice throws an error.
