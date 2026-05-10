# Generics

## Core Idea

> Generics let you write **one** piece of code that works with **any** type while preserving exact type information at every step.

## Problem It Solves

When building reusable functions, classes, or interfaces you face a choice:

1. **Hardcode the type** — safe but not reusable.
2. **Use `any`** — reusable but you lose all type information.

Generics give you **both** — reusability and type safety.

## Mental Model

Think of generics as **blanks on a form**.

A form template has blank fields `____`. The template doesn't know what will be filled in — it just knows *where* blanks exist and that whatever goes in blank A must also come out wherever A is referenced.

```
Template:  input: __A__  →  output: __A__
Fill A=string:  input: string  →  output: string
Fill A=number:  input: number  →  output: number
```

When you write `<T>`, you're creating a blank called `T`. When someone calls the function, TS fills in `T` with the actual type — and enforces it consistently everywhere `T` appears.

---

## Generic Functions

### The Problem — `any` Destroys Type Information

```ts
const identity = (val: any): any => {
    return val;
};

let a = identity("Hello"); // type: any — TS lost that this was a string
let b = identity(42);      // type: any — TS lost that this was a number
a.toUpperCase();            // no error, no autocomplete — TS doesn't know it's a string
```

TS can't help you anymore. The return type is `any` regardless of what you pass in.

### The Solution — Type Parameters

```ts
const identity = <T>(val: T): T => {
    return val;
};

let a = identity("Hello"); // type: string — TS inferred T = string
let b = identity(42);      // type: number — TS inferred T = number
a.toUpperCase();            // TS knows it's string — autocomplete works
```

**What happened step by step:**

1. `<T>` declares a type parameter — a placeholder for a type.
2. `val: T` means the parameter uses whatever type `T` is.
3. `: T` (return type) means the return type matches the input type.
4. When called with `"Hello"`, TS infers `T = string` and substitutes everywhere.

> Generics are **compile-time only**. After compilation, all generic annotations are erased — the JS output has no trace of `<T>`. This is just like how all TS types are erased.

### Type Inference vs Explicit Type Arguments

TS infers the generic type from the arguments you pass:

```ts
// Inferred — TS figures out T from the argument
let a = identity("Hello");         // T inferred as string
let b = identity(42);              // T inferred as number

// Explicit — you manually specify T
let c = identity<string>("Hello"); // T explicitly set to string
let d = identity<number>(42);      // T explicitly set to number
```

**When to be explicit:**

| Scenario                | Why                                                    |
| ----------------------- | ------------------------------------------------------ |
| Empty arrays            | `useState<User[]>([])` — TS would infer `never[]`      |
| Null initial values     | `useState<User\                                        |
| API responses           | `fetchApi<User>(url)` — TS can't infer from URL string |
| Stricter than inference | When inference gives a broader type than you want      |

> Generics are not limited with parameters only, with explicit inference they can be used to define return type or define type inside the functions. Like how it used for API responses.

### Multiple Type Parameters

When inputs have different types, use multiple parameters:

```ts
const pair = <T, U>(first: T, second: U): [T, U] => {
    return [first, second];
};

pair("hello", 42);    // type: [string, number]
pair(true, [1, 2]);   // type: [boolean, number[]]
```

Each parameter gets its own independent type — `T` and `U` are filled separately.

---

## Generic Constraints

### The Problem — Too Permissive

Without constraints, `T` can be **anything** — you can't safely access any properties:

```ts
const logLength = <T>(val: T): void => {
    console.log(val.length); // Error — T might not have .length
};
```

TS is correct — if someone calls `logLength(42)`, numbers don't have `.length`.

### The Solution — `extends`

Use `extends` to restrict what types `T` can be:

```ts
const logLength = <T extends { length: number }>(val: T): void => {
    console.log(val.length); // OK — T is guaranteed to have .length
};

logLength("Hello");    // OK — string has .length
logLength([1, 2, 3]);  // OK — array has .length
// logLength(42);      // Error — number has no .length
```

**How to read this:** "`T` can be any type, **as long as** it has a `length` property of type `number`."

### Constraining to an Interface

```ts
interface HasId {
    id: string;
}

const logId = <T extends HasId>(item: T): void => {
    console.log(item.id); // safe — T must have id
};

logId({ id: "abc", name: "John" }); // OK — has id + extra properties
// logId({ name: "John" });         // Error — missing id
```

### Constraining One Type to Another

Ensure one type parameter is a subtype of another:

```ts
const assign = <T extends object, U extends T>(target: T, source: U): U => {
    return { ...target, ...source };
};

assign(
    { name: "John" },
    { name: "Jane", age: 25 }  // OK — U has all of T's properties + more
);
```

`U extends T` means: U must have **at least** everything T has.

---

## `keyof` with Generics

### The Problem — Dynamic Property Access

Accessing an object property with a dynamic key is unsafe:

```ts
function getValue(obj: any, key: string) {
    return obj[key]; // return type: any — TS knows nothing
}
```

### The Solution — Indexed Access Types

Combine `keyof` with generics for fully type-safe property access:

```ts
const getProperty = <T, K extends keyof T>(obj: T, key: K): T[K] => {
    return obj[key];
};

