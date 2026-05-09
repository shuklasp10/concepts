# Core Fundamentals

## What is TypeScript

> A strongly typed superset of JavaScript that adds static type checking at compile time.

- All valid JavaScript is valid TypeScript.
- Compiles down to plain JavaScript — TS does **not** run in browser or Node directly.
- Provides OOP features not available in JS (interfaces, enums, access modifiers).
- **Auto type inference** — TS can infer types without explicit annotations.

## Installation & Tooling

### Compiler (`tsc`)

Install the TypeScript compiler globally:

```bash
npm i -g typescript
```

Compile a `.ts` file to `.js`:

```bash
tsc index.ts
```

Watch mode — recompile on every change:

```bash
tsc index.ts -w
```

### Compile & Execute (`ts-node`)

Compiles and executes in a single command:

```bash
npm i -g ts-node
ts-node index.ts
```

### Project Setup (`tsconfig.json`)

Initialize TypeScript config:

```bash
tsc --init
```

**Key `tsconfig.json` properties:**

| Property | Purpose |
| --- | --- |
| `rootDir` | Source directory for `.ts` files (`"./src"`) |
| `outDir` | Output directory for compiled `.js` files (`"./dist"`) |
| `target` | JS version to compile to (`"ES2020"`, `"ESNext"`) |
| `module` | Module system (`"commonjs"`, `"ESNext"`) |
| `strict` | Enables all strict type-checking options |
| `esModuleInterop` | Fixes default import interop with CommonJS |
| `resolveJsonModule` | Allows importing `.json` files |
| `declaration` | Generates `.d.ts` declaration files |
| `sourceMap` | Generates `.map` files for debugging |

> By default TS compiles output in the same folder, which can cause scoping issues with `const` redeclarations across files. Always separate `src/` and `dist/` directories.

## Type System Basics

### Implicit vs Explicit Typing

- **Implicit (Inference):** TS automatically infers the type from the assigned value.

    ```ts
    let name = "John";   // inferred as string
    let age = 25;        // inferred as number
    ```

- **Explicit (Annotation):** Developer manually declares the type.

    ```ts
    let name: string = "John";
    let age: number = 25;
    ```

> **Best practice:** Let TS infer types where it can. Use explicit annotations for function parameters, return types, and complex types.

### Primitive Types

```ts
let name: string = "John";
let age: number = 25;
let isActive: boolean = true;
let data: undefined = undefined;
let empty: null = null;
let id: bigint = 100n;
let key: symbol = Symbol("id");
```

### Special Types

| Type | Usage |
| --- | --- |
| `any` | Disables type checking — avoid unless necessary |
| `unknown` | Type-safe alternative to `any` — must narrow before use |
| `void` | Function returns nothing (implicitly returns `undefined`) |
| `never` | Function never returns — throws error or infinite loop |

```ts
// any — no type safety
let val: any = "hello";
val = 42; // no error, no autocomplete

// unknown — must narrow before use
let val2: unknown = "hello";
// val2.toUpperCase(); // Error — cannot use without narrowing
if (typeof val2 === "string") {
    val2.toUpperCase(); // OK after narrowing
}
```

> **`any` vs `unknown`:** Both accept any value, but `unknown` forces you to narrow the type before performing operations. Always prefer `unknown` over `any`.

### Union Types

`|` operator allows a variable to hold one of multiple types:

```ts
let id: string | number;
id = "ABC";  // OK
id = 123;    // OK
// id = true; // Error — boolean not in union
```

### Intersection Types

`&` operator combines multiple types into one — the result must satisfy **all** types:

```ts
type HasName = { name: string };
type HasAge = { age: number };

type Person = HasName & HasAge;
// Person must have both name AND age

const person: Person = { name: "John", age: 25 }; // OK
```

> **Union (`|`)** = value is **one of** the types. **Intersection (`&`)** = value is **all of** the types.

### Literal Types

Restrict values to specific literals instead of broad types:

```ts
type Direction = "up" | "down" | "left" | "right";
let move: Direction = "up";   // OK
// move = "diagonal";          // Error

type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
```

### Type Aliases (`type`)

Custom types using the `type` keyword. Use **PascalCase** for naming.

- **For variables:**

    ```ts
    type Username = string | number;
    let name: Username;
    name = "John";
    name = 23;
    ```

- **For functions:**

    ```ts
    type MathFunc = (n: number, m: number) => number;
    const add: MathFunc = (n, m) => n + m;
    ```

- **For objects:**

    ```ts
    type User = {
        name: string;
        age: number;
        email?: string;   // optional property
    };
    ```

### Type vs Interface — Quick Comparison

| Feature | `type` | `interface` |
| --- | --- | --- |
| Object shapes | ✅ | ✅ |
| Union types | ✅ | ❌ |
| Intersection / Extension | ✅ (`&`) | ✅ (`extends`) |
| Declaration merging | ❌ | ✅ |
| Primitives / Tuples | ✅ | ❌ |
| `implements` in class | ✅ | ✅ |

> **Rule of thumb:** Use `interface` for object shapes and class contracts. Use `type` for unions, intersections, and computed types.

### Array Declaration

```ts
// Method 1: Type[]
let names: string[] = ["John", "Jane"];

// Method 2: Array<Type> (generic syntax)
let ids: Array<string | number> = ["ABC", 123];

// Readonly array — prevents mutation methods (push, pop, etc.)
let nums: readonly number[] = [1, 2, 3];
// nums.push(4); // Error
```

### Tuple Types

Fixed-length arrays with specific types at each position:

```ts
let user: [string, number] = ["John", 25];
// user = [25, "John"]; // Error — wrong order

// Named tuples (for readability)
type HTTPResponse = [status: number, body: string];

// Optional elements
type FlexTuple = [string, number, boolean?];
```

> Tuples are arrays at runtime — TS only enforces types at compile time. `user.push(99)` won't error in TS (known limitation).

### Enum Types

Named constants group:

```ts
// Numeric enum (default starts at 0)
enum Direction {
    Up,      // 0
    Down,    // 1
    Left,    // 2
    Right    // 3
}

// String enum
enum Status {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Pending = "PENDING"
}

let dir: Direction = Direction.Up;
```

> **`const enum`:** Values are inlined at compile time — no runtime object is generated. Use for performance when you don't need reverse mapping.
>
> ```ts
> const enum Color { Red, Green, Blue }
> let c = Color.Red; // compiled to: let c = 0;
> ```

### `as const` Assertion

Makes values deeply `readonly` and narrows types to their literal values:

```ts
// Without as const
const config = { host: "localhost", port: 3000 };
// type: { host: string; port: number; }

// With as const
const config = { host: "localhost", port: 3000 } as const;
// type: { readonly host: "localhost"; readonly port: 3000; }

// Useful with arrays to get tuple types
const roles = ["admin", "user", "guest"] as const;
// type: readonly ["admin", "user", "guest"]
// Without: string[]
```

---

## TODO: Topics to Study

- [ ] Template literal types
- [ ] `satisfies` operator (TS 5.0+)
- [ ] Module system — `import type` / `export type`
