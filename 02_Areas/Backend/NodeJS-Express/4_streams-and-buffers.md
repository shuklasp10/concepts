# Streams & Buffers

> Streams are Node's mechanism for handling data piece-by-piece instead of loading everything into memory at once. They make it possible to process gigabytes of data with constant memory usage — a fundamental pattern for scalable backend systems.

---

## Buffers — Binary Data in JavaScript

### Problem It Solves

JavaScript was designed for text manipulation in browsers. It had no way to handle raw binary data (images, video, network packets, file bytes). Node.js introduced `Buffer` — a fixed-size chunk of memory allocated outside the V8 heap — to handle binary data efficiently.

### Mental Model

A Buffer is like a **row of numbered mailboxes** in an apartment building. Each mailbox (byte) holds a small piece of data, and you can read/write to specific positions.

### How Buffers Work

```javascript
// Creating Buffers
const buf1 = Buffer.from('Hello World', 'utf-8'); // From string
const buf2 = Buffer.alloc(10);                     // 10 zero-filled bytes
const buf3 = Buffer.allocUnsafe(10);               // 10 uninitialized bytes (faster, but may contain old memory data)

// Reading
console.log(buf1.toString());          // 'Hello World'
console.log(buf1.toString('hex'));     // '48656c6c6f20576f726c64'
console.log(buf1[0]);                  // 72 (ASCII code for 'H')
console.log(buf1.length);             // 11 bytes

// Writing
buf2.write('Hi');
console.log(buf2.toString());         // 'Hi' (followed by null bytes)

// Slicing (shares memory — no copy!)
const slice = buf1.slice(0, 5);
console.log(slice.toString());        // 'Hello'

// Concatenating
const combined = Buffer.concat([buf1, Buffer.from('!')]);
console.log(combined.toString());     // 'Hello World!'
```

> **`alloc` vs `allocUnsafe`:** `Buffer.alloc(n)` zero-fills the memory (safe but slower). `Buffer.allocUnsafe(n)` skips zero-filling (fast but may expose old memory data). Use `alloc` unless you're immediately overwriting every byte.

---

## Streams — The Core Pattern

### Problem It Solves

Imagine reading a 2GB video file:

```javascript
// ❌ Load entire file into memory
const data = fs.readFileSync('video.mp4'); // 2GB in RAM!
res.end(data);

// ✅ Stream it piece by piece
const stream = fs.createReadStream('video.mp4'); // ~64KB chunks
stream.pipe(res); // Each chunk is sent immediately, memory stays constant
```

| Approach | Memory Usage | Time to First Byte | Handles 2GB Files? |
|----------|-------------|--------------------|--------------------|
| `readFile` (Buffer) | ~2GB | Slow (waits for full read) | Crashes (out of memory) |
| `createReadStream` (Stream) | ~64KB | Fast (starts immediately) | ✅ No problem |

### Mental Model

- **Buffer approach:** Filling an entire swimming pool, then pouring it into cups.
- **Stream approach:** Connecting a water pipe directly from the source to the cups — water flows continuously without needing a pool.

---

## Four Types of Streams

| Type | Description | Example | Mental Model |
|------|-------------|---------|--------------|
| **Readable** | Source of data you can read from | `fs.createReadStream`, `http.IncomingMessage` (req) | A tap (faucet) — water flows out |
| **Writable** | Destination you can write to | `fs.createWriteStream`, `http.ServerResponse` (res) | A sink — water flows in |
| **Duplex** | Both readable and writable (independent) | TCP socket, `net.Socket` | A phone — speak and listen simultaneously |
| **Transform** | Duplex that modifies data as it passes through | `zlib.createGzip()`, `crypto.createCipher()` | A water filter — water flows through and gets cleaned |

### Readable Stream

```javascript
import { createReadStream } from 'fs';

const readable = createReadStream('large-file.txt', {
  encoding: 'utf-8',
  highWaterMark: 16 * 1024, // 16KB chunks (default is 64KB)
});

// Event-based consumption
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
});

readable.on('end', () => {
  console.log('No more data.');
});

readable.on('error', (err) => {
  console.error('Read error:', err.message);
});
```

#### Readable Stream Modes

