# Types, Interfaces, & Object Shapes

## Core Idea

> TypeScript's primary job is to ensure that the objects you pass around match the "shapes" you expect. We define these shapes using `type` aliases and `interface`s.

---

## 1. Structural Typing (Duck Typing)

### Core Idea
TypeScript uses **Structural Typing**. If an object has all the properties required by a type, TypeScript accepts it, even if it has extra properties or wasn't explicitly created as that type.

### Mental Model
"If it walks like a duck and quacks like a duck, it's a duck."
If a function asks for an object with an `id` and a `name`, it doesn't care if you pass it an `Employee` object or a `Customer` object—as long as the object structurally contains an `id` and a `name`.

---

## 2. Type vs Interface

This is the most common debate in TypeScript.

### `interface`
- **Purpose:** Specifically designed for defining the shape of Objects and Classes.
- **Mental Model:** A **contract** or blueprint. "Anything claiming to be a `User` must have these exact fields."

### `type` (Type Alias)
- **Purpose:** A broader tool. It can define object shapes, but it can also define primitives (strings/numbers), unions, and intersections.
- **Mental Model:** A **nickname**. You are just giving a complex structure a shorter, readable name.

### The Key Differences

| Feature | `interface` | `type` |
|---------|-------------|--------|
| Defines Objects | ✅ Yes | ✅ Yes |
| Defines Primitives/Unions | ❌ No | ✅ Yes |
| Merging (Declaration Merging) | ✅ Yes | ❌ No |
| Extending/Intersecting | `extends` | `&` (Intersection) |

### Declaration Merging (The unique power of `interface`)
If you define two `interface`s with the exact same name, TypeScript will automatically merge them into one. This is crucial when you are writing a library and want users to be able to add fields to your internal interfaces (like adding custom fields to the `Window` object). You **cannot** do this with `type`.

---

## 3. Extending Interfaces vs Intersecting Types

How do we combine shapes?

### Interface Extension (`extends`)
```typescript
interface Animal { name: string; }
interface Dog extends Animal { breed: string; }
```
- **Behavior:** Very strict. If `Dog` tries to redefine `name` as a number, the compiler will throw an error immediately.

### Type Intersection (`&`)
```typescript
type Animal = { name: string; };
type Dog = Animal & { breed: string; };
```
- **Behavior:** It mathematically merges the two types. If both define a `name` property with different types (e.g., `string` and `number`), TypeScript will silently resolve it to `never` (because a value cannot be both a string and a number simultaneously).

---

## 4. Union and Literal Types

### Union Types (`|`)
- **What it is:** Represents a value that can be one of several types.
- **Mental Model:** An **"OR" logic gate**. "This variable can be a `string` OR a `number`."

### Literal Types
- **What it is:** Instead of saying a variable is a `string`, you say it must be a *specific* string.
- **Usage:** Combined with Unions, this replaces Magic Strings.
```typescript
// Status can ONLY be one of these exact three strings
type Status = "pending" | "approved" | "rejected";
```

---

## 5. Object Property Modifiers

### `readonly`
- **What it is:** Marks a property so it cannot be changed after it is created.
- **Mental Model:** A **glass display case**. You can look at the object inside, but you cannot reach in and modify it.

### Index Signatures
- **What it is:** Used when you don't know the exact names of an object's properties in advance, but you know the *type* of the keys and values.
- **Mental Model:** A **dictionary**. You don't know every word in it, but you know every word is a string, and every definition is a string.
```typescript
interface StringDictionary {
  [key: string]: string; 
}
```

---

## 6. Enums & Their Drawbacks

### What is an Enum?
Enums allow you to define a set of named constants.

```typescript
enum Direction {
  Up = 1,
  Down = 2,
}
```

### The Drawback
Unlike almost everything else in TypeScript (which vanishes at compile-time), Enums are **not erased**. TypeScript actually compiles them into bulky JavaScript objects (Immediately Invoked Function Expressions). They add unnecessary runtime code to your bundle.
**Solution:** Prefer Union Literal Types (`"UP" | "DOWN"`) which vanish completely at compile-time and provide the same type safety.

---

## 7. Classes and OOP in TypeScript

TypeScript supercharges JavaScript classes by adding strict typing and visibility modifiers.

### Visibility Modifiers
- `public`: (Default) Accessible anywhere.
- `private`: Only accessible *inside* the class itself.
- `protected`: Accessible inside the class and any subclasses that `extend` it.

### The `implements` Keyword
You can force a class to adhere to a specific `interface` contract.
```typescript
interface Drivable { startEngine(): void; }

class Car implements Drivable {
  startEngine() { console.log("Vroom"); }
}
```

### Parameter Properties (Shortcut)
TypeScript offers a shorthand for declaring and assigning class properties directly in the constructor.
```typescript
// Traditional Way
class User {
  public name: string;
  constructor(name: string) { this.name = name; }
}

// TypeScript Shortcut (Does the exact same thing)
class User {
  constructor(public name: string) {}
}
```

---

## Interview Perspective

**Q: Difference between `interface` and `type`?**
An `interface` is specifically for shaping objects and supports declaration merging. A `type` alias can shape objects, but can also represent primitives, unions, and tuples. `type` uses intersections (`&`) while `interface` uses `extends`.

**Q: What is structural typing?**
TypeScript checks if the structure (shape) of an object matches the required type, rather than checking if they share the same explicit name or inheritance tree (like Nominal typing in Java).

**Q: Difference between interface extension and type intersection?**
Interface extension (`extends`) is strict and catches conflicting property types immediately. Type intersection (`&`) merges properties mathematically and resolves conflicts silently (often resulting in a `never` type).

**Q: What are union types and intersection types?**
- Union (`|`): The value can be type A **OR** type B.
- Intersection (`&`): The value combines the properties of type A **AND** type B.

**Q: What is a literal type in TypeScript?**
A type that represents a specific, exact value (e.g., `let status: "SUCCESS"`) rather than a general primitive type (like `string`).

**Q: What is enum in TypeScript? What are its drawbacks?**
Enums define a set of named constants. The major drawback is that they compile into actual JavaScript objects, adding bundle size and runtime overhead, unlike Union Literal types which vanish entirely at compile time.

**Q: What is a `readonly` property?**
A modifier that ensures an object property cannot be reassigned after it is initialized.

**Q: What is an index signature in TypeScript?**
Syntax used when you don't know the exact property names in advance, but you know the type of the keys and values (e.g., `[key: string]: number`).

**Q: What is declaration merging?**
When TypeScript finds two `interface` declarations with the same name, it automatically merges their properties into a single interface. This is unique to interfaces and cannot be done with `type`.

---

## Key Takeaways

- Start with `type` for everything. Use `interface` if you need declaration merging (often for publishing libraries) or deeply prefer the syntax.
- Understand Structural Typing: "Duck typing" is how TypeScript evaluates objects.
- Avoid Enums; use Union Literal Types instead to keep your runtime bundle clean.
