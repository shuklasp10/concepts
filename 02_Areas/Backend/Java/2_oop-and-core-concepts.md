# OOP & Core Concepts

> Java is an object-oriented language where everything revolves around classes and objects. Understanding OOP is not about memorizing four pillars — it's about understanding WHY each concept exists, what problem it solves, and the trade-offs of different design decisions.

---

## The Four Pillars — But Actually Understood

### 1. Encapsulation

#### Problem It Solves

Without encapsulation, any code anywhere can reach into an object and modify its internal state. Imagine a `BankAccount` where anyone can directly set `balance = -1000`. There's no validation, no audit trail, no control.

#### The Solution

Hide internal state behind controlled access methods. The object itself decides how its data can be read or modified.

```java
// BAD — No encapsulation
public class BankAccount {
    public double balance;  // Anyone can set this to anything
}

account.balance = -999;  // No validation. Disaster.
```

```java
// GOOD — Encapsulated
public class BankAccount {
    private double balance;
    
    public double getBalance() {
        return balance;
    }
    
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        this.balance += amount;
    }
    
    public void withdraw(double amount) {
        if (amount > balance) throw new InsufficientFundsException();
        this.balance -= amount;
    }
}
```

#### Mental Model

Encapsulation is like an **ATM machine**. You don't reach into the vault and grab cash. You use a controlled interface (buttons, screen) that validates your request, checks your balance, and dispenses money. The internal mechanism is hidden.

> **Key Insight:** Encapsulation is not just "make fields private and add getters/setters." Blindly adding `getBalance()`/`setBalance()` is the same as making the field public. True encapsulation means exposing **behavior** (deposit, withdraw) not **data** (setBalance).

### Access Modifiers

| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| `private` | ✅ | ❌ | ❌ | ❌ |
| (default/package-private) | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

> **Common Mistake:** `protected` is NOT "only for subclasses." It also allows access from any class in the **same package**. This surprises many developers.

---

### 2. Inheritance

#### Problem It Solves

Without inheritance, you'd copy-paste the same fields and methods across similar classes. A `Dog` and `Cat` both have `name`, `age`, `eat()`, `sleep()`. Duplication means bugs are fixed in one place but not the other.

#### The Solution

Define shared behavior in a parent class. Children inherit and optionally extend or override it.

```java
public class Animal {
    protected String name;
    protected int age;
    
    public void eat() {
        System.out.println(name + " is eating");
    }
    
    public void sleep() {
        System.out.println(name + " is sleeping");
    }
}

public class Dog extends Animal {
    public void bark() {
        System.out.println(name + " says: Woof!");
    }
    
    @Override
    public void eat() {
        System.out.println(name + " is eating kibble");  // Specialized behavior
    }
}
```

#### Mental Model

Inheritance is like **biological inheritance**. A child inherits traits from parents (eye color, height) but can also develop unique traits. A `Dog` inherits generic `Animal` behavior but adds `bark()`.

#### Why Java Doesn't Allow Multiple Class Inheritance

```
     ┌─────────┐     ┌─────────┐
     │ Class A  │     │ Class B  │
     │ void f() │     │ void f() │
     └────┬─────┘     └────┬─────┘
          │                 │
          └────────┬────────┘
                   │
              ┌────▼────┐
              │ Class C  │   ← Which f() does C inherit? AMBIGUOUS
              └─────────┘
              
              This is the "Diamond Problem"
```

Java solves this by allowing **single class inheritance** but **multiple interface implementation**. Interfaces with default methods can create a similar diamond, but Java requires the implementing class to explicitly override the conflicting method.

---

### 3. Polymorphism

#### Problem It Solves

Without polymorphism, you'd need separate methods for each type: `drawCircle()`, `drawSquare()`, `drawTriangle()`. Adding a new shape means modifying every piece of code that processes shapes.

#### The Solution

Define a common interface, and let each type implement its own behavior. The calling code doesn't need to know the specific type.

```java
public abstract class Shape {
    abstract double area();
}

public class Circle extends Shape {
    private double radius;
    
    @Override
    double area() { return Math.PI * radius * radius; }
}

public class Rectangle extends Shape {
    private double width, height;
    
    @Override
    double area() { return width * height; }
}

// Polymorphic usage — works with ANY shape, present or future
public double totalArea(List<Shape> shapes) {
    return shapes.stream().mapToDouble(Shape::area).sum();
}
```

#### Compile-Time vs Runtime Polymorphism

