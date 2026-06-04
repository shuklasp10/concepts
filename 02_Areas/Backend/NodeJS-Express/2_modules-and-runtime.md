# Modules & Runtime

> Node.js provides two module systems — CommonJS (the original, synchronous `require()`) and ES Modules (the standard, asynchronous `import/export`). Understanding how modules resolve, cache, and interact is critical for building maintainable applications.

---

## Module Systems — Why They Exist

### The Problem

JavaScript was originally designed for small browser scripts. There was no way to split code into separate files and import them. Everything was dumped into the global scope via `<script>` tags. As applications grew, name collisions, dependency management, and code organization became nightmares.

### The Solution

Node.js introduced **CommonJS** (2009) — a synchronous module system using `require()` and `module.exports`. Later, **ES Modules** (ESM) became the official JavaScript standard (ES2015+), using `import` and `export`.

---

## CommonJS (CJS)

### How It Works Internally

When you call `require('./myModule')`, Node.js does the following:

1. **Resolve** — Find the file. Node looks for `./myModule.js`, then `./myModule/index.js`, then checks `node_modules/`.
2. **Load** — Read the file contents from disk.
3. **Wrap** — Node wraps your code in a function (this is why `module`, `exports`, `require`, `__dirname`, `__filename` are available without importing them):

```javascript
// What you write:
const x = 10;
module.exports = x;

// What Node actually executes:
(function(exports, require, module, __filename, __dirname) {
  const x = 10;
  module.exports = x;
});
```

4. **Execute** — Run the wrapped function.
5. **Cache** — Store the result. Next `require()` call returns the cached export.

### Syntax

```javascript
// Exporting
// ----------
// Named exports (multiple)
module.exports.greet = (name) => `Hello ${name}`;
module.exports.farewell = (name) => `Bye ${name}`;

// Or using shorthand
exports.greet = (name) => `Hello ${name}`;

// Default export (single)
module.exports = class UserService { /* ... */ };

// ⚠️ COMMON MISTAKE: Don't reassign `exports` directly
// exports = { greet }; ← This BREAKS the reference. Use module.exports.

// Importing
// ----------
const UserService = require('./UserService');
const { greet, farewell } = require('./utils'); // destructuring works
```

> **Why does `exports = {...}` break things?** `exports` is just a reference to `module.exports`. When you do `exports = {...}`, you're pointing `exports` to a new object, but `module.exports` still points to the original empty object. Node returns `module.exports`, not `exports`.

---

## ES Modules (ESM)

### How It Differs from CommonJS

| Feature | CommonJS (`require`) | ES Modules (`import`) |
|---------|---------------------|----------------------|
| **Loading** | Synchronous (blocks execution) | Asynchronous (non-blocking) |
| **Parsing** | Runtime (code runs to know exports) | Static (parsed before execution) |
| **Tree-shaking** | Not possible (dynamic) | Possible (bundlers remove unused code) |
| **Top-level `await`** | Not supported | Supported |
| **`this` at top level** | `module.exports` | `undefined` |
| **File extension** | `.js` (default) | `.mjs` or `.js` with `"type": "module"` in `package.json` |
| **Default in Node** | Yes (legacy) | Opt-in |

### How to Enable ESM in Node.js

**Option 1:** Use `.mjs` file extension.
**Option 2:** Set `"type": "module"` in `package.json` (recommended):

```json
{
  "name": "my-app",
  "type": "module"
}
```

### Syntax

```javascript
// Exporting
// ----------
// Named exports
export const greet = (name) => `Hello ${name}`;
export function farewell(name) { return `Bye ${name}`; }

// Default export
export default class UserService { /* ... */ }

// Importing
// ----------
import UserService from './UserService.js'; // default
import { greet, farewell } from './utils.js'; // named
import * as utils from './utils.js'; // namespace

// Dynamic import (works in both CJS and ESM)
const module = await import('./heavy-module.js');
```

> **Key Difference — Static Analysis:** ESM imports are analyzed at parse time (before code runs). This means: (1) `import` must be at the top level — you can't put it inside an `if` block, (2) bundlers can tree-shake unused exports, (3) circular dependency handling is different.

### Using CommonJS Inside ESM (and Vice Versa)

```javascript
// ESM can import CJS ✅
import cjsModule from './legacy-module.cjs';

// CJS cannot use `import` syntax ❌
// But CJS can use dynamic import():
const esmModule = await import('./modern-module.mjs'); // works
```

---

## Module Resolution Algorithm

When you write `require('express')` or `import express from 'express'`, Node doesn't magically know where `express` lives. It follows a resolution algorithm:

### For Relative Paths (`./` or `../`)

```
require('./utils')
  1. Try ./utils.js
  2. Try ./utils.json
  3. Try ./utils.node (C++ addon)
  4. Try ./utils/index.js
  5. Try ./utils/index.json
  6. Try ./utils/index.node
  → Error if nothing found
```

### For Bare Specifiers (`require('express')`)

```
require('express')
  1. Check core modules (fs, http, path, etc.)
  2. Look in ./node_modules/express
  3. Look in ../node_modules/express
  4. Look in ../../node_modules/express
  5. Keep going up until root /node_modules/express
  → Error if nothing found
```

> **Mental Model:** It's like looking for a tool. First check your toolbox (core modules), then your desk drawer (local node_modules), then the room's cabinet, then the building's storage, all the way up.

---

## Module Caching

### How It Works

**Every module is cached after the first `require()`/`import`.** Subsequent calls return the cached result — the module code is NOT re-executed.

