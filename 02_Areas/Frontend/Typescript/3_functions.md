# Functions

## Function Type Annotations

### Parameter & Return Types

```ts
// Function declaration
function add(n: number, m: number): number {
    return n + m;
}

// Arrow function
const multiply = (n: number, m: number): number => {
    return n * m;
};
```

### Void Return

Function that performs an action but does not return a meaningful value:

```ts
function log(msg: string): void {
    console.log(msg);
}
```

> A `void` function technically returns `undefined`. The `void` type tells TS (and developers) that the return value should **not be used**.

### Never Return

Used when a function **never** completes execution — either throws or loops infinitely:

```ts
// Throws — never reaches end
const throwError = (msg: string): never => {
    throw new Error(msg);
};

// Infinite loop — never returns
const infiniteLoop = (): never => {
    while (true) {}
};
```

> Returning an `Error` object is not `never` — it's `Error`. `never` means execution **never** reaches the function's end.
>
> ```ts
> const getError = (): Error => {
>     return new Error("something went wrong"); // return type is Error, not never
> };
> ```

### `void` vs `never` vs `undefined`

| Type | Meaning | Example |
| --- | --- | --- |
| `void` | Returns nothing meaningful (implicitly `undefined`) | `console.log()` |
| `never` | Execution never completes | `throw`, infinite loop |
| `undefined` | Explicitly returns `undefined` | `return undefined;` |

### Function Type Aliases

```ts
type MathFunc = (n: number, m: number) => number;

const add: MathFunc = (n, m) => n + m;
const subtract: MathFunc = (n, m) => n - m;
```

### With `function` Keyword

Function declarations cannot directly use type aliases — must annotate inline or store in a variable:

```ts
// Inline annotation
function greet(name: string): string {
    return `Hello ${name}`;
}

// Type alias requires function expression (stored in variable)
type GreetFunc = (name: string) => string;
const greet2: GreetFunc = function (name) {
    return `Hello ${name}`;
};
```

## Optional Parameters

Use `?` to mark parameters as optional. Optional parameters must come **after** required ones:

```ts
type CalcFunc = (a: number, b: number, c?: number) => number;

const calc: CalcFunc = (a, b, c) => {
    if (c === undefined) return a * b;
    return a * b * c;
};

calc(10, 20);     // 200
calc(10, 20, 30); // 6000
```

## Default Parameters

Default parameters are implicitly optional — callers can omit them:

```ts
function greet(name: string, greeting: string = "Hello"): string {
    return `${greeting}, ${name}`;
}

greet("John");           // "Hello, John"
greet("John", "Hi");     // "Hi, John"
```

> **Optional vs Default:** Use `?` when there's no sensible default value. Use default parameters when there is.

## Rest Parameters

Collects remaining arguments into a typed array:

```ts
type SumFunc = (...nums: number[]) => number;

const sum: SumFunc = (...nums) => {
    return nums.reduce((acc, n) => acc + n, 0);
};

sum(10, 20, 30, 40); // 100
```

## Function Overloads

Define multiple call signatures for a function when the **return type depends on the input type**. Only the overload signatures are visible to callers.

```ts
function format(val: string): string;
function format(val: number): string;
function format(val: string | number): string {
    if (typeof val === "string") return val.trim();
    return val.toFixed(2);
}

format("  hello  "); // "hello"
format(3.14159);      // "3.14"
```

**How resolution works:** TS matches overloads **top to bottom** — it uses the first signature that matches the call. Order matters.

> The implementation signature (line 3) is **not** directly callable — only the overload signatures above it are visible.

### When to Use Overloads vs Unions

| Approach | When |
| --- | --- |
| **Union params** | Return type is the **same** regardless of input type |
| **Overloads** | Return type **varies** based on which input type is passed |

## Callback Type Annotations

```ts
function fetchData(url: string, callback: (data: string) => void): void {
    // ... fetch logic
    callback("response data");
}

fetchData("/api", (data) => {
    console.log(data); // data is inferred as string
});
```

## `this` Parameter

Explicitly type `this` in regular functions. This is a TS-only feature — the `this` parameter is erased during compilation.

```ts
interface User {
    name: string;
    greet(this: User): string;
}

const user: User = {
    name: "John",
    greet() {
        return `Hi, ${this.name}`;
    }
};

user.greet();       // OK
// const fn = user.greet;
// fn();            // Error — 'this' context is not of type 'User'
```

> Arrow functions **cannot** have a `this` parameter — they capture `this` lexically from the enclosing scope.

## Async Function Return Types

Async functions always return a `Promise`. Annotate the inner type:

```ts
async function fetchUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
}

// Type alias for async functions
type AsyncFetcher<T> = (id: string) => Promise<T>;
```

---

## TODO: Topics to Study

- [ ] Constructor signatures
- [ ] `Parameters<T>` and `ReturnType<T>` utility types with functions
