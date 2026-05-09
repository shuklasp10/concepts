# Generics

## What are Generics

> Generics allow writing reusable, type-safe code that works with **any** data type while preserving type information. Think of them as **type parameters** — similar to function parameters, but for types.

### The Problem

Using `any` loses type safety — the return type becomes `any` and you lose autocomplete:

```ts
const identity = (val: any): any => {
    return val;
};
let a = identity("Hello"); // type: any — lost string info
let b = identity(42);      // type: any — lost number info
```

### The Solution

Generics capture and preserve the actual type:

```ts
const identity = <T>(val: T): T => {
    return val;
};
let a = identity("Hello"); // type: string (inferred from argument)
let b = identity(42);      // type: number (inferred from argument)
```

### Explicit Type Argument

TS infers the generic type from the argument, but you can specify it explicitly:

```ts
let a = identity<string>("Hello"); // explicit — type: string
let b = identity<number>(42);      // explicit — type: number
```

> **When to be explicit:** When TS cannot infer the type (e.g., empty arrays, `null` initial values) or when you want stricter typing than what TS infers.

## Generic Constraints (`extends`)

Restrict what types a generic can accept using `extends`:

```ts
// T must have a length property
const logLength = <T extends { length: number }>(val: T): void => {
    console.log(val.length);
};

logLength("Hello");    // 5 — string has length
logLength([1, 2, 3]);  // 3 — array has length
// logLength(42);      // Error — number has no length property
```

## Multiple Type Parameters

```ts
const pair = <T, U>(first: T, second: U): [T, U] => {
    return [first, second];
};

const result = pair("hello", 42); // type: [string, number]
```

### Constraining One Type to Another

Ensure one generic type is a subtype of another:

```ts
// U must have at least all properties of T
const merge = <T extends object, U extends T>(base: T, override: U): U => {
    return { ...base, ...override };
};

merge(
    { name: "John" },
    { name: "Jane", age: 25 }  // OK — has all properties of T + more
);
```

## `keyof` with Generics

Type-safe dynamic property access:

```ts
const getProperty = <T, K extends keyof T>(obj: T, key: K): T[K] => {
    return obj[key];
};

const user = { name: "John", age: 25 };
getProperty(user, "name"); // return type: string
getProperty(user, "age");  // return type: number
// getProperty(user, "email"); // Error — "email" not a key of user
```

> **Why this matters:** The return type `T[K]` is **specific** — when you pass `"name"`, TS knows the return is `string`, not `string | number`.

## Complex Example

Filter array of objects by any key-value pair with full type safety:

```ts
type User = {
    name: string;
    age: number;
};

const users: User[] = [
    { name: "John", age: 29 },
    { name: "Peter", age: 32 },
    { name: "Mark", age: 57 },
    { name: "Chris", age: 43 }
];

const filterBy = <T, K extends keyof T>(
    items: T[],
    key: K,
    value: T[K]  // value type must match the property type at key K
): T[] => {
    return items.filter(item => item[key] === value);
};

const result = filterBy(users, "name", "Mark");     // OK
// filterBy(users, "name", 42);     // Error — 42 is not string (type of "name")
// filterBy(users, "address", "x"); // Error — "address" not a key of User
```

## Generic Interfaces

```ts
interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

const userResponse: ApiResponse<User> = {
    data: { name: "John", age: 25 },
    status: 200,
    message: "OK"
};

// T is locked — data must match the specified type
// userResponse.data.email; // Error — email not in User
```

## Generic Classes

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
        return [...this.items];
    }
}

const stringStore = new DataStore<string>();
stringStore.add("Hello");
// stringStore.add(42); // Error — number is not string

const numberStore = new DataStore<number>();
numberStore.add(42);
```

## Default Generic Types

Provide a fallback type when the generic is not explicitly specified:

```ts
interface PaginatedResponse<T = unknown> {
    data: T[];
    page: number;
    totalPages: number;
}

// Uses default (unknown)
const response1: PaginatedResponse = {
    data: [1, "two"],
    page: 1,
    totalPages: 5
};

// Explicit type
const response2: PaginatedResponse<User> = {
    data: [{ name: "John", age: 25 }],
    page: 1,
    totalPages: 1
};
```

> **Prefer `unknown` over `any`** as the default generic type — it maintains type safety by requiring narrowing before use.

## Common Generic Conventions

| Symbol | Convention |
| --- | --- |
| `T` | General type (Type) |
| `K` | Key type |
| `V` | Value type |
| `E` | Element type |
| `R` | Return type |

---

## TODO: Topics to Study

- [ ] Generic utility type implementation (building your own `Partial`, `Pick`, etc.)
- [ ] Variance — covariance and contravariance
- [ ] Generic function overloads
- [ ] Recursive generics
