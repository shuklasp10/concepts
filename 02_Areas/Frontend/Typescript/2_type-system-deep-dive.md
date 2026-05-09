# Type System Deep Dive

## Interfaces

> Interfaces define the shape/contract of an object. They are **open** — can be extended and merged.

### Basic Interface

```ts
interface User {
    name: string;
    age: number;
    email?: string;        // optional
    readonly id: string;   // cannot be reassigned after creation
}

const user: User = {
    id: "abc123",
    name: "John",
    age: 25
};
// user.id = "xyz"; // Error — readonly
```

### Extending Interfaces

```ts
interface Person {
    name: string;
    age: number;
}

interface Employee extends Person {
    company: string;
    role: string;
}

const emp: Employee = {
    name: "John",
    age: 30,
    company: "Google",
    role: "Engineer"
};
```

### Multiple Interface Extension

```ts
interface HasId {
    id: string;
}

interface HasTimestamp {
    createdAt: Date;
    updatedAt: Date;
}

interface Post extends HasId, HasTimestamp {
    title: string;
    body: string;
}
```

### Declaration Merging

Interfaces with the same name automatically merge — useful for extending third-party types:

```ts
interface Window {
    myCustomProp: string;
}
// Now window.myCustomProp is valid TS
```

> `type` aliases cannot be merged. This is the key advantage of interfaces for library authors.

### Index Signatures

Define objects with dynamic keys:

```ts
interface StringMap {
    [key: string]: string;
}

const headers: StringMap = {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
};

// Mixed — known keys + dynamic keys
interface Config {
    name: string;
    version: number;
    [key: string]: unknown;  // additional unknown keys allowed
}
```

## Type Assertion

> Type assertion tells the compiler to treat a value as a specific type. It does **NOT** perform any runtime type conversion or validation.

Two syntaxes:

```ts
// Angle bracket syntax (cannot use in JSX/TSX files)
const val1 = <string>"Hello";

// as syntax (preferred — works everywhere including JSX)
const val2 = "Hello" as string;
```

### DOM Manipulation

By default, DOM queries return `HTMLElement | null`:

```ts
// Method 1: as keyword (preferred)
const btn = document.getElementById("btn") as HTMLElement;

// Method 2: angle bracket (not usable in .tsx files)
const btn2 = <HTMLElement>document.getElementById("btn");

// Method 3: non-null assertion (!)
const btn3 = document.getElementById("btn")!;

// Specific element types for element-specific properties
const img = document.querySelector("img") as HTMLImageElement;
img.src = "photo.jpg"; // .src only exists on HTMLImageElement, not HTMLElement
```

> **Caution:** Non-null assertion (`!`) suppresses null checks — only use when you are **certain** the element exists. It provides no runtime safety.

### Common DOM Element Types

| Element | Type |
| --- | --- |
| `<input>` | `HTMLInputElement` |
| `<img>` | `HTMLImageElement` |
| `<a>` | `HTMLAnchorElement` |
| `<canvas>` | `HTMLCanvasElement` |
| `<form>` | `HTMLFormElement` |
| `<select>` | `HTMLSelectElement` |
| `<video>` | `HTMLVideoElement` |

## Type Operators

### `keyof`

Creates a union type of all property names (keys) of a type:

```ts
type Person = {
    name: string;
    age: number;
};

type PersonKeys = keyof Person; // "name" | "age"
```

**Dynamic object access:**

```ts
const person: Person = { name: "John", age: 26 };

let key: string = "name";
// person[key];                        // Error — string is too broad
person[key as keyof Person];           // OK — narrowed to "name" | "age"
person[key as keyof typeof person];    // OK — when type alias isn't available
```

**With functions:**

```ts
const getValue = (obj: Person, key: keyof Person) => {
    return obj[key];
};

getValue(person, "name"); // OK
// getValue(person, "address"); // Error — "address" not in Person
```

### `typeof` (Type Context)

Extracts the type from a runtime value — only usable in type positions:

```ts
const config = {
    host: "localhost",
    port: 3000
};

type Config = typeof config;
// { host: string; port: number; }
```

> Don't confuse with the runtime `typeof` operator (`typeof x === "string"`). In type positions, `typeof` extracts the TS type from a value.

## Type Narrowing

> Process of refining a broad type to a more specific type within a conditional block. TS uses **control flow analysis** to automatically narrow types.

### `typeof` Guard

```ts
function print(val: string | number) {
    if (typeof val === "string") {
        console.log(val.toUpperCase()); // TS knows val is string here
    } else {
        console.log(val.toFixed(2));    // TS knows val is number here
    }
}
```

### `instanceof` Guard

```ts
function logDate(val: Date | string) {
    if (val instanceof Date) {
        console.log(val.toISOString());
    } else {
        console.log(val); // TS knows val is string
    }
}
```

### `in` Operator Guard

Checks if a property exists in an object:

```ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
    if ("swim" in animal) {
        animal.swim(); // TS knows animal is Fish
    } else {
        animal.fly();  // TS knows animal is Bird
    }
}
```

### Truthiness Narrowing

```ts
function printName(name: string | null | undefined) {
    if (name) {
        console.log(name.toUpperCase()); // TS knows name is string
    }
}
```

### Custom Type Guards

User-defined function that returns `paramName is Type`:

```ts
function isFish(animal: Fish | Bird): animal is Fish {
    return (animal as Fish).swim !== undefined;
}

// Usage
const pet: Fish | Bird = getAnimal();
if (isFish(pet)) {
    pet.swim(); // TS knows pet is Fish
}
```

### Discriminated Unions

Best practice for narrowing complex union types. Each member has a shared **literal** property (the discriminant):

```ts
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.side ** 2;
    }
}
```

> **Why discriminated unions?** Without a common discriminant, TS cannot narrow the type inside `switch` or `if` blocks. The shared literal property (`kind`) acts as a tag for TS to differentiate.

## Advanced Type Features

### Mapped Types

Create new types by transforming each property of an existing type:

```ts
// Make all properties optional
type MyPartial<T> = {
    [K in keyof T]?: T[K];
};

// Make all properties readonly
type MyReadonly<T> = {
    readonly [K in keyof T]: T[K];
};

// Make all properties nullable
type Nullable<T> = {
    [K in keyof T]: T[K] | null;
};
```

> This is how built-in utility types like `Partial<T>` and `Readonly<T>` are implemented internally.

### Conditional Types

Types that resolve based on a condition using `extends`:

```ts
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"
```

### `infer` Keyword

Extracts a type from within a conditional type — like a type-level variable:

```ts
// Extract the return type of a function
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => string;
type Result = MyReturnType<Fn>; // string

// Extract element type from an array
type ElementType<T> = T extends (infer E)[] ? E : never;
type Item = ElementType<string[]>; // string
```

> `infer` can only be used within the `extends` clause of a conditional type.

---

## TODO: Topics to Study

- [ ] Template literal types in depth
- [ ] Recursive types
- [ ] Branded types (nominal typing pattern)
