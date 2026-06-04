# Middleware & Error Handling

> Middleware functions are the backbone of Express. They are functions that have access to the request, response, and the `next` function — forming a sequential pipeline that processes every request. Mastering middleware architecture is the difference between a fragile hobby project and a production-grade application.

---

## What is Middleware?

### Core Idea

A middleware function is any function with the signature `(req, res, next)`. It can:
1. Execute any code.
2. Modify the `req` and `res` objects.
3. End the request-response cycle (by sending a response).
4. Call `next()` to pass control to the next middleware.

### Mental Model

Think of middleware as **airport security checkpoints**. A passenger (request) passes through multiple checkpoints in sequence:
1. **Ticket check** (authentication) — valid ticket? Proceed. Invalid? Denied.
2. **Baggage scan** (validation) — contents okay? Proceed. Suspicious? Flagged.
3. **Passport control** (authorization) — cleared? Board the plane (route handler). Not cleared? Rejected.

Each checkpoint either lets you through (`next()`) or stops you (sends a response).

```javascript
// Basic middleware structure
const myMiddleware = (req, res, next) => {
  // Do something with the request
  console.log(`${req.method} ${req.url}`);
  
  // Pass control to the next middleware
  next();
  
  // ⚠️ If you forget next() and don't send a response,
  // the request HANGS forever (client sees a timeout)
};
```

---

## Middleware Execution Order

### Why Order is Critical

Express runs middleware **in the order they are registered**. This is not optional — it's deterministic and sequential.

```javascript
const app = express();

// 1. Body parser MUST come before route handlers that read req.body
app.use(express.json());

// 2. CORS MUST come before route handlers to set headers on preflight
app.use(cors());

// 3. Logger runs on every request
app.use(logger);

// 4. Auth runs before protected routes
app.use('/api', authMiddleware);

// 5. Route handlers
app.use('/api/users', userRouter);

// 6. 404 handler — AFTER all routes (catches unmatched requests)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 7. Error handler — ALWAYS LAST
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### What Happens If Order is Wrong

```javascript
// ❌ WRONG: Route before body parser
app.post('/users', (req, res) => {
  console.log(req.body); // undefined! Body parser hasn't run yet
});
app.use(express.json()); // Too late

// ❌ WRONG: Error handler before routes
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
app.get('/users', handler); // Errors from here won't reach the handler above
```

---

## Types of Middleware

### 1. Application-Level Middleware

Bound to the `app` object using `app.use()` or `app.METHOD()`. Runs for every matching request.

```javascript
// Runs for ALL requests
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

// Runs only for GET /users
app.get('/users', (req, res, next) => {
  // This is also middleware — route handlers are middleware!
  next();
});
```

### 2. Router-Level Middleware

Bound to a `Router` instance. Works exactly like application-level but scoped to the router.

```javascript
const router = express.Router();

// Only runs for requests to this router's routes
router.use((req, res, next) => {
  console.log('User router middleware');
  next();
});

router.get('/:id', (req, res) => {
  res.json({ user: req.params.id });
});

app.use('/api/users', router);
```

### 3. Error-Handling Middleware

Has **four parameters**: `(err, req, res, next)`. Express identifies it as an error handler specifically because of the 4-argument signature.

```javascript
// This MUST have exactly 4 parameters — Express checks the function's arity
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});
```

### 4. Built-in Middleware

| Middleware | Purpose |
|-----------|---------|
| `express.json()` | Parses JSON request bodies |
| `express.urlencoded({ extended: true })` | Parses URL-encoded form data |
| `express.static('public')` | Serves static files from a directory |

### 5. Third-Party Middleware

| Package | Purpose |
|---------|---------|
| `cors` | Enable Cross-Origin Resource Sharing |
| `helmet` | Set security-related HTTP headers |
| `morgan` | HTTP request logger |
| `compression` | Gzip compress responses |
| `cookie-parser` | Parse cookies from request headers |
| `express-rate-limit` | Rate limiting |
| `multer` | Multipart form data (file uploads) |

---

## Centralized Global Error Handling

### The Problem

Without centralized error handling, you end up with try/catch blocks in every route handler, duplicating error response logic everywhere:

```javascript
// ❌ BAD — duplicated error handling in every route
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message }); // copy-pasted everywhere
  }
});
```

### The Solution: Three-Layer Error Architecture

#### Layer 1: Custom Error Class

```javascript
// utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Expected errors vs bugs
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
}

export default ApiError;
```

#### Layer 2: Async Error Wrapper

```javascript
// middleware/asyncHandler.js
// Wraps async route handlers so rejected Promises are forwarded to next()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
```

> **Why is this needed?** Express does NOT catch rejected Promises from async route handlers. Without this wrapper, unhandled rejections crash the app. (Express 5 fixes this natively.)

#### Layer 3: Global Error Handler Middleware

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log unexpected errors
  if (statusCode === 500) {
    console.error('UNEXPECTED ERROR:', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
```

#### Usage in Routes

```javascript
import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// Clean route handlers — no try/catch needed!
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json(user);
}));
```

---

## Request Validation (Joi / Zod)

### Why Validate?

Never trust client input. Without validation, malformed data can:
1. Crash your application.
2. Corrupt your database.
3. Create security vulnerabilities (injection attacks).

### Validation with Zod

```javascript
// middleware/validate.js
import { ZodError } from 'zod';

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

export default validate;
```

```javascript
// schemas/userSchema.js
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    age: z.number().int().min(18).optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
});
```

