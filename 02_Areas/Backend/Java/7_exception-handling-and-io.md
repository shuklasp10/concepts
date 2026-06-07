# Exception Handling & I/O

> Exception handling is Java's structured mechanism for dealing with runtime errors without crashing the program. Combined with a deep understanding of Java's I/O system — from classic streams to modern NIO — this knowledge is essential for building robust, production-grade applications.

---

## Exception Hierarchy

```
                        Throwable
                      ┌─────┴─────┐
                   Error        Exception
                   │            ┌────┴─────────────┐
              (Don't catch) RuntimeException    Checked Exceptions
                   │            (Unchecked)      (Must handle)
            ┌──────┤         ┌──────┤          ┌──────┤
            │      │         │      │          │      │
       OutOfMemory StackOver NullPtr ClassCast IOExcept SQLException
       Error      flowError  Except  Except    ion
                             │
                        IllegalArgument
                        ArrayIndexOutOfBounds
                        ConcurrentModification
                        UnsupportedOperation
                        NumberFormatException
```

### The Three Categories

| Category | Superclass | Checked? | When |
|----------|-----------|----------|------|
| **Error** | `Error` | No | JVM-level catastrophes (OOM, StackOverflow). Don't catch these. |
| **Checked Exception** | `Exception` (not Runtime) | Yes — must handle or declare | Recoverable problems (file not found, network error, SQL error) |
| **Unchecked Exception** | `RuntimeException` | No | Programming bugs (null pointer, array index, class cast) |

### Mental Model

- **Checked exceptions** = problems the **outside world** can cause (file missing, network down). The compiler forces you to plan for them.
- **Unchecked exceptions** = problems caused by **your code** (null access, bad index). These are bugs — fix the code, don't catch them.
- **Errors** = problems caused by the **JVM/system** (out of memory, stack overflow). Nothing you can do.

> **Key Insight:** The checked vs unchecked debate is one of Java's most controversial designs. Checked exceptions enforce error handling but create verbose code and leaky abstractions. Modern Java libraries (Streams, CompletableFuture) avoid checked exceptions. Many frameworks convert checked to unchecked internally.

---

## Exception Handling Mechanics

### try-catch-finally

```java
try {
    // Code that might throw
    FileReader reader = new FileReader("data.txt");
    int data = reader.read();
} catch (FileNotFoundException e) {
    // Handle specific exception first (subclass before superclass)
    log.error("File not found", e);
} catch (IOException e) {
    // Handle broader exception
    log.error("I/O error", e);
} finally {
    // ALWAYS runs — even if catch throws or method returns
    // Used for cleanup (closing resources)
    reader.close();
}
```

### Multi-catch (Java 7+)

```java
try {
    // ...
} catch (FileNotFoundException | ParseException e) {
    // Handle both the same way — e is effectively final
    log.error("Input error: " + e.getMessage());
}
```

### try-with-resources (Java 7+)

> The most important improvement to exception handling. Automatically closes resources that implement `AutoCloseable`.

```java
// OLD — verbose, error-prone (might forget to close, or close() itself throws)
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader("data.txt"));
    String line = reader.readLine();
} catch (IOException e) {
    log.error("Error", e);
} finally {
    if (reader != null) {
        try { reader.close(); } catch (IOException e) { /* swallow */ }
    }
}

// NEW — clean, automatic, handles close() exceptions properly
try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line = reader.readLine();
} catch (IOException e) {
    log.error("Error", e);
}
// reader is automatically closed here — even if an exception was thrown
```

**How it works:**
1. Resources declared in `try(...)` are closed in **reverse order** when the block exits.
2. If both the try block AND `close()` throw exceptions, the close exception is **suppressed** (attached to the primary exception via `addSuppressed()`).

### Multiple Resources