| Type | Mechanism | Resolved At | Example |
|------|----------|-------------|---------|
| **Compile-time** (Static) | Method Overloading | Compilation | `print(int)` vs `print(String)` — compiler picks based on argument type |
| **Runtime** (Dynamic) | Method Overriding | Execution | `shape.area()` — JVM checks actual object type at runtime via vtable |

#### How Runtime Polymorphism Works Internally

```java
Shape s = new Circle(5);  // Reference type: Shape, Object type: Circle
s.area();  // Which area() is called?
```

1. `s` is a `Shape` reference → compiler verifies `area()` exists in `Shape`. ✅
2. At runtime, JVM looks at the **actual object type** (Circle), not the reference type.
3. JVM uses the **virtual method table (vtable)** — a lookup table mapping method signatures to actual implementations.
4. It finds `Circle.area()` in the vtable → executes Circle's version.

> **Key Insight:** The reference type determines **what you can call** (compile-time check). The object type determines **which implementation runs** (runtime dispatch).

---

### 4. Abstraction

#### Problem It Solves

Users of a class shouldn't need to understand its internal complexity. A developer using `List.add()` doesn't care whether the underlying structure is an array or a linked list.

#### Abstract Classes vs Interfaces

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| **Purpose** | Partial implementation ("is-a" with shared code) | Contract/capability ("can-do") |
| **Inheritance** | Single (`extends`) | Multiple (`implements`) |
| **Constructors** | ✅ Yes | ❌ No |
| **Fields** | Instance fields (any modifier) | Only `public static final` constants |
| **Methods** | Abstract + concrete | Abstract + `default` + `static` (Java 8+) + `private` (Java 9+) |
| **State** | Can hold state (instance variables) | Cannot hold instance state |

#### When to Use Which?

```
Use an ABSTRACT CLASS when:
  → You want to share CODE among related classes
  → Classes share common state (fields)
  → You need constructors
  → There's a clear "is-a" relationship
  Example: Animal → Dog, Cat, Bird

Use an INTERFACE when:
  → You want to define a CAPABILITY/CONTRACT
  → Unrelated classes need the same behavior
  → You need multiple inheritance
  → You want loose coupling
  Example: Serializable, Comparable, Runnable
```

#### Default Methods in Interfaces (Java 8+)

```java
public interface Loggable {
    // Abstract — must implement
    String getLogPrefix();
    
    // Default — optional to override
    default void log(String message) {
        System.out.println(getLogPrefix() + ": " + message);
    }
    
    // Static — utility, called on interface itself
    static Loggable create(String prefix) {
        return () -> prefix;  // Lambda since functional interface
    }
}
```

> **Why were defaults added?** To evolve interfaces without breaking existing implementations. When Java 8 added `stream()` to `Collection`, they couldn't add an abstract method — it would break every class implementing `Collection`. Default methods allowed adding `stream()` with a default implementation.

---

## SOLID Principles

### S — Single Responsibility Principle

> A class should have only **one reason to change**.

```java
// BAD — Employee does everything
public class Employee {
    public void calculatePay() { ... }
    public void saveToDatabase() { ... }
    public void generateReport() { ... }
}

// GOOD — Separated responsibilities
public class Employee { /* data only */ }
public class PayrollService { public void calculatePay(Employee e) { ... } }
public class EmployeeRepository { public void save(Employee e) { ... } }
public class ReportGenerator { public void generate(Employee e) { ... } }
```

### O — Open/Closed Principle

> Open for **extension**, closed for **modification**.

```java
// BAD — Adding a new shape requires modifying this method
public double area(Object shape) {
    if (shape instanceof Circle c) return Math.PI * c.radius * c.radius;
    if (shape instanceof Rectangle r) return r.width * r.height;
    // Adding Triangle? Modify this method. Violates OCP.
}

// GOOD — New shapes just implement the interface
public interface Shape { double area(); }
public class Triangle implements Shape {
    @Override public double area() { return 0.5 * base * height; }
}
```

### L — Liskov Substitution Principle

> Subtype objects must be **substitutable** for their parent type without breaking the program.

```java
// VIOLATION — Square breaks the Rectangle contract
public class Rectangle {
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w) { this.width = w; this.height = w; }  // Surprise!
    @Override
    public void setHeight(int h) { this.width = h; this.height = h; } // Surprise!
}

// Code that works with Rectangle breaks with Square:
Rectangle r = new Square();
r.setWidth(5);
r.setHeight(10);
assert r.area() == 50;  // FAILS! area is 100 because Square made width=height=10
```

