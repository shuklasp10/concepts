# Utility Types

> Built-in generic types that transform existing types. These are the most commonly used utility types in TypeScript.

## Property Modifiers

### `Partial<T>`

Makes **all** properties optional:

```ts
type User = {
    name: string;
    age: number;
    email: string;
};

type PartialUser = Partial<User>;
// { name?: string; age?: number; email?: string; }

// Common use case: update function that accepts partial data
function updateUser(id: string, updates: Partial<User>): void {
    // only update provided fields
}

updateUser("123", { name: "John" }); // OK — only updating name
```

### `Required<T>`

Makes **all** properties required — opposite of `Partial`:

```ts
type Config = {
    host?: string;
    port?: number;
    debug?: boolean;
};

type FullConfig = Required<Config>;
// { host: string; port: number; debug: boolean; }
```

### `Readonly<T>`

Makes **all** properties `readonly`:

```ts
type User = {
    name: string;
    age: number;
};

type ReadonlyUser = Readonly<User>;
// { readonly name: string; readonly age: number; }

const user: ReadonlyUser = { name: "John", age: 25 };
// user.name = "Jane"; // Error — readonly
```

> `Readonly<T>` is **shallow** — nested objects are still mutable. For deep readonly, use libraries or recursive types.

## Key-Based Types

### `Record<K, T>`

Creates an object type with keys of type `K` and values of type `T`:

```ts
interface UserInfo {
    age: number;
    email: string;
}

type UserName = "John" | "David" | "Peter";

const users: Record<UserName, UserInfo> = {
    John: { age: 26, email: "john@mail.com" },
    David: { age: 29, email: "david@mail.com" },
    Peter: { age: 32, email: "peter@mail.com" }
};
```

Common use — dictionary/map patterns:

```ts
const cache: Record<string, unknown> = {};
```

### `Pick<T, K>`

Creates a type with **only** the specified properties from `T`:

```ts
type User = {
    id: string;
    name: string;
    age: number;
    email: string;
};

type UserPreview = Pick<User, "id" | "name">;
// { id: string; name: string; }
```

### `Omit<T, K>`

Creates a type with all properties from `T` **except** the specified ones:

```ts
type UserWithoutEmail = Omit<User, "email">;
// { id: string; name: string; age: number; }

// Omit multiple properties
type UserBasic = Omit<User, "email" | "age">;
// { id: string; name: string; }
```

> **`Pick` vs `Omit`:** Use `Pick` when you need a few properties from a large type. Use `Omit` when you need most properties but want to exclude a few.

## Union Type Utilities

### `Exclude<T, U>`

Removes types from a union that are assignable to `U`:

```ts
type Status = "active" | "inactive" | "pending" | "deleted";
type ActiveStatus = Exclude<Status, "deleted" | "inactive">;
// "active" | "pending"
```

### `Extract<T, U>`

Keeps only types from a union that are assignable to `U`:

```ts
type Mixed = string | number | boolean;
type OnlyNumOrBool = Extract<Mixed, number | boolean>;
// number | boolean
```

### `NonNullable<T>`

Removes `null` and `undefined` from a type:

```ts
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// string
```

> **`Exclude` vs `Extract`:** `Exclude` removes matching types (blacklist). `Extract` keeps matching types (whitelist).

## Function Type Utilities

### `ReturnType<T>`

Extracts the return type of a function type:

```ts
function getUser() {
    return { name: "John", age: 25 };
}

type UserReturn = ReturnType<typeof getUser>;
// { name: string; age: number; }
```

> Use `typeof` to get the type of a value-level function before passing to `ReturnType`.

### `Parameters<T>`

Extracts function parameter types as a tuple:

```ts
function createUser(name: string, age: number): void {}

type Params = Parameters<typeof createUser>;
// [name: string, age: number]
```

### `ConstructorParameters<T>`

Extracts constructor parameter types:

```ts
class User {
    constructor(public name: string, public age: number) {}
}

type UserCtorParams = ConstructorParameters<typeof User>;
// [name: string, age: number]
```

### `InstanceType<T>`

Extracts the instance type from a class constructor:

```ts
type UserInstance = InstanceType<typeof User>;
// User
```

> Useful when you have a class reference (`typeof User`) and need the instance type.

## String Utilities

Intrinsic string manipulation types:

```ts
type Upper = Uppercase<"hello">;       // "HELLO"
type Lower = Lowercase<"HELLO">;       // "hello"
type Cap = Capitalize<"hello">;        // "Hello"
type Uncap = Uncapitalize<"Hello">;    // "hello"
```

## Quick Reference

| Utility | Input | Result |
| --- | --- | --- |
| `Partial<T>` | All required props | All optional |
| `Required<T>` | Some optional props | All required |
| `Readonly<T>` | Mutable props | All readonly |
| `Record<K, T>` | Key union + value type | Object type |
| `Pick<T, K>` | Type + keys to keep | Subset type |
| `Omit<T, K>` | Type + keys to remove | Subset type |
| `Exclude<T, U>` | Union + types to remove | Filtered union |
| `Extract<T, U>` | Union + types to keep | Filtered union |
| `NonNullable<T>` | Nullable type | Non-null type |
| `ReturnType<T>` | Function type | Return type |
| `Parameters<T>` | Function type | Param tuple |
| `InstanceType<T>` | Class constructor | Instance type |

---

## TODO: Topics to Study

- [ ] `Awaited<T>` for unwrapping Promise types
- [ ] Building custom utility types
- [ ] `ThisParameterType<T>` and `OmitThisParameter<T>`