```java
try (
    Connection conn = dataSource.getConnection();
    PreparedStatement stmt = conn.prepareStatement(sql);
    ResultSet rs = stmt.executeQuery()
) {
    while (rs.next()) {
        // Process results
    }
}
// All three closed automatically in reverse order: rs → stmt → conn
```

---

## Custom Exceptions

### When to Create Custom Exceptions

1. You need to carry **domain-specific information** (error codes, entity IDs).
2. You want to **distinguish your errors** from generic Java exceptions at catch sites.
3. You need a **consistent error handling pattern** across your application.

```java
// Unchecked — for programming/validation errors
public class EntityNotFoundException extends RuntimeException {
    private final String entityType;
    private final Object entityId;
    
    public EntityNotFoundException(String entityType, Object entityId) {
        super(String.format("%s not found with id: %s", entityType, entityId));
        this.entityType = entityType;
        this.entityId = entityId;
    }
    
    public String getEntityType() { return entityType; }
    public Object getEntityId() { return entityId; }
}

// Usage
throw new EntityNotFoundException("User", userId);

// Checked — for recoverable external problems
public class PaymentProcessingException extends Exception {
    private final String transactionId;
    private final String errorCode;
    
    public PaymentProcessingException(String message, String txnId, String errorCode, Throwable cause) {
        super(message, cause);  // Preserve the original exception chain
        this.transactionId = txnId;
        this.errorCode = errorCode;
    }
}
```

### Best Practices

```java
// ✅ Always preserve the cause chain
try {
    callExternal();
} catch (HttpException e) {
    throw new ServiceException("External call failed", e);  // Wrap with cause
}

// ❌ DON'T swallow the original exception
try {
    callExternal();
} catch (HttpException e) {
    throw new ServiceException("Failed");  // Original exception lost!
}

// ❌ DON'T use exceptions for flow control
try {
    int value = map.get(key);  // Might throw NPE
} catch (NullPointerException e) {
    value = defaultValue;
}

// ✅ Use normal control flow
Integer value = map.getOrDefault(key, defaultValue);

// ❌ DON'T catch Exception or Throwable broadly
catch (Exception e) { ... }  // Catches everything including NullPointerException — hides bugs

// ✅ Catch specific exceptions
catch (IOException e) { ... }
```

---

## Java I/O — Classic (java.io)

### Stream-Based I/O

Java's classic I/O uses **byte streams** and **character streams**.

```
                    ┌─────────────┐
                    │  Byte-based  │  (raw bytes — images, binary data)
                    ├─────────────┤
                    │ InputStream  │ → FileInputStream, BufferedInputStream
                    │ OutputStream │ → FileOutputStream, BufferedOutputStream
                    └─────────────┘
                    
                    ┌─────────────┐
                    │ Char-based   │  (text — files, console)
                    ├─────────────┤
                    │ Reader       │ → FileReader, BufferedReader, InputStreamReader
                    │ Writer       │ → FileWriter, BufferedWriter, OutputStreamWriter
                    └─────────────┘
```

### Decorator Pattern in I/O

Java I/O uses the **Decorator pattern** — you wrap streams to add functionality:

```java
// Each layer adds a capability
InputStream raw = new FileInputStream("data.bin");           // Raw byte access
InputStream buffered = new BufferedInputStream(raw);         // + Buffering (performance)
DataInputStream data = new DataInputStream(buffered);        // + Read primitives (readInt, readDouble)

// Text reading — character stream with buffering
BufferedReader reader = new BufferedReader(                   // + Line-by-line reading
    new InputStreamReader(                                    // + Byte-to-char conversion (encoding)
        new FileInputStream("text.txt"),                     // Raw bytes
        StandardCharsets.UTF_8                                // Explicit charset
    )
);
```

### Reading Files — Classic Approaches

```java
// Read all lines (small files only — loads entire file into memory)
List<String> lines = Files.readAllLines(Path.of("data.txt"));

// Read line by line (memory efficient)
try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        process(line);
    }
}

// Modern approach — Stream (lazy, memory efficient)
try (Stream<String> lines = Files.lines(Path.of("data.txt"))) {
    lines.filter(line -> !line.isEmpty())
         .map(String::trim)
         .forEach(System.out::println);
}
```