### I — Interface Segregation Principle

> No client should be forced to depend on methods it doesn't use.

```java
// BAD — Printer interface forces Scanner to implement print
public interface MultiFunctionDevice {
    void print();
    void scan();
    void fax();
}

// GOOD — Split into focused interfaces
public interface Printable { void print(); }
public interface Scannable { void scan(); }
public interface Faxable { void fax(); }

public class ModernPrinter implements Printable, Scannable { ... }
public class OldFax implements Faxable { ... }
```

### D — Dependency Inversion Principle

> Depend on **abstractions**, not on **concrete implementations**.

```java
// BAD — Tightly coupled to MySQL
public class OrderService {
    private MySQLDatabase db = new MySQLDatabase();  // Concrete dependency
}

// GOOD — Depends on abstraction
public class OrderService {
    private final Database db;  // Interface
    
    public OrderService(Database db) {  // Injected — can be MySQL, Postgres, Mock
        this.db = db;
    }
}
```

---

## Records (Java 16+)

### Problem They Solve

Simple data-holding classes require massive boilerplate: constructor, getters, `equals()`, `hashCode()`, `toString()`. For a class with 5 fields, that's 50+ lines of boilerplate.

### The Solution

```java
// OLD — 40+ lines of boilerplate
public class Point {
    private final int x;
    private final int y;
    
    public Point(int x, int y) { this.x = x; this.y = y; }
    public int getX() { return x; }
    public int getY() { return y; }
    @Override public boolean equals(Object o) { ... }
    @Override public int hashCode() { ... }
    @Override public String toString() { ... }
}

// NEW — One line
public record Point(int x, int y) {}
```

### What You Get Automatically

- `private final` fields for each component
- Canonical constructor
- Accessor methods (`x()`, `y()` — NOT `getX()`)
- `equals()` based on all components
- `hashCode()` based on all components
- `toString()` with component names and values

### What Records Cannot Do

- Fields are always `final` — records are **immutable**
- Cannot extend other classes (implicitly extend `Record`)
- Cannot declare instance fields beyond the record components
- **Can** implement interfaces, have static fields, custom methods, and compact constructors

```java
public record Email(String address) {
    // Compact constructor — validation
    public Email {
        if (!address.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + address);
        }
        address = address.toLowerCase();  // Normalize
    }
}
```

---

## Sealed Classes (Java 17+)

### Problem They Solve

How do you restrict which classes can extend your base class? With `abstract`, anyone can extend. With `final`, no one can. There was no middle ground.

### The Solution

```java
public sealed class Shape permits Circle, Rectangle, Triangle {
    // Only Circle, Rectangle, and Triangle can extend this
}

public final class Circle extends Shape { ... }        // final — no further subclassing
public sealed class Rectangle extends Shape permits Square { ... }  // Allow specific further extension
public non-sealed class Triangle extends Shape { ... }  // Open for any extension
```

### Why This Matters

Sealed classes + pattern matching enable **exhaustive switch expressions**:

```java
// Compiler KNOWS all possible subtypes — no default needed
double area = switch (shape) {
    case Circle c    -> Math.PI * c.radius() * c.radius();
    case Rectangle r -> r.width() * r.height();
    case Triangle t  -> 0.5 * t.base() * t.height();
    // No default needed — compiler verifies exhaustiveness
};
```

---

## Pattern Matching (Java 16+)

### `instanceof` Pattern Matching

```java
// OLD — Redundant casting
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// NEW — Binding variable
if (obj instanceof String s) {
    System.out.println(s.length());  // s is already cast
}
```

### Switch Pattern Matching (Java 21+)

```java
public String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "Positive integer: " + i;
        case Integer i            -> "Non-positive integer: " + i;
        case String s             -> "String of length " + s.length();
        case null                 -> "null value";
        default                   -> "Unknown: " + obj.getClass();
    };
}
```

---

## Composition vs Inheritance

### The Problem with Inheritance

Inheritance creates **tight coupling** between parent and child. Changes to the parent ripple through all children. Deep hierarchies become rigid and hard to modify.

> **Guideline:** "Favor composition over inheritance" — GoF Design Patterns book.

