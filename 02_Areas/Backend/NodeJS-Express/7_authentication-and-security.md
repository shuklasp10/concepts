# Authentication & Security

> Security is not a feature — it's a requirement. A single vulnerability can expose user data, destroy trust, and shut down a business. This chapter covers the essential security patterns every Node.js/Express application must implement.

---

## Authentication vs Authorization

| Concept | Question It Answers | Example |
|---------|--------------------|---------| 
| **Authentication** (AuthN) | "Who are you?" | Login with email/password, OAuth |
| **Authorization** (AuthZ) | "What are you allowed to do?" | Admin can delete users, regular users cannot |

Authentication happens first (verify identity), then authorization (check permissions).

---

## Session-Based vs Token-Based Authentication

### Session-Based (Stateful)

```
1. Client sends credentials (email + password)
2. Server verifies → creates a session (stored in server memory/Redis)
3. Server sends back a session ID in a cookie
4. Client sends cookie with every request
5. Server looks up session ID → retrieves user data
```

### Token-Based / JWT (Stateless)

```
1. Client sends credentials (email + password)
2. Server verifies → creates a signed JWT token
3. Server sends token to client (in response body)
4. Client stores token (localStorage/cookie) and sends in Authorization header
5. Server verifies token signature → extracts user data from token payload
6. No server-side storage needed
```

### Comparison

| Feature | Session-Based | Token-Based (JWT) |
|---------|--------------|-------------------|
| **State** | Stateful (server stores sessions) | Stateless (no server storage) |
| **Storage** | Server-side (memory, Redis, DB) | Client-side (localStorage, cookie) |
| **Scalability** | Harder (sessions must be shared across servers) | Easier (any server can verify the token) |
| **Revocation** | Easy (delete session from store) | Hard (token valid until expiry) |
| **Size** | Small cookie (~32 bytes session ID) | Larger (~800+ bytes JWT) |
| **CSRF Risk** | Yes (cookies sent automatically) | No (if stored in localStorage) |
| **XSS Risk** | Lower (httpOnly cookies) | Higher (if stored in localStorage) |
| **Mobile Friendly** | No (cookies are browser-centric) | Yes (tokens work everywhere) |

> **When to use which?** Use sessions for traditional web apps with server-rendered pages. Use JWT for APIs consumed by SPAs, mobile apps, or microservices where stateless architecture is important.

---

## JWT Authentication — Deep Dive

### How JWT Works Internally

A JWT is three Base64-encoded parts separated by dots:

```
xxxxx.yyyyy.zzzzz
  │      │      │
  │      │      └── Signature (verifies integrity)
  │      └────────── Payload (user data — claims)
  └───────────────── Header (algorithm + type)
```

```javascript
// Header (algorithm used for signing)
{ "alg": "HS256", "typ": "JWT" }

// Payload (claims — user data)
{
  "sub": "user123",
  "name": "John Doe",
  "role": "admin",
  "iat": 1716239022,   // Issued at
  "exp": 1716242622    // Expires at (1 hour later)
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

> **Critical Insight:** The payload is **NOT encrypted** — it's just Base64 encoded. Anyone can decode it and read the contents. The signature only guarantees the payload hasn't been **tampered with**. NEVER put sensitive data (passwords, credit cards) in a JWT payload.

### Implementation

```javascript
// config/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET); // Throws if invalid/expired
}
```

### Auth Controller

```javascript
// controllers/authController.js
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js';
import ApiError from '../utils/ApiError.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.badRequest('Email already registered');

  // Hash password (salt rounds = 12)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({ name, email, password: hashedPassword });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.status(201).json({ accessToken, refreshToken });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password field (excluded by default in model)
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.json({ accessToken, refreshToken });
};
```

### Auth Middleware

```javascript
// middleware/auth.js
import { verifyToken } from '../config/jwt.js';
import ApiError from '../utils/ApiError.js';

