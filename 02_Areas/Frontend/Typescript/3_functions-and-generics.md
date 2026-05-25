# Functions & Generics

## Core Idea

> Functions are the verbs of your application. TypeScript ensures they accept the right arguments and return the expected results. Generics allow you to write functions that work flexibly across *many* types without losing type safety.

---

## 1. Typing Functions

### Basic Syntax
You must type both the parameters (inputs) and the return value (output).

```typescript
function calculateTax(amount: number, taxRate: number): number {
  return amount * taxRate;
}
```

### Optional Parameters
If a parameter is not strictly required, append a `?` to its name.
```typescript
function greet(name: string, greeting?: string) {
  // `greeting` will be `undefined` if not provided
  console.log(`${greeting || 'Hello'}, ${name}`);
}
```
**Important Rule:** Optional parameters must always come *after* required parameters in the function signature.

---

## 2. Function Overloads vs Union Types

### The Problem
Sometimes a function can accept different types of inputs and return different types of outputs based on those inputs.

### Union Types (The Simple Way)
If the logic is simple, use a Union type.
```typescript
function format(input: string | number): string {
  return input.toString();
}
```

### Function Overloads (The Complex Way)
If the return type heavily depends on the specific input type, unions become messy. Overloads allow you to define multiple distinct "signatures" for a single function.

```typescript
// 1. The Overload Signatures (No implementation, just definitions)
function getElement(id: number): Element;
function getElement(className: string): Element[];

// 2. The Implementation (Must handle all cases using 'any' or unions)
function getElement(identifier: number | string): any {
  if (typeof identifier === "number") {
    return document.getElementById(identifier.toString());
  } else {
    return document.getElementsByClassName(identifier);
  }
}
```
- **Mental Model:** A **menu with different combo meals**. Combo 1 gives you a burger and fries. Combo 2 gives you chicken and a salad. You cannot mix and match to get a burger and a salad. Overloads enforce specific input/output combos.

---

## 3. Generics: The Ultimate Reusability Tool

### Problem It Solves
Imagine writing a function that takes an array and returns the first element.

```typescript
function getFirst(arr: number[]): number { return arr[0]; }
// Wait, I need it for strings too...
function getFirstString(arr: string[]): string { return arr[0]; }
// Should I just use `any`? No, that ruins type safety!
function getFirstAny(arr: any[]): any { return arr[0]; } 
```
If you use `any`, you lose intellisense. If you pass an array of numbers, TypeScript won't know the return value is a number.

### How Generics Work
Generics allow you to pass a **Type as a Parameter**. Just like functions accept data as arguments, Generics accept Types as arguments (usually represented by a capital `<T>`).

```typescript
// <T> captures whatever type the user passes in
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const num = getFirst<number>([1, 2, 3]); // Returns type 'number'
const str = getFirst(["A", "B"]); // TS infers <string> automatically!
```

### Mental Model
Think of Generics as a **3D Printer**. A 3D printer isn't useful on its own. You have to feed it a digital blueprint (the Type `<T>`). If you feed it a blueprint for a mug, it prints a mug. If you feed it a blueprint for a toy, it prints a toy. Generics are templates waiting for a specific type blueprint to become concrete.

---

## 4. Generic Constraints (`extends`)

Sometimes, you want a Generic `<T>`, but you want to ensure it has *at least* some specific properties. You use the `extends` keyword to constrain it.

```typescript
// T can be anything, AS LONG AS it has a `.length` property
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}

logLength("hello"); // OK (strings have .length)
logLength([1, 2]);  // OK (arrays have .length)
// logLength(123);  // ERROR! Numbers don't have .length
```

### Inheritance `extends` vs Generic Constraint `extends`

This is a massive point of confusion.

| Context | Example | What it means |
|---------|---------|---------------|
| **Class Inheritance** | `class Dog extends Animal` | `Dog` inherits all properties/methods from `Animal` and adds more. |
| **Generic Constraint** | `<T extends Animal>` | Whatever type `T` ends up being, it *must possess* the shape of an `Animal`. It acts as a strict filter/requirement. |

---

## 5. Async Functions and Promises

Typing asynchronous code is straightforward in TypeScript. 

### How it works
Any `async` function always returns a `Promise`. You type the function by specifying what data type the Promise will eventually resolve to using the generic `Promise<T>` syntax.

```typescript
interface User { id: number; name: string; }

// The function returns a Promise that will eventually contain a User object
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); 
}
```
- **Mental Model:** A `Promise<T>` is a **delivery box**. The box arrives immediately, but you don't know what's inside. The `<T>` is the label on the box telling you what you will find when you finally open it (using `.then()` or `await`).

---

## Interview Perspective

**Q: How do optional parameters work in TypeScript?**
By appending a `?` to the parameter name (e.g., `age?: number`), making the type implicitly `number | undefined`. Optional parameters must always appear after required parameters.

**Q: Difference between function overloads and union types?**
Union types are used when the function logic and return type are simple and don't change drastically based on the input. Function overloads are used when the return type is strictly dependent on the specific variation of inputs provided, acting like different "signatures" for the same function.

**Q: What problem do generics solve?**
They solve the problem of writing highly reusable code without sacrificing type safety (which happens if you resort to using `any`).

**Q: How do generics work in TypeScript?**
They act as variables for Types. You pass a type argument (like `<T>`) into a function, interface, or class, and TypeScript applies that specific type throughout the internal logic.

**Q: Difference between `extends` in inheritance vs generic constraint?**
In Class/Interface inheritance, `extends` means "copy the parent's blueprint and add more to it." In a Generic constraint (`<T extends SomeType>`), it means "whatever type `T` is, it is strictly required to match the shape of `SomeType`."

**Q: How does TypeScript handle async functions and Promises?**
TypeScript uses the built-in `Promise<T>` generic type. Since async functions always wrap their return values in a Promise, you annotate the return type as `Promise<TheResolvedDataType>`.

---

## Key Takeaways

- Optional parameters (`?`) must come last.
- Prefer Union types for simple variations, use Overloads for complex input/output dependencies.
- Generics (`<T>`) are type-variables that act as blueprints for reusable code.
- `Promise<T>` is how you strictly type the payload of an asynchronous operation.