```javascript
// counter.js
let count = 0;
module.exports = { increment: () => ++count, getCount: () => count };

// app.js
const counter1 = require('./counter');
const counter2 = require('./counter');

counter1.increment();
counter1.increment();

console.log(counter2.getCount()); // 2 ← Same instance! Not re-executed.
```

> **Key Insight:** Modules are **singletons** in Node.js. This is why database connection modules work — you create the connection once, and every file that imports it gets the same connection object.

### Cache Busting (Rarely Needed)

```javascript
// Delete from cache to force re-execution
delete require.cache[require.resolve('./counter')];
```

---

## Circular Dependencies

### The Problem

```javascript
// a.js
const b = require('./b');
console.log('In a, b.loaded =', b.loaded);
module.exports = { loaded: true };

// b.js
const a = require('./a');
console.log('In b, a.loaded =', a.loaded);
module.exports = { loaded: true };
```

### What Happens

Node doesn't crash. It returns a **partially initialized** module:

1. `a.js` starts executing → hits `require('./b')`.
2. Node starts executing `b.js` → hits `require('./a')`.
3. Node detects the cycle. Instead of infinite recursion, it returns **whatever `a.js` has exported so far** (which is an empty object `{}` at this point).
4. `b.js` finishes → `a.js` resumes.

```
Output:
In b, a.loaded = undefined  ← a.js hasn't finished yet, so exports is {}
In a, b.loaded = true       ← b.js finished fully
```

> **Best Practice:** Avoid circular dependencies. If you have them, restructure by extracting shared logic into a third module.

---

## Key Global Objects

### `process`

The `process` object provides information about and control over the current Node.js process.

```javascript
process.env.NODE_ENV    // Environment variables
process.argv            // Command-line arguments ['node', 'script.js', 'arg1']
process.cwd()           // Current working directory
process.pid             // Process ID
process.exit(0)         // Exit with success code (1 = failure)
process.memoryUsage()   // Memory stats { rss, heapTotal, heapUsed }
process.uptime()        // Seconds since process started

// Event listeners
process.on('uncaughtException', (err) => { /* log and exit */ });
process.on('unhandledRejection', (reason) => { /* log and exit */ });
process.on('SIGTERM', () => { /* graceful shutdown */ });
```

### `Buffer`

A Buffer represents a fixed-length sequence of bytes. Used for binary data (files, network packets, images).

```javascript
const buf = Buffer.from('Hello', 'utf-8');
console.log(buf);         // <Buffer 48 65 6c 6c 6f>
console.log(buf.toString()); // 'Hello'

const empty = Buffer.alloc(10); // 10 zero-filled bytes
```

### `global`

The global object in Node (equivalent to `window` in browsers). Variables defined without `var/let/const` at the top level are NOT added to `global` (because of the module wrapper function).

```javascript
// In a browser:
var x = 5; // window.x === 5

// In Node:
var x = 5; // global.x === undefined (wrapped in module function)
```

### `__dirname` and `__filename` (CommonJS only)

```javascript
// CommonJS
console.log(__dirname);  // /Users/shrip/app/src
console.log(__filename); // /Users/shrip/app/src/index.js

// ESM equivalent
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## Environment Variables

### Using `dotenv`

```bash
# .env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=super_secret_key_never_commit_this
```

```javascript
// CommonJS
require('dotenv').config();

// ESM
import 'dotenv/config';

console.log(process.env.PORT); // '3000' ← Always a string!
const port = parseInt(process.env.PORT, 10) || 3000;
```

> **Security Rule:** NEVER commit `.env` files to version control. Add `.env` to `.gitignore`. Use `.env.example` with placeholder values for documentation.

---

## Interview Perspective

**Q: What are the differences between CommonJS and ES Modules in Node.js?**

CommonJS uses `require()` and `module.exports`, loads synchronously at runtime, and cannot be tree-shaken. ES Modules use `import`/`export`, are parsed statically before execution (enabling tree-shaking), support top-level `await`, and are the official JavaScript standard. In Node, ESM requires either `.mjs` extension or `"type": "module"` in package.json.

**Q: How does the module resolution algorithm work?**

For relative paths (`./utils`), Node tries `.js`, `.json`, `.node` extensions, then checks for an `index.js` inside the directory. For bare specifiers (`express`), Node first checks core modules, then walks up the directory tree checking `node_modules/` folders at each level until the root.

**Q: What happens with circular dependencies in Node.js?**

Node doesn't crash on circular dependencies. When it detects a cycle, it returns the **partially initialized** exports of the module that's still executing. This means you might get `undefined` for exports that haven't been assigned yet. The solution is to restructure code to eliminate the cycle.

**Q: What is the difference between `global` in Node and `window` in the browser?**

Both are the global object for their runtime. However, in Node, top-level variables in a module are NOT added to `global` because every module is wrapped in a function (the module wrapper). In browsers, `var` declarations at the top level are added to `window`.

---

## Key Takeaways

- **CommonJS = synchronous, runtime-resolved, Node's default.** ESM = asynchronous, statically-analyzed, the standard.
- **Module wrapper function** is why `module`, `exports`, `require`, `__dirname`, `__filename` exist.
- **Modules are cached singletons.** Second `require()` returns the same object, not a fresh execution.
- **Circular dependencies** don't crash — they return partially initialized exports. Avoid them.
- **`process.env` values are always strings.** Parse them explicitly.
- **Never reassign `exports`** directly — always use `module.exports`.