export const authenticate = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user data to request
    next();
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
};
```

---

## Role-Based Access Control (RBAC)

### How It Works

RBAC restricts system access based on user roles (admin, editor, viewer). It's implemented as middleware that checks the user's role after authentication.

```javascript
// middleware/authorize.js
import ApiError from '../utils/ApiError.js';

// Factory function — returns middleware for specific roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by authenticate middleware
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized for this action`
      );
    }

    next();
  };
};

// Usage in routes
router.get('/users', authenticate, authorize('admin'), getUsers);
router.delete('/users/:id', authenticate, authorize('admin', 'superadmin'), deleteUser);
router.get('/profile', authenticate, authorize('admin', 'editor', 'viewer'), getProfile);
```

### Permission Flow

```
Request → authenticate → authorize('admin') → route handler
              │                │
              │                ├─ role = 'admin'   → next() ✅
              │                ├─ role = 'editor'  → 403 Forbidden ❌
              │                └─ role = 'viewer'  → 403 Forbidden ❌
              │
              └─ No token / invalid token → 401 Unauthorized ❌
```

---

## Password Security

### Why bcrypt?

| Algorithm | Status | Why |
|-----------|--------|-----|
| MD5/SHA-1 | ❌ Broken | Fast to compute — GPUs can try billions per second |
| SHA-256 | ⚠️ Not ideal | Still too fast for passwords |
| **bcrypt** | ✅ Recommended | Intentionally slow, includes salt, configurable cost |
| **argon2** | ✅ Best | Winner of Password Hashing Competition, memory-hard |

### How bcrypt Works

```javascript
import bcrypt from 'bcrypt';

// Hashing (during registration)
const saltRounds = 12; // 2^12 = 4096 iterations
const hashedPassword = await bcrypt.hash('user_password', saltRounds);
// Output: "$2b$12$LJ3m4ys0NqZ1234567890u1234567890123456789012345678"
//          │  │  │                    │
//          │  │  │                    └── Hash
//          │  │  └─────────────────────── Salt (random, unique per password)
//          │  └────────────────────────── Cost factor (12)
//          └───────────────────────────── Algorithm version (2b)

// Comparing (during login)
const isMatch = await bcrypt.compare('user_password', hashedPassword);
// bcrypt extracts the salt FROM the hash, re-hashes the input, and compares
```

> **Why salt?** Without salt, two users with the same password would have the same hash. Attackers can use precomputed "rainbow tables" to crack common passwords. Salt adds randomness — same password produces different hashes for different users.

---

## Helmet.js — Security Headers

### What It Does

Helmet sets HTTP response headers that protect against common web vulnerabilities. It's a collection of 15+ middleware functions.

```javascript
import helmet from 'helmet';

app.use(helmet()); // Enables all default protections
```

### Key Headers It Sets

| Header | Protection Against | What It Does |
|--------|-------------------|-------------|
| `Content-Security-Policy` | XSS, data injection | Controls which sources can load scripts, styles, images |
| `X-Content-Type-Options: nosniff` | MIME sniffing | Prevents browser from guessing Content-Type |
| `X-Frame-Options: DENY` | Clickjacking | Prevents page from being loaded in iframe |
| `Strict-Transport-Security` | Protocol downgrade | Forces HTTPS connections |
| `X-XSS-Protection: 0` | Unreliable XSS filter | Disables buggy browser XSS filters (CSP is better) |
| `Referrer-Policy` | Information leakage | Controls what URL info is sent in Referer header |
| `X-DNS-Prefetch-Control: off` | DNS prefetch abuse | Prevents browser from pre-resolving DNS for links |

---

## CORS (Cross-Origin Resource Sharing)

### The Problem

Browsers enforce the **Same-Origin Policy** — JavaScript on `https://frontend.com` cannot make requests to `https://api.backend.com`. This is a security measure to prevent malicious websites from stealing data from other sites.

### How CORS Works

CORS is a **server-side mechanism** that tells the browser "I allow requests from this origin."