```javascript
// routes/users.js
import validate from '../middleware/validate.js';
import { createUserSchema, getUserSchema } from '../schemas/userSchema.js';

router.post('/', validate(createUserSchema), asyncHandler(async (req, res) => {
  // req.body is guaranteed to be valid at this point
  const user = await User.create(req.body);
  res.status(201).json(user);
}));

router.get('/:id', validate(getUserSchema), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound();
  res.json(user);
}));
```

---

## File Uploads with Multer

### How It Works

Multer is middleware that handles `multipart/form-data` (the encoding type used for file uploads). It adds a `file` or `files` property to the `req` object.

```javascript
import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to uploads directory
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter — only allow images
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Usage
router.post('/avatar', upload.single('avatar'), (req, res) => {
  console.log(req.file); // { fieldname, originalname, mimetype, size, path, ... }
  res.json({ message: 'Upload successful', file: req.file });
});

router.post('/gallery', upload.array('photos', 10), (req, res) => {
  console.log(req.files); // Array of file objects (max 10)
  res.json({ message: `${req.files.length} files uploaded` });
});
```

> **Security Warning:** Never trust the `originalname` from the client. Sanitize filenames, generate unique names, and validate MIME types on the server side by reading file headers — not just the Content-Type header which can be spoofed.

---

## Body Parsing

```javascript
// Parse JSON bodies (Content-Type: application/json)
app.use(express.json({ limit: '10mb' })); // Set body size limit

// Parse URL-encoded bodies (Content-Type: application/x-www-form-urlencoded)
// Used by HTML forms
app.use(express.urlencoded({ extended: true }));
// extended: true → uses 'qs' library (supports nested objects)
// extended: false → uses 'querystring' (flat key-value pairs)
```

### What Happens Without Body Parsing?

```javascript
app.post('/data', (req, res) => {
  console.log(req.body); // undefined! No parser = no body
  res.send('No body parsed');
});
```

---

## Graceful Shutdown

### The Problem

When deploying a new version, the server receives a termination signal (`SIGTERM`). If you just call `process.exit()`, all active requests are dropped mid-flight — users get connection reset errors.

### The Solution

```javascript
import app from './app.js';

const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Track active connections
let connections = new Set();
server.on('connection', (conn) => {
  connections.add(conn);
  conn.on('close', () => connections.delete(conn));
});

// Graceful shutdown handler
function shutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // 1. Stop accepting new connections
  server.close(() => {
    console.log('All connections closed. Exiting.');
    process.exit(0);
  });

  // 2. Set a deadline — force exit if shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    console.error('Forced exit — shutdown timeout exceeded');
    process.exit(1);
  }, 30000); // 30 seconds

  forceExitTimeout.unref(); // Don't let this timer keep the process alive

  // 3. Close database connections, flush logs, etc.
  // await mongoose.connection.close();
  // await redis.quit();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### How `server.close()` Works

1. **Stops accepting new connections** immediately.
2. **Waits** for all existing connections to finish their current request-response cycle.
3. **Calls the callback** when all connections are closed.
4. Existing keep-alive connections remain open until their current request completes.

---

## Interview Perspective

**Q: How does middleware execution order work in Express, and why is it critical?**

Middleware runs in the exact order it's registered with `app.use()`. This matters because: body parsers must run before route handlers that read `req.body`, authentication must run before protected routes, and error handlers must be registered last (after all routes). If order is wrong, you get `undefined` bodies, unprotected routes, or unhandled errors.

**Q: Design a robust, centralized global error-handling architecture in Express.**

Three layers: (1) A custom `ApiError` class with status codes and operational vs programming error distinction. (2) An `asyncHandler` wrapper that catches rejected Promises from async route handlers and passes them to `next(err)`. (3) A global error middleware (4 params: `err, req, res, next`) registered last that normalizes errors (Mongoose, JWT, validation), logs unexpected errors, and sends formatted responses. This eliminates try/catch duplication in routes.

**Q: How would you implement request validation before hitting your controllers?**

Create a `validate()` middleware factory that takes a Zod/Joi schema. It validates `req.body`, `req.params`, and `req.query` against the schema. If validation fails, return a 400 response with detailed error messages. If it passes, call `next()`. Apply it per-route: `router.post('/', validate(schema), controller)`.

**Q: How do you securely handle large file uploads in Express?**

Use Multer middleware with: (1) size limits (`limits.fileSize`), (2) file type validation by checking MIME type in a `fileFilter` function, (3) unique filenames to prevent overwrites, (4) storage to a dedicated directory or cloud storage (S3). Never trust `originalname` or the client-provided Content-Type — validate server-side.

**Q: Explain how to gracefully shut down an Express server without dropping active connections.**

Listen for `SIGTERM`/`SIGINT` signals. Call `server.close()` which stops accepting new connections but lets active requests complete. Set a force-exit timeout as a deadline. Close database connections, Redis clients, and flush logs before exiting. This prevents dropped requests during deployments.

---

## Key Takeaways

- **Middleware = `(req, res, next)`.** Must call `next()` or send a response.
- **Registration order = execution order.** Body parser before routes, error handler last.
- **Error middleware has 4 params:** `(err, req, res, next)`. Express checks arity.
- **Async handlers need wrapping** — Express 4 doesn't catch rejected Promises natively.
- **Centralize errors:** Custom error class + async wrapper + global error middleware.
- **Validate early:** Use Zod/Joi middleware before route handlers.
- **Graceful shutdown:** `server.close()` → wait for connections → cleanup → exit.
