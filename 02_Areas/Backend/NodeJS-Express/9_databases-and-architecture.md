# Databases & Architecture

> Choosing the right database, designing APIs correctly, and structuring your application architecture are decisions that are expensive to change later. This chapter covers the architectural patterns and system design decisions that define production-grade Node.js applications.

---

## MongoDB vs PostgreSQL — When to Use Which

### Core Difference

| Feature | MongoDB (NoSQL / Document) | PostgreSQL (SQL / Relational) |
|---------|---------------------------|-------------------------------|
| **Data Model** | Documents (JSON-like BSON) | Tables with rows and columns |
| **Schema** | Flexible (schema-less or optional schema) | Rigid (predefined schema, migrations) |
| **Relationships** | Embedded documents or manual references | Foreign keys with JOINs |
| **Query Language** | MongoDB Query Language (MQL) | SQL |
| **Transactions** | Supported (since v4.0, but less mature) | ACID-compliant (battle-tested) |
| **Scaling** | Horizontal (sharding built-in) | Vertical first, horizontal with extensions |
| **Best For** | Rapid prototyping, flexible schemas, hierarchical data | Complex relationships, financial data, strict consistency |

### Mental Model

- **MongoDB** = A filing cabinet where each folder can contain different types of documents. Fast to add new document types, but harder to cross-reference between folders.
- **PostgreSQL** = A spreadsheet with strict columns. Every row follows the same structure. Powerful for analyzing relationships between data.

### When to Choose

| Choose MongoDB When | Choose PostgreSQL When |
|--------------------|----------------------|
| Schema evolves frequently | Data has many relationships (users → orders → products) |
| Data is naturally hierarchical (nested objects) | Need complex queries with JOINs |
| Need horizontal scaling for massive data | Financial/transactional data (ACID is critical) |
| Rapid prototyping, MVP phase | Data integrity is non-negotiable |
| Content management, catalogs, IoT data | Reporting, analytics, complex aggregations |

---

## ORMs and ODMs

### What They Are

| Type | Full Name | Purpose | Examples |
|------|-----------|---------|----------|
| **ODM** | Object Document Mapper | Map JS objects to MongoDB documents | **Mongoose** |
| **ORM** | Object Relational Mapper | Map JS objects to SQL table rows | **Prisma**, **Sequelize**, Knex.js |

### Mongoose (MongoDB ODM)

```javascript
import mongoose from 'mongoose';

// Schema definition
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Exclude from queries by default
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // Reference
  createdAt: { type: Date, default: Date.now },
});

// Middleware (hooks)
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Instance method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

const User = mongoose.model('User', userSchema);
export default User;

// Usage
const user = await User.create({ name: 'John', email: 'john@example.com', password: '123456' });
const users = await User.find({ role: 'admin' }).populate('posts').limit(10);
```

### Prisma (SQL ORM — Modern)

```prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  posts     Post[]   // Relation
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create with relation
const user = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@example.com',
    posts: {
      create: [{ title: 'First Post', content: 'Hello World' }],
    },
  },
  include: { posts: true }, // Eager load relations
});

// Query with filter
const admins = await prisma.user.findMany({
  where: { role: 'admin' },
  include: { posts: true },
  take: 10,
});
```

### Comparison

| Feature | Mongoose | Prisma | Sequelize |
|---------|----------|--------|-----------|
| **Database** | MongoDB | PostgreSQL, MySQL, SQLite | PostgreSQL, MySQL, SQLite |
| **Schema** | Runtime JS schemas | Declarative `.prisma` file | Runtime JS models |
| **Type Safety** | Manual | Auto-generated TypeScript types | Manual |
| **Migrations** | Not built-in | `prisma migrate` (excellent) | `sequelize-cli` |
| **Learning Curve** | Easy | Medium | Medium |
| **Performance** | Good | Excellent (optimized queries) | Good |

---

## Database Connection Management in Express

### The Pattern

```javascript
// db/connect.js
import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});
```

```javascript
// server.js — connect BEFORE listening
import app from './app.js';
import { connectDB } from './db/connect.js';

async function start() {
  await connectDB();
  app.listen(3000, () => console.log('Server ready'));
}

start();
```