---

## NIO.2 — Modern File I/O (java.nio.file)

### Path and Files API (Java 7+)

The modern replacement for `java.io.File`.

```java
// Creating paths
Path path = Path.of("src", "main", "data.txt");   // src/main/data.txt
Path path = Path.of("/home/user/documents");
Path path = Paths.get("data.txt");                 // Equivalent

// Path operations
path.getFileName();       // data.txt
path.getParent();         // src/main
path.toAbsolutePath();    // /full/path/to/src/main/data.txt
path.resolve("sub");      // src/main/data.txt/sub (append)
path.resolveSibling("other.txt");  // src/main/other.txt (sibling)
path.normalize();         // Resolve . and .. references
```

### Files Utility Class

```java
// Read
String content = Files.readString(path);
List<String> lines = Files.readAllLines(path);
byte[] bytes = Files.readAllBytes(path);

// Write
Files.writeString(path, "Hello", StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
Files.write(path, lines, StandardCharsets.UTF_8);

// Check
Files.exists(path);
Files.isDirectory(path);
Files.isReadable(path);
Files.size(path);          // File size in bytes

// Create
Files.createDirectory(path);
Files.createDirectories(path);  // Mkdir -p equivalent
Files.createTempFile("prefix", ".tmp");

// Copy, Move, Delete
Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
Files.move(source, target, StandardCopyOption.ATOMIC_MOVE);
Files.delete(path);          // Throws if not exists
Files.deleteIfExists(path);  // Returns boolean

// Walk directory tree
try (Stream<Path> walk = Files.walk(rootPath)) {
    walk.filter(Files::isRegularFile)
        .filter(p -> p.toString().endsWith(".java"))
        .forEach(System.out::println);
}

// List directory contents (non-recursive)
try (Stream<Path> listing = Files.list(directoryPath)) {
    listing.forEach(System.out::println);
}
```

### `java.io.File` vs `java.nio.file.Path`

| Feature | `File` (old) | `Path` + `Files` (new) |
|---------|-------------|----------------------|
| API style | Methods on File object | Static methods on Files utility |
| Symbolic links | Limited support | Full support |
| Error handling | Returns boolean (silent failure) | Throws IOException (explicit failure) |
| File attributes | Basic (name, size) | Rich (permissions, owner, timestamps) |
| Atomic operations | No | `ATOMIC_MOVE`, etc. |
| Walk directory | `listFiles()` (arrays) | `Files.walk()` (Stream — lazy) |

---

## Serialization

### What Is Serialization?

> Converting an object's state into a byte stream for storage or transmission. Deserialization is the reverse.

```java
public class User implements Serializable {
    private static final long serialVersionUID = 1L;  // Version control
    
    private String name;
    private int age;
    private transient String password;  // NOT serialized (sensitive data)
}

// Serialize (write object to file)
try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("user.dat"))) {
    oos.writeObject(user);
}

// Deserialize (read object from file)
try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("user.dat"))) {
    User user = (User) ois.readObject();
}
```

### serialVersionUID

A version number for the serialized class. If the class changes (fields added/removed) and the UID doesn't match, deserialization throws `InvalidClassException`. Always declare it explicitly.

### `transient` Keyword

Marks a field to be excluded from serialization. Use for:
- Sensitive data (passwords, tokens)
- Derived/computed fields
- Non-serializable fields (database connections, threads)

### Why Java Serialization Is Problematic

1. **Security vulnerability** — deserialization of untrusted data can execute arbitrary code.
2. **Fragile** — class changes break compatibility.
3. **Slow** — Java's built-in serialization is significantly slower than alternatives.

> **Modern Alternative:** Use JSON (Jackson/Gson), Protocol Buffers, or Avro instead of Java serialization. They're faster, safer, and language-independent.