```
Browser on https://frontend.com wants to fetch https://api.backend.com/users

1. Browser sends request with header: Origin: https://frontend.com
2. Server responds with header: Access-Control-Allow-Origin: https://frontend.com
3. Browser sees the match → allows the response through
4. If headers don't match → browser BLOCKS the response (CORS error)
```

### Preflight Requests

For "non-simple" requests (POST with JSON body, custom headers, PUT/DELETE), the browser sends an **OPTIONS preflight** first:

```
1. Browser sends OPTIONS request:
   Origin: https://frontend.com
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: Content-Type, Authorization

2. Server responds:
   Access-Control-Allow-Origin: https://frontend.com
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   Access-Control-Allow-Headers: Content-Type, Authorization
   Access-Control-Max-Age: 86400  ← Cache preflight for 24h

3. Browser sees approval → sends actual POST request
```

### Secure CORS Configuration

```javascript
import cors from 'cors';

// ❌ BAD — allows everything (fine for development, dangerous for production)
app.use(cors());

// ✅ GOOD — explicit whitelist
const corsOptions = {
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow cookies/auth headers
  maxAge: 86400,       // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Dynamic origin (check against whitelist)
const corsOptionsDynamic = {
  origin: (origin, callback) => {
    const whitelist = ['https://myapp.com', 'https://admin.myapp.com'];
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
```

---

## Injection Prevention

### SQL Injection

```javascript
// ❌ VULNERABLE — string concatenation
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
// Attacker sends: email = "' OR '1'='1"
// Query becomes: SELECT * FROM users WHERE email = '' OR '1'='1'
// Returns ALL users!

// ✅ SAFE — parameterized queries (prepared statements)
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [req.body.email]);
// The database treats the input as DATA, never as SQL code
```

### NoSQL Injection (MongoDB)

```javascript
// ❌ VULNERABLE — unsanitized query
const user = await User.findOne({
  email: req.body.email,
  password: req.body.password,
});
// Attacker sends: { email: "admin@site.com", password: { "$gt": "" } }
// MongoDB evaluates: password > "" → true for any non-empty password!

// ✅ SAFE — validate types and sanitize
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize()); // Strips $ and . from req.body/query/params

// Also validate input types with Zod
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(), // Must be a string, not an object
  }),
});
```

---

## CSRF Protection

### The Attack

1. User logs into `bank.com` (session cookie is set).
2. User visits `malicious-site.com`.
3. Malicious site has a hidden form that POSTs to `bank.com/transfer?to=attacker&amount=10000`.
4. Browser automatically includes the `bank.com` session cookie → request succeeds.

### Prevention for APIs

REST APIs using JWT in the `Authorization` header are **naturally immune** to CSRF because:
- CSRF exploits cookies (which browsers send automatically).
- The `Authorization` header is NOT sent automatically — JavaScript must explicitly set it.
- A malicious site cannot access another site's JavaScript to read/set the header.

### Prevention for Cookie-Based Auth

