# Core Fundamentals

## What is TypeScript?

> TypeScript is JavaScript with a compiler. It is a superset of JavaScript that adds static typing.

### Problem It Solves

JavaScript is a dynamically typed language. If you pass a string to a function that expects a number, JavaScript won't complain until the exact moment that code executes in the browser (Runtime). In large codebases, this leads to unpredictable crashes, silent failures, and a terrible developer experience because you never know what shape an object has without reading its original definition.

### The Mental Model

- **JavaScript (Dynamic):** A **cash-only store**. You don't know if the customer actually has enough money until they are standing at the register holding up the line trying to pay.
- **TypeScript (Static):** A **pre-paid card system**. Before the customer is even allowed to enter the store (Compile Time), you verify they have the funds. If they don't, they are blocked at the door.

---

## Compile-Time vs Runtime

This is the most critical distinction to understand in TypeScript.

### Compile-Time (TypeScript)
This is when you are writing the code in your editor. The TypeScript compiler (`tsc`) analyzes your code. If you try to call `.toUpperCase()` on a number, TypeScript yells at you immediately with a red squiggly line. **TypeScript only exists here.**

### Runtime (JavaScript)
This is when the code is actually executing in the browser (or Node.js). Before running, TypeScript code is completely stripped of all its types and converted into pure JavaScript.

> **Crucial Insight:** TypeScript types **cannot** affect how your code runs. A TypeScript interface does not exist in the browser. You cannot write `if (myVar instanceof MyInterface)` because `MyInterface` is erased during compilation.

---

## Type Inference

### Core Idea
You do not need to explicitly write types for everything. TypeScript is smart enough to figure it out by itself.

```typescript
// Explicit (unnecessary)
let message: string = "Hello World";

// Inferred (preferred)
let message = "Hello World"; 
// TypeScript automatically knows `message` is a string.
```

### Mental Model
Think of Type Inference as a **Detective**. If it sees you assign a number to a variable, it deduces that the variable is meant to hold numbers forever. You only need to explicitly write types when the Detective doesn't have enough clues (e.g., when a variable is initialized without a value, or an API response comes back).

---

## The Special Types: `any`, `unknown`, and `never`

When building types, you sometimes need to represent abstract concepts.

### `any`
- **What it is:** Disables type checking completely for that variable.
- **Mental Model:** A **VIP pass**. The bouncer (TypeScript) looks the other way and lets you do whatever you want.
- **Rule:** Avoid at all costs. It defeats the entire purpose of TypeScript.

### `unknown`
- **What it is:** A safer version of `any`. It means "I don't know what this is right now."
- **Mental Model:** A **locked box**. You can hold the box, but you are not allowed to use what's inside until you prove to TypeScript what it is (using Type Guards like `typeof`).
```typescript
let data: unknown = "hello";
// data.toUpperCase(); // ERROR! TypeScript won't let you.

if (typeof data === "string") {
  data.toUpperCase(); // Allowed! We proved it's a string.
}
```

### `never`
- **What it is:** Represents a state that should *never* happen.
- **Mental Model:** A **black hole**. Code execution cannot successfully return from a `never` type.
- **Usage:** Used for functions that always throw an error, or functions that have infinite `while(true)` loops.

---

## `null` vs `undefined`

In JavaScript and TypeScript, both represent the absence of a value, but they have distinct semantic meanings.

| Aspect | `undefined` | `null` |
|--------|------------|--------|
| Meaning | "The variable was created, but no value has been assigned yet." | "This variable intentionally has no value right now." |
| Analogy | An unassigned empty parking space. | A parking space that was explicitly blocked off with a traffic cone. |
| Typeof | `typeof undefined === "undefined"` | `typeof null === "object"` (a historical JS bug) |

---

## Interview Perspective

**Q: What is TypeScript and why would you use it over JavaScript?**
TypeScript is a strongly typed superset of JavaScript. We use it over JS to catch type-related errors at compile-time rather than runtime, which dramatically improves code reliability, refactoring safety, and developer experience through robust autocomplete.

**Q: What are the advantages of TypeScript?**
1. Early bug detection (Compile-time checking).
2. Better IDE support (Intellisense).
3. Easier and safer refactoring.
4. Serves as living documentation for your code.

**Q: Difference between compile-time and runtime in TypeScript?**
Compile-time is when TypeScript analyzes the code and strips away types to generate standard JavaScript. Runtime is when the browser executes that generated JavaScript. Type errors are caught at compile-time; they do not exist at runtime.

**Q: What is type inference in TypeScript?**
The ability of the TypeScript compiler to automatically deduce the type of a variable based on its assigned value, eliminating the need for explicit type annotations everywhere.

**Q: Difference between `any`, `unknown`, and `never`?**
- `any`: Disables type checking. You can do anything with it (Unsafe).
- `unknown`: You don't know the type yet. You must check its type (via `typeof`) before you can interact with it (Safe).
- `never`: Represents a value that will never occur (e.g., a function that throws an error or loops infinitely).

**Q: Difference between `null` and `undefined` in TypeScript?**
`undefined` means a variable has been declared but not assigned a value. `null` is an intentional, explicit assignment representing "no value".

---

## Key Takeaways

- TypeScript only exists during development (Compile Time). It vanishes in the browser (Runtime).
- Rely on Type Inference; don't over-annotate basic variables.
- Use `unknown` instead of `any` when handling unpredictable data (like API responses).
- Understand that TypeScript cannot prevent runtime errors caused by external data that doesn't match your defined types.