---

## Database Migrations

### What Migrations Are

Migrations are version-controlled changes to your database schema. Instead of manually altering tables, you write migration files that can be applied (up) or reverted (down).

### Why They Matter

- **Reproducibility:** Any developer can recreate the exact database schema.
- **Version Control:** Schema changes are tracked in git like code.
- **Rollback:** If a migration breaks something, you can revert it.
- **Team Collaboration:** No more "hey, did you add that column to your local DB?"

### Prisma Migrations

```bash
# Create a migration after changing schema.prisma
npx prisma migrate dev --name add_user_role

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset
```

### Sequelize Migrations

```bash
# Generate a migration file
npx sequelize-cli migration:generate --name add-role-to-users

# Run pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo
```

```javascript
// migrations/20240101-add-role-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('user', 'admin'),
      defaultValue: 'user',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'role');
  },
};
```

---

## Monolithic vs Microservices

### Monolithic Architecture

All features (auth, users, products, payments) live in one codebase, one process, one deployment.

```
┌────────────────────────────────────┐
│          Monolithic App             │
│  ┌──────┐ ┌──────┐ ┌───────────┐  │
│  │ Auth │ │Users │ │ Products  │  │
│  └──────┘ └──────┘ └───────────┘  │
│  ┌──────────┐ ┌────────────────┐  │
│  │ Payments │ │ Notifications  │  │
│  └──────────┘ └────────────────┘  │
│         Single Database            │
└────────────────────────────────────┘
```

### Microservices Architecture

Each feature is an independent service with its own codebase, database, and deployment.

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│Auth Service│  │User Service│  │Product Svc│
│   + DB    │  │   + DB    │  │   + DB   │
└─────┬─────┘  └─────┬─────┘  └─────┬────┘
      │               │              │
      └───────────────┼──────────────┘
                      │
              ┌───────▼────────┐
              │  API Gateway    │  ← Single entry point
              └───────┬────────┘
                      │
                  Clients
```

### Comparison

| Aspect | Monolithic | Microservices |
|--------|-----------|---------------|
| **Complexity** | Simple to build and deploy | Complex infrastructure needed |
| **Scaling** | Scale entire app (even unused parts) | Scale individual services independently |
| **Team Size** | Small teams (< 10 devs) | Large teams (dedicated team per service) |
| **Deployment** | One deployment (risky — all or nothing) | Independent deployments per service |
| **Data Consistency** | Easy (single DB, transactions) | Hard (distributed transactions, eventual consistency) |
| **Debugging** | Simple (one process, one log) | Complex (distributed tracing needed) |
| **Technology** | Single tech stack | Each service can use different stack |
| **When to Choose** | Starting out, MVP, small team | At scale, when teams need independence |

> **Senior Engineer Advice:** Start monolithic. Split into microservices only when you have a specific scaling or organizational need. Premature microservices is one of the most expensive mistakes teams make.

---

## RESTful API Design & Versioning

### REST Principles

| Principle | Meaning |
|-----------|---------|
| **Client-Server** | Frontend and backend are separate |
| **Stateless** | Each request contains all info needed (no server-side session) |
| **Uniform Interface** | Consistent URL patterns and HTTP methods |
| **Resource-Based** | URLs represent resources (nouns), not actions (verbs) |

### URL Design Best Practices

```
✅ GOOD                              ❌ BAD
GET    /api/users                    GET    /api/getUsers
GET    /api/users/42                 GET    /api/getUserById?id=42
POST   /api/users                    POST   /api/createUser
PUT    /api/users/42                 POST   /api/updateUser
DELETE /api/users/42                 POST   /api/deleteUser

GET    /api/users/42/posts           GET    /api/getUserPosts?userId=42
GET    /api/users?role=admin&page=2  GET    /api/getAdminUsers
```

### API Versioning

```javascript
// URL versioning (most common)
app.use('/api/v1/users', userRouterV1);
app.use('/api/v2/users', userRouterV2);