| Aspect | Inheritance | Composition |
|--------|------------|-------------|
| Relationship | "is-a" (Dog IS an Animal) | "has-a" (Car HAS an Engine) |
| Coupling | Tight (child depends on parent internals) | Loose (delegate to collaborator) |
| Flexibility | Fixed at compile time | Changeable at runtime |
| Reusability | Inherits everything, even what you don't need | Pick and choose behaviors |
| Testing | Hard to test in isolation | Easy to mock dependencies |

```java
// INHERITANCE approach — rigid
public class NotificationService extends EmailSender {
    // Inherits ALL of EmailSender, even if you only need send()
    // What if you also need SMS? Can't extend two classes.
}

// COMPOSITION approach — flexible
public class NotificationService {
    private final MessageSender sender;  // Could be EmailSender, SMSSender, etc.
    
    public NotificationService(MessageSender sender) {
        this.sender = sender;
    }
    
    public void notify(String msg) {
        sender.send(msg);  // Delegate
    }
}
```

---

## `equals()` and `hashCode()` Contract

### The Contract

1. If `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` **MUST** be true.
2. If `a.hashCode() == b.hashCode()`, then `a.equals(b)` **MAY OR MAY NOT** be true (hash collisions exist).
3. If you override `equals()`, you **MUST** override `hashCode()`.

### Why This Matters

`HashMap` uses `hashCode()` to find the bucket, then `equals()` to find the exact key within the bucket. If you override `equals()` but not `hashCode()`, two equal objects may end up in different buckets, and `HashMap.get()` will never find your key.

```java
public class Employee {
    private final String id;
    private final String name;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee employee = (Employee) o;
        return Objects.equals(id, employee.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
```

> **Common Bug:** Overriding `equals()` without `hashCode()`. Object looks equal with `.equals()` but can't be found in a `HashSet` or `HashMap`.

---

## Interview Perspective

**Q: What are the four pillars of OOP?**

Encapsulation (hide internals, expose behavior through controlled APIs), Inheritance (share code through parent-child hierarchies), Polymorphism (same interface, different implementations — compile-time via overloading, runtime via overriding), Abstraction (hide complexity behind simple interfaces — abstract classes for partial implementation with shared state, interfaces for pure contracts/capabilities).

**Q: When would you use an abstract class vs an interface?**

Abstract class when you need shared state (instance fields), constructors, or partial implementation among related classes (IS-A relationship). Interface when you need a contract for unrelated classes, multiple inheritance, or loose coupling. Since Java 8, interfaces can have default methods, but they still cannot hold instance state.

**Q: Explain the `equals()` and `hashCode()` contract.**

If two objects are equal via `equals()`, they MUST produce the same `hashCode()`. This is because `HashMap`/`HashSet` use `hashCode()` to find the bucket and `equals()` to confirm the match. Breaking this contract means objects that are logically equal cannot be found in hash-based collections.

**Q: What are Records and when should you use them?**

Records (Java 16+) are immutable data carriers that auto-generate constructors, accessors, `equals()`, `hashCode()`, and `toString()`. Use them for DTOs, value objects, API responses — any class whose identity is defined by its data. They cannot hold mutable state or extend classes.

**Q: Explain SOLID principles with examples.**

S — Single Responsibility: One class, one reason to change. O — Open/Closed: Extend behavior without modifying existing code (use polymorphism). L — Liskov Substitution: Subtypes must be drop-in replaceable for their parent types. I — Interface Segregation: Many focused interfaces over one fat interface. D — Dependency Inversion: Depend on abstractions (interfaces) injected via constructors, not concrete classes.

**Q: Why favor composition over inheritance?**

Inheritance creates tight coupling — child depends on parent's internals, you can't extend multiple classes, and you inherit everything (even what you don't need). Composition uses delegation — you hold a reference to a collaborator, can swap implementations at runtime, extend with multiple behaviors, and test with mocks. Use inheritance only for genuine IS-A relationships with shared code.

---

## Key Takeaways

- **Encapsulation** = expose behavior, not data. Getters/setters without logic are fake encapsulation.
- **Polymorphism** = the reference type determines what you CAN call; the object type determines what RUNS.
- **Favor composition over inheritance.** Use inheritance for genuine "is-a" with shared code only.
- **Abstract classes** hold state + partial implementation. **Interfaces** define contracts + capabilities.
- **SOLID** principles are about reducing coupling and increasing cohesion. They're guidelines, not dogma.
- **Records** eliminate DTO boilerplate. **Sealed classes** enable exhaustive pattern matching.
- **Always override `hashCode()` when you override `equals()`.** Breaking this contract breaks all hash-based collections.