---

## BufferedReader vs Scanner

| Feature | BufferedReader | Scanner |
|---------|---------------|---------|
| **Purpose** | Efficient text reading | Parsing input into tokens |
| **Performance** | Faster (larger buffer, less overhead) | Slower (regex-based parsing) |
| **Buffer size** | 8KB default | 1KB default |
| **Parsing** | Reads raw text — YOU parse | Parses into int, double, etc. |
| **Thread-safe** | Synchronized (thread-safe) | Not thread-safe |
| **Use when** | Reading files, streams | Parsing user console input |

```java
// BufferedReader — for file/stream reading
try (BufferedReader br = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        int value = Integer.parseInt(line.trim());  // Manual parsing
    }
}

// Scanner — for parsing typed input
Scanner scanner = new Scanner(System.in);
int age = scanner.nextInt();       // Auto-parses
String name = scanner.nextLine();  // Reads rest of line
```

---

## Interview Perspective

**Q: What is the difference between checked and unchecked exceptions?**

Checked exceptions (subclass of `Exception` but not `RuntimeException`) must be caught or declared in the method signature — the compiler enforces this. They represent recoverable external problems (I/O, network). Unchecked exceptions (subclass of `RuntimeException`) don't require handling — they represent programming bugs (null pointer, bad index). Checked exceptions were a Java design choice to force error handling; modern Java and most frameworks prefer unchecked exceptions for cleaner code.

**Q: Explain try-with-resources. How does it work internally?**

try-with-resources (Java 7+) automatically closes `AutoCloseable` resources when the block exits. Resources are closed in reverse declaration order. If both the try block and `close()` throw, the close exception is attached as a suppressed exception on the primary exception. It eliminates boilerplate `finally` blocks and prevents resource leaks.

**Q: When should you create custom exceptions?**

When you need domain-specific error information (error codes, entity IDs), when you want to distinguish your errors from generic Java exceptions at catch sites, or when building a consistent error-handling layer (e.g., `ServiceException` wrapping lower-level exceptions). Extend `RuntimeException` for programming errors, `Exception` for recoverable situations.

**Q: What is the `transient` keyword?**

`transient` marks a field to be excluded from Java serialization. The field's value is not written to the byte stream. Use for sensitive data (passwords), non-serializable fields (connections), or derived/cached values that can be recomputed.

**Q: `Path`/`Files` vs `File` — which should you use?**

Always prefer `java.nio.file.Path` + `Files` (Java 7+). They provide better error handling (throws exceptions instead of returning boolean), support symbolic links, atomic operations, file attributes, and lazy directory traversal with streams. `java.io.File` is legacy.

**Q: Why is `finally` always executed?**

`finally` runs after try/catch regardless of the outcome — normal completion, exception thrown, or even `return` in the try block. The only exceptions: `System.exit()` is called, or the JVM crashes. It's designed for cleanup (closing resources), which must happen regardless of errors.

---

## Key Takeaways

- **Checked exceptions** = external problems (compiler forces handling). **Unchecked** = bugs (fix the code). **Errors** = JVM catastrophes (don't catch).
- **try-with-resources** is mandatory for any `AutoCloseable` resource. Never write `finally` blocks for resource cleanup manually.
- **Always preserve the cause chain** when wrapping exceptions (`new CustomException(msg, cause)`).
- **Don't use exceptions for flow control.** Use `Optional`, `Map.getOrDefault()`, null checks.
- **`Path` + `Files`** (NIO.2) replaces `File`. Use `Files.lines()` for lazy, memory-efficient file reading.
- **Avoid Java serialization** in new code. Use JSON (Jackson), Protocol Buffers, or other modern formats.
- **BufferedReader** for performance-critical file reading. **Scanner** for parsing console input.
- **`transient`** excludes fields from serialization. Always declare `serialVersionUID` explicitly.