| Mode | How It Works | Trigger |
|------|-------------|---------|
| **Flowing** | Data pushed automatically via `data` event | Attaching `data` listener, calling `.pipe()`, or `.resume()` |
| **Paused** | Data must be pulled manually via `.read()` | Default mode. Call `.pause()` to switch back |

### Writable Stream

```javascript
import { createWriteStream } from 'fs';

const writable = createWriteStream('output.txt');

writable.write('First line\n');
writable.write('Second line\n');
writable.end('Final line\n'); // Signals no more data will be written

writable.on('finish', () => {
  console.log('All data written to file.');
});

writable.on('error', (err) => {
  console.error('Write error:', err.message);
});
```

### Transform Stream

```javascript
import { Transform } from 'stream';

// Custom Transform: converts input to uppercase
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // Push the modified data to the readable side
    this.push(chunk.toString().toUpperCase());
    callback(); // Signal that processing is done
  }
});

// Usage: pipe readable → transform → writable
process.stdin
  .pipe(upperCaseTransform)
  .pipe(process.stdout);
```

### Duplex Stream

```javascript
import { Duplex } from 'stream';

const duplex = new Duplex({
  read(size) {
    this.push('data from readable side\n');
    this.push(null); // end readable side
  },
  write(chunk, encoding, callback) {
    console.log('Writable received:', chunk.toString());
    callback();
  }
});
```

---

## `fs.createReadStream` vs `fs.readFile`

### When to Use Which

| Scenario | Use | Why |
|----------|-----|-----|
| Small file (<10MB), need entire content | `fs.readFile` | Simpler API, entire content in memory is fine |
| Large file (>10MB) | `createReadStream` | Constant memory, won't crash on huge files |
| Sending file as HTTP response | `createReadStream` + `.pipe(res)` | Starts sending immediately, low memory |
| Processing file line by line | `createReadStream` + readline | Efficient line-by-line parsing |
| Need to search/replace in entire content | `fs.readFile` | Need the full string in memory |

### Real-World: Streaming a File as HTTP Response

```javascript
import http from 'http';
import fs from 'fs';

http.createServer((req, res) => {
  // ❌ BAD — loads entire file into memory
  // const data = fs.readFileSync('video.mp4');
  // res.end(data);

  // ✅ GOOD — streams chunk by chunk
  const stream = fs.createReadStream('video.mp4');
  res.writeHead(200, { 'Content-Type': 'video/mp4' });
  stream.pipe(res);

  stream.on('error', (err) => {
    res.writeHead(500);
    res.end('Server Error');
  });
}).listen(3000);
```

---

## Piping and Chaining Streams

### The `.pipe()` Method

`.pipe()` connects a Readable stream to a Writable stream. It handles data flow, backpressure, and cleanup automatically.

```javascript
// Simple pipe: read → write
readable.pipe(writable);

// Chaining: read → transform → transform → write
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())        // Compress
  .pipe(crypto.createCipheriv())  // Encrypt
  .pipe(fs.createWriteStream('output.txt.gz.enc'));
```

### The `pipeline()` Function (Recommended)

`.pipe()` has a flaw — it doesn't properly handle errors and cleanup across the chain. Use `pipeline()` from `stream/promises` instead:

```javascript
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';

try {
  await pipeline(
    createReadStream('input.txt'),
    createGzip(),
    createWriteStream('input.txt.gz')
  );
  console.log('Compression complete');
} catch (err) {
  console.error('Pipeline failed:', err.message);
  // All streams are properly cleaned up automatically
}
```

> **Why `pipeline()` over `.pipe()`?** `.pipe()` does NOT propagate errors through the chain and does NOT destroy streams on failure. `pipeline()` handles both — it destroys all streams if any stream errors, preventing resource leaks.

---

## Backpressure

### The Problem

If a Readable stream produces data faster than the Writable stream can consume it, data accumulates in memory — defeating the purpose of streaming.

**Real-world analogy:** A fast assembly line feeding a slow packing station. Without a mechanism to slow down the assembly line, boxes pile up on the floor.

### How Node.js Handles It

Every Writable stream has an **internal buffer** (sized by `highWaterMark`, default 16KB for object mode, 16KB for strings). When you call `writable.write(chunk)`:

- If the internal buffer is below `highWaterMark` → returns `true` (safe to write more).
- If the internal buffer is at or above `highWaterMark` → returns `false` (stop writing!).

```javascript
const writable = fs.createWriteStream('output.txt');
const readable = fs.createReadStream('huge-file.txt');

readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  
  if (!canContinue) {
    // ⚠️ Backpressure! Writable buffer is full
    readable.pause(); // Stop reading
    
    writable.once('drain', () => {
      // Writable buffer drained — safe to resume
      readable.resume();
    });
  }
});
```

> **Key Insight:** `.pipe()` and `pipeline()` handle backpressure automatically. The above manual handling is only needed when processing streams without piping.

### Backpressure Flow

```
Readable                           Writable
   │                                  │
   │──── chunk ────────────────►      │ (buffer has space → returns true)
   │──── chunk ────────────────►      │ (buffer has space → returns true)
   │──── chunk ────────────────►      │ (buffer FULL → returns false)
   │                                  │
   │  ◄──── 'drain' event ────────── │ (buffer drained, ready for more)
   │                                  │
   │──── chunk ────────────────►      │ (continue writing)
```

---

## Real-World Use Cases

### 1. CSV File Processing (Line by Line)

```javascript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const fileStream = createReadStream('users.csv');
const rl = createInterface({ input: fileStream });

let lineCount = 0;

for await (const line of rl) {
  lineCount++;
  const [name, email] = line.split(',');
  // Process each line without loading entire file
}

console.log(`Processed ${lineCount} lines`);
```

### 2. HTTP Request Body Parsing

The `req` object in Node's HTTP server IS a Readable stream:

```javascript
http.createServer((req, res) => {
  const chunks = [];

  req.on('data', (chunk) => chunks.push(chunk));

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    const parsed = JSON.parse(body);
    res.end(`Received: ${parsed.name}`);
  });
}).listen(3000);
```

### 3. File Compression

```javascript
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';

// Compress
await pipeline(
  createReadStream('data.json'),
  createGzip(),
  createWriteStream('data.json.gz')
);

// Decompress
await pipeline(
  createReadStream('data.json.gz'),
  createGunzip(),
  createWriteStream('data-restored.json')
);
```

---

## Interview Perspective

**Q: Explain the differences between Streams and Buffers in Node.js.**

A Buffer is a fixed-size chunk of binary data held in memory — the entire data exists at once. A Stream is a sequence of data made available over time, processed piece-by-piece. Buffers are used when you need the complete data (small files, parsing). Streams are used when data is too large for memory or when you want to start processing before all data arrives.

**Q: When would you use `fs.createReadStream` instead of `fs.readFile`?**

Use `createReadStream` for large files (>10MB), when streaming to an HTTP response, or when processing line-by-line. It uses constant memory (~64KB) regardless of file size. Use `readFile` for small files where you need the entire content in memory (e.g., JSON config files).

**Q: What are the four types of streams in Node.js? Provide a use case for each.**

Readable (reading files, HTTP request bodies), Writable (writing files, HTTP responses), Duplex (TCP sockets — read and write independently), Transform (compression with gzip, encryption — modify data as it passes through).

**Q: How do you handle "backpressure" when piping streams?**

Backpressure occurs when the Readable produces data faster than the Writable can consume. `writable.write()` returns `false` when its buffer is full. You should pause the Readable and resume when the Writable emits a `drain` event. `.pipe()` and `pipeline()` handle this automatically — prefer `pipeline()` because it also handles error propagation and stream cleanup.

---

## Key Takeaways

- **Buffers** = fixed-size binary data in memory. **Streams** = data flowing over time in chunks.
- **Four stream types:** Readable (source), Writable (destination), Duplex (both), Transform (modify in flight).
- **Use streams for anything large.** Constant memory usage regardless of data size.
- **`pipeline()` > `.pipe()`** — proper error handling and stream cleanup.
- **Backpressure** is automatic with `.pipe()`/`pipeline()`, manual otherwise.
- **`highWaterMark`** controls buffer size (default 64KB for file streams, 16KB for object streams).
- **The `req` object IS a Readable stream.** The `res` object IS a Writable stream.