const user = { name: "John", age: 25, active: true };

getProperty(user, "name");   // return type: string
getProperty(user, "age");    // return type: number
getProperty(user, "active"); // return type: boolean
// getProperty(user, "email"); // Error — "email" is not a key of user
```

**Breaking it down:**

| Part                | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `T`                 | Inferred from the object passed — captures its full type |
| `K extends keyof T` | K must be one of T's property names                      |
| `T[K]`              | The type of property K in T — **indexed access type**    |

**Why `T[K]` is powerful:** When you pass `"name"`, TS resolves `T[K]` to `string`. When you pass `"age"`, it resolves to `number`. The return type **changes** based on which key you pass — this is impossible without generics.

> Here, `extends` work as putting constraint not as [extending interfaces](2_type-system-deep-dive.md#extending-interfaces) or [conditional type](2_type-system-deep-dive.md#conditional-types)

### Real-World Example — Type-Safe Object Filter

```ts
type User = {
    name: string;
    age: number;
    role: "admin" | "user";
};

const users: User[] = [
    { name: "John", age: 29, role: "admin" },
    { name: "Peter", age: 32, role: "user" },
    { name: "Mark", age: 57, role: "admin" }
];

const filterBy = <T, K extends keyof T>(
    items: T[],
    key: K,
    value: T[K]     // value type is locked to the type of property K
): T[] => {
    return items.filter(item => item[key] === value);
};

filterBy(users, "role", "admin");   // OK — "admin" matches type of role
filterBy(users, "name", "Mark");    // OK — "Mark" matches type of name
// filterBy(users, "name", 42);     // Error — 42 is not string
// filterBy(users, "email", "x");   // Error — "email" is not a key of User
```

Three layers of protection:

1. `key` must be a valid property name of T
2. `value` must match the type of that property
3. Return type `T[]` preserves the original array element type

---

## Generic Interfaces

Define interfaces that work with any type while maintaining internal consistency:

```ts
interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

// T = User — data must be User
const userRes: ApiResponse<User> = {
    data: { name: "John", age: 25 },
    status: 200,
    message: "OK"
};
userRes.data.name; // type: string — fully typed

// T = string[] — data must be string array
const tagRes: ApiResponse<string[]> = {
    data: ["ts", "react"],
    status: 200,
    message: "OK"
};
```

> **Why not just use `any`?** With `ApiResponse<any>`, `data` would be `any` — you'd lose autocomplete and type checking on every property access.

### Extending Generic Interfaces

```ts
interface PaginatedResponse<T> extends ApiResponse<T> {
    page: number;
    totalPages: number;
    hasNext: boolean;
}

// Inherits data: T, status, message + adds pagination
const result: PaginatedResponse<User> = {
    data: { name: "John", age: 25 },
    status: 200,
    message: "OK",
    page: 1,
    totalPages: 10,
    hasNext: true
};
```

---

## Generic Classes

Classes where the type of stored/processed data is determined at instantiation:

```ts
class DataStore<T> {
    private items: T[] = [];

    add(item: T): void {
        this.items.push(item);
    }

    get(index: number): T {
        return this.items[index];
    }

    getAll(): T[] {
        return [...this.items]; // return copy to prevent external mutation
    }
}

const strings = new DataStore<string>();
strings.add("Hello");
strings.add("World");
// strings.add(42);  // Error — 42 is not string

const numbers = new DataStore<number>();
numbers.add(42);
numbers.get(0);      // type: number — not any
```

### Generic Class with Constraints

```ts
interface Entity {
    id: string;
}

class Repository<T extends Entity> {
    private items = new Map<string, T>();

    save(item: T): void {
        this.items.set(item.id, item); // safe — T guaranteed to have id
    }

    findById(id: string): T | undefined {
        return this.items.get(id);
    }

    findAll(): T[] {
        return Array.from(this.items.values());
    }
}

interface User extends Entity { name: string; age: number; }

const userRepo = new Repository<User>();
userRepo.save({ id: "1", name: "John", age: 25 });
// userRepo.save({ name: "John" }); // Error — missing id
```

---

## Default Type Parameters

Provide a fallback type when the caller doesn't specify one:

```ts
interface Container<T = string> {
    value: T;
    label: string;
}

// Uses default — T is string
const a: Container = { value: "hello", label: "greeting" };

// Override default — T is number
const b: Container<number> = { value: 42, label: "count" };
```

> **Best practice:** Use `unknown` instead of `any` as the default — it forces callers to narrow before use, maintaining type safety.

---

## Building Custom Utility Types

Generics are the foundation of all utility types. Understanding how to build them gives you deep control over the type system.

### Building `Partial<T>`

```ts
type MyPartial<T> = {
    [K in keyof T]?: T[K];
};
// Takes each key K of T, makes it optional (?), keeps the same value type T[K]
```

### Building `Pick<T, K>`

```ts
type MyPick<T, K extends keyof T> = {
    [P in K]: T[P];
};