```javascript
import csurf from 'csurf';

// For apps using session cookies
app.use(csurf({ cookie: true }));

app.get('/form', (req, res) => {
  // Embed the CSRF token in the form
  res.render('form', { csrfToken: req.csrfToken() });
});

// The form must include: <input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

---

## Rate Limiting

### Why It Matters

Without rate limiting, an attacker can:
1. Brute-force login credentials.
2. Overload your server (DDoS).
3. Scrape your entire API.

```javascript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,       // Return rate limit info in headers
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: { error: 'Too many login attempts, try again in 15 minutes' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

## Environment Variable Security

```bash
# .env — NEVER commit this file
DATABASE_URL=mongodb://admin:password@db.example.com:27017/prod
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0_long_random_string
AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE

# .env.example — commit this (no real values)
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your_jwt_secret_here
AWS_SECRET_KEY=your_aws_key_here
```

### Best Practices

1. **Never commit `.env`** — add it to `.gitignore`.
2. **Use strong, random secrets** — not `password123` or `secret`.
3. **Different secrets per environment** — dev, staging, production.
4. **In production, use a secrets manager** — AWS Secrets Manager, Vault, or platform env vars.
5. **Rotate secrets regularly** — especially JWT secrets and API keys.

---

## Interview Perspective

**Q: How would you implement stateless authentication using JSON Web Tokens (JWT)?**

On login, verify credentials, generate a JWT containing user ID, role, and expiry using `jwt.sign()` with a secret. Send the token to the client. On subsequent requests, the client sends the token in the `Authorization: Bearer <token>` header. An auth middleware extracts and verifies the token using `jwt.verify()`, attaches the decoded user data to `req.user`, and calls `next()`. No server-side session storage is needed.

**Q: How would you implement role-based access control (RBAC) middleware?**

Create an `authorize()` factory function that accepts allowed roles as arguments and returns middleware. The middleware checks `req.user.role` (set by the authentication middleware) against the allowed roles. If the role is permitted, call `next()`. If not, return a 403 Forbidden response. Usage: `router.delete('/users/:id', authenticate, authorize('admin'), deleteUser)`.

**Q: What is Helmet.js, and what specific security headers does it set?**

Helmet is a collection of middleware that sets security HTTP headers. Key headers: Content-Security-Policy (prevents XSS by controlling script sources), X-Content-Type-Options: nosniff (prevents MIME sniffing), X-Frame-Options (prevents clickjacking), Strict-Transport-Security (forces HTTPS), and Referrer-Policy (controls URL leakage).

**Q: Explain Cross-Origin Resource Sharing (CORS) and how to configure it securely in Express.**

CORS is a browser security mechanism. The server sends `Access-Control-Allow-Origin` headers telling the browser which origins can access the API. Configure securely by: whitelisting specific origins (not `*`), specifying allowed methods and headers, setting `credentials: true` only if needed, and caching preflight responses with `maxAge`. Non-simple requests trigger an OPTIONS preflight before the actual request.

**Q: How do you prevent SQL Injection and NoSQL Injection?**

SQL Injection: Always use parameterized queries / prepared statements — never concatenate user input into query strings. NoSQL Injection: Use `express-mongo-sanitize` to strip `$` operators from input, validate input types with Zod/Joi (ensure passwords are strings, not objects), and use Mongoose schema validation.

**Q: What are the best practices for securely storing passwords and sensitive configuration variables?**

Passwords: Hash with bcrypt (cost factor 12+) or argon2. Never store plaintext. Salt is included automatically by bcrypt. Config: Store secrets in environment variables (`.env` files in dev, secrets managers in production). Never commit secrets to version control. Use different secrets per environment. Rotate regularly.

**Q: How would you handle session management and CSRF protection in a stateless REST API?**

Stateless REST APIs using JWT in the Authorization header are naturally CSRF-immune because browsers don't auto-send custom headers. For cookie-based auth, use CSRF tokens (embed in forms, validate on server). For JWT, the main concern shifts to XSS — store tokens in httpOnly cookies (not localStorage) for browser apps, or use short-lived access tokens with refresh token rotation.

---

## Key Takeaways

- **Authentication = who are you.** Authorization = what can you do.
- **JWT is stateless** — good for APIs and microservices. Sessions are stateful — easier to revoke.
- **JWT payload is NOT encrypted** — only signed. Never put secrets in it.
- **bcrypt with salt rounds 12+** for password hashing. Never store plaintext passwords.
- **Helmet.js is a must** — one line of code, multiple security headers.
- **CORS is server-side** — whitelist specific origins, don't use `*` in production.
- **Parameterized queries** prevent SQL injection. Schema validation prevents NoSQL injection.
- **Rate limit auth endpoints** aggressively — 5 attempts per 15 minutes.
- **Never commit secrets** — use `.env` in dev, secrets managers in production.