// Header versioning
app.use('/api/users', (req, res, next) => {
  const version = req.headers['api-version'] || '1';
  req.apiVersion = version;
  next();
});
```

### Standard Response Format

```javascript
// Success
{
  "success": true,
  "data": { "id": 42, "name": "John" },
  "meta": { "page": 1, "total": 100 }
}

// Error
{
  "success": false,
  "error": "User not found",
  "statusCode": 404
}
```

### Pagination

```javascript
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
```

---

## WebSockets & Socket.io

### The Problem HTTP Solves... and Doesn't

HTTP is **request-response**: the client asks, the server answers. The server **cannot** push data to the client without being asked first. For real-time features (chat, live notifications, collaborative editing), HTTP polling is wasteful.

### WebSocket Protocol

WebSockets provide a **persistent, bidirectional** connection between client and server. After an initial HTTP handshake, the connection upgrades to WebSocket — both sides can send data at any time.

```
HTTP:        Client ──request──► Server ──response──► Client (done)

WebSocket:   Client ◄──────── persistent connection ────────► Server
             (both can send data anytime)
```

### Socket.io with Express

```javascript
// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173' },
});

// REST endpoints still work
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// WebSocket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for events from this client
  socket.on('chat:message', (data) => {
    console.log('Message received:', data);
    
    // Broadcast to ALL connected clients (except sender)
    socket.broadcast.emit('chat:message', {
      ...data,
      timestamp: Date.now(),
    });
  });

  // Join a room (for targeted broadcasting)
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('room:userJoined', { userId: socket.id });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id} (${reason})`);
  });
});

// Use httpServer.listen, NOT app.listen
httpServer.listen(3000, () => console.log('Server running'));
```

> **Why `createServer(app)` instead of `app.listen()`?** Socket.io needs access to the raw HTTP server object. `app.listen()` creates and returns a server internally, but it's cleaner to create it explicitly so both Express and Socket.io share the same server.

### Key Socket.io Concepts

| Concept | Description |
|---------|-------------|
| **`io.emit()`** | Send to ALL connected clients |
| **`socket.emit()`** | Send to THIS specific client |
| **`socket.broadcast.emit()`** | Send to ALL EXCEPT this client |
| **`io.to(room).emit()`** | Send to all clients in a room |
| **Rooms** | Logical groups (chat rooms, game lobbies) |
| **Namespaces** | Separate communication channels (`/chat`, `/admin`) |

---

## CI/CD Pipeline for Node.js

### Typical Pipeline

```
Code Push → Lint → Test → Build → Deploy
     │        │      │       │        │
     │        │      │       │        └── Deploy to staging/production
     │        │      │       └──────────── Docker build (if containerized)
     │        │      └──────────────────── Run test suite (unit + integration)
     │        └─────────────────────────── ESLint + Prettier checks
     └──────────────────────────────────── Developer pushes to GitHub
```

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          MONGO_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: echo "Deploy step here"
```

---

## Application Monitoring & Health Checks

### Health Check Endpoint

```javascript
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    checks: {},
  };

  // Check database connection
  try {
    await mongoose.connection.db.admin().ping();
    healthcheck.checks.database = 'connected';
  } catch {
    healthcheck.checks.database = 'disconnected';
    healthcheck.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    healthcheck.checks.redis = 'connected';
  } catch {
    healthcheck.checks.redis = 'disconnected';
    healthcheck.status = 'degraded';
  }

  // Memory usage
  healthcheck.memory = process.memoryUsage();

  const statusCode = healthcheck.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});