type User = { id: string; name: string; age: number; email: string };
type Preview = MyPick<User, "id" | "name">;
// { id: string; name: string; }
```

### Building `Readonly<T>`

```ts
type MyReadonly<T> = {
    readonly [K in keyof T]: T[K];
};
```

> These all use **mapped types** — `[K in keyof T]` iterates over each key. This is the generic pattern behind most utility types. [See mapped types](./2_type-system-deep-dive.md#mapped-types)

---

## Generic Conventions

| Symbol | Convention          | Example                      |
| ------ | ------------------- | ---------------------------- |
| `T`    | Primary type        | `Array<T>`, `Promise<T>`     |
| `K`    | Key / Property name | `Record<K, V>`, `Pick<T, K>` |
| `V`    | Value type          | `Map<K, V>`, `Record<K, V>`  |
| `E`    | Element type        | `Iterable<E>`                |
| `R`    | Return type         | `ReturnType<R>`              |

Use meaningful names for complex generics with multiple parameters:

```ts
// Single parameter — T is fine
function identity<T>(val: T): T { return val; }

// Multiple parameters — descriptive names help readability
function transform<TInput, TOutput>(
    input: TInput,
    fn: (val: TInput) => TOutput
): TOutput {
    return fn(input);
}
```

---

## Common Mistakes

### 1. Unnecessary Generics

```ts
// Bad — generic adds nothing, T is always string
function greet<T extends string>(name: T): string {
    return `Hello ${name}`;
}

// Good — just use string directly
function greet(name: string): string {
    return `Hello ${name}`;
}
```

**Rule:** If a type parameter appears only **once** in the signature, you probably don't need it. Generics are useful when they **connect** the types of multiple things (input to output, parameter to parameter).

### 2. Over-Constraining

```ts
// Overly specific — forces exact shape, defeats purpose of generic
function getFirst<T extends { items: string[] }>(obj: T): string {
    return obj.items[0];
}

// Better — works with any array type
function getFirst<T>(items: T[]): T {
    return items[0];
}
```

### 3. Using `any` Instead of Generics

```ts
// Bad — return type is any, caller loses type info
function firstElement(arr: any[]): any {
    return arr[0];
}

// Good — return type matches array element type
function firstElement<T>(arr: T[]): T {
    return arr[0];
}
```

### 4. Missing Constraint When Accessing Properties

```ts
// Error — T might not have .name
function getName<T>(obj: T): string {
    return obj.name; // Property 'name' does not exist on type 'T'
}

// Fix — constrain T
function getName<T extends { name: string }>(obj: T): string {
    return obj.name;
}
```

---

## Trade-offs

| Benefit                            | Cost                                    |
| ---------------------------------- | --------------------------------------- |
| Reusable across types              | Increased complexity in type signatures |
| Full type safety preserved         | Harder to read for junior developers    |
| Better autocomplete / intellisense | Constraint errors can be confusing      |
| Catches bugs at compile time       | Over-engineering risk for simple cases  |

**When NOT to use generics:**

- Function only works with one type → use that type directly
- Type parameter appears only once → it's not connecting anything
- Simple utility that doesn't need type preservation → use concrete types
- Adding generics makes the code significantly harder to understand for minimal benefit

---

## Interview Perspective

**Commonly asked:**

- What are generics and why do we need them?
- What is the difference between `any` and a generic type parameter?
- How do generic constraints work?
- What does `keyof` do with generics?
- How would you build `Partial<T>` or `Pick<T, K>` from scratch?

**Key points to articulate:**

- Generics are **type-level parameters** — they allow code to be reusable while maintaining exact type information
- Unlike `any`, generics **preserve** the relationship between input and output types
- Constraints (`extends`) limit what types are accepted while still keeping the generic flexible
- `T[K]` is an **indexed access type** — it resolves to the type of property K in T
- All generic information is **erased at compile time** — zero runtime cost

**Tricky follow-up: "Are generics a runtime feature?"**

No. Generics are purely compile-time. After TS compiles to JS, all `<T>` annotations are removed. The JS engine never sees generics — they exist only for type checking and developer tooling.

---

## Key Takeaways

- Generics = type parameters = blanks that get filled with real types at usage
- `<T>` declares a type variable. `extends` constrains it. `T[K]` accesses a property type.
- TS infers generic types from arguments — be explicit only when inference fails
- If a type parameter appears once, you probably don't need a generic
- Generics are the building blocks of utility types (`Partial`, `Pick`, `Record`, etc.)
- Zero runtime overhead — all generics are erased during compilation

---

## TODO: Topics to Study

- [ ] Variance — covariance and contravariance
- [ ] Generic function overloads
- [ ] Recursive generics
- [ ] Conditional types with generics (`T extends U ? X : Y`)