```

### Monitoring Tools

| Tool | Purpose | Type |
|------|---------|------|
| **PM2** | Process monitoring, logs, restart | Process manager |
| **Prometheus + Grafana** | Metrics collection + visualization | Infrastructure |
| **Sentry** | Error tracking and alerting | Error monitoring |
| **Datadog / New Relic** | Full APM (performance, errors, traces) | APM |
| **ELK Stack** | Centralized log management | Logging |
| **Morgan + Winston** | Request logging + application logging | Logging |

---

## Interview Perspective

**Q: Explain the differences between monolithic and microservices architectures using Node.js.**

Monolithic: all features in one codebase and process — simple to build, deploy, and debug, but hard to scale independently. Microservices: each feature is an independent service with its own DB and deployment — scales independently, teams can work autonomously, but adds complexity (distributed tracing, eventual consistency, service discovery). Start monolithic. Split only when you have a proven scaling or organizational need.

**Q: How would you design and version a RESTful API?**

Use resource-based URLs (nouns: `/users`, not verbs: `/getUsers`). Map HTTP methods to CRUD operations. Use query params for filtering and pagination. Version via URL prefix (`/api/v1/`). Return consistent response shapes with `success`, `data`, and `error` fields. Use proper HTTP status codes (201 for creation, 204 for deletion, 400 for bad input, 404 for not found).

**Q: Explain how you would implement real-time features using WebSockets alongside an Express server.**

Create an HTTP server from the Express app using `createServer(app)`, then attach Socket.io to it. Both REST routes and WebSocket connections share the same port. Use Socket.io events for real-time communication (`io.on('connection')`, `socket.on(event)`, `socket.emit(event)`). Use rooms for scoped broadcasting (chat rooms, notifications). Handle reconnection and authentication via Socket.io middleware.

**Q: Compare MongoDB with PostgreSQL. When would you choose one over the other?**

MongoDB for flexible schemas, hierarchical data, rapid prototyping, and horizontal scaling. PostgreSQL for complex relationships requiring JOINs, financial data requiring strict ACID compliance, and complex reporting queries. The decision often comes down to: does your data have many cross-references (SQL) or is it mostly self-contained documents (NoSQL)?

**Q: How do you handle database migrations in a Node.js environment?**

Use migration tools like Prisma Migrate or Sequelize CLI. Each migration is a versioned file with `up` (apply) and `down` (revert) functions. Migrations are tracked in a special table in the database. In CI/CD, run `migrate deploy` during the deployment step. Never manually alter production database schema.

**Q: Describe a typical CI/CD pipeline for testing and deploying a Node.js application.**

On code push: install dependencies (`npm ci`), run linter (ESLint), run tests (unit + integration with test database), build Docker image, push to container registry, deploy to staging for verification, then deploy to production. Use GitHub Actions, GitLab CI, or Jenkins. Include health checks after deployment.

**Q: How would you monitor the health and performance of your Node.js application in production?**

Implement a `/health` endpoint that checks database and Redis connectivity, memory usage, and uptime. Use PM2 for process monitoring and auto-restart. Use Sentry for error tracking. Use Prometheus + Grafana or Datadog for metrics (request latency, throughput, error rates). Use Winston for structured application logging and Morgan for HTTP request logging.

**Q: Walk me through how you would design a URL shortener service (like bit.ly) using Node.js and Express.**

Components: Express API server, database (MongoDB or PostgreSQL) for URL mappings, Redis for caching. Flow: POST `/api/shorten` receives a long URL → generate a unique short code (Base62 encoding of an auto-increment ID or nanoid) → store mapping {shortCode, longUrl, createdAt, clicks} in DB → return short URL. GET `/:shortCode` → check Redis cache first → if miss, query DB → if found, increment click counter (async), redirect (301) to long URL. Add rate limiting on creation, analytics endpoint for click stats. For scale: use Redis for hot redirects, cluster/PM2 for multiple processes, CDN for geographic distribution.

---

## Key Takeaways

- **MongoDB** for flexible schemas and horizontal scaling. **PostgreSQL** for relationships and transactions.
- **Mongoose** (MongoDB ODM) and **Prisma** (SQL ORM) are the modern choices for Node.js.
- **Connect to DB before `app.listen()`** — don't serve traffic without a database.
- **Migrations are version control for your database schema.** Never manually alter production DBs.
- **Start monolithic, split to microservices only when needed.** Premature microservices = premature complexity.
- **REST APIs: nouns in URLs, verbs in HTTP methods.** Consistent response format with pagination.
- **Socket.io for real-time** — shares the HTTP server with Express.
- **CI/CD: lint → test → build → deploy.** Automate everything.
- **Health checks** should verify all external dependencies (DB, Redis, external APIs).
