# TypeScript Examples

## Core Fundamentals

### Enum with Switch [See](../1_core-fundamentals.md#enum-types)

```ts
enum Status {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
    Pending = "PENDING"
}

function getStatusMessage(status: Status): string {
    switch (status) {
        case Status.Active:
            return "User is active";
        case Status.Inactive:
            return "User is inactive";
        case Status.Pending:
            return "User is pending approval";
    }
}

console.log(getStatusMessage(Status.Active)); // "User is active"
```

### Discriminated Union [See](../2_type-system-deep-dive.md#discriminated-unions)

```ts
type Success = { status: "success"; data: string };
type ApiError = { status: "error"; message: string };
type Loading = { status: "loading" };
type ApiState = Success | ApiError | Loading;

function render(state: ApiState): string {
    switch (state.status) {
        case "success":
            return `Data: ${state.data}`;
        case "error":
            return `Error: ${state.message}`;
        case "loading":
            return "Loading...";
    }
}
```

---

## Generics

### Generic API Response [See](../5_generics.md#generic-interfaces)

```ts
interface ApiResponse<T> {
    data: T;
    status: number;
    timestamp: Date;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
    const res = await fetch(url);
    const data = await res.json();
    return {
        data,
        status: res.status,
        timestamp: new Date()
    };
}

// Usage — return type is fully typed based on T
const userRes = await fetchApi<User>("/api/user/1");
console.log(userRes.data.name); // type-safe — string

const productRes = await fetchApi<Product>("/api/product/1");
console.log(productRes.data.price); // type-safe — number
```

### Generic Filter Function [See](../5_generics.md#complex-example)

```ts
type Employee = {
    name: string;
    age: number;
    role: "admin" | "user";
};

const employees: Employee[] = [
    { name: "John", age: 29, role: "admin" },
    { name: "Peter", age: 32, role: "user" },
    { name: "Mark", age: 57, role: "admin" },
    { name: "Chris", age: 43, role: "user" }
];

const filterBy = <T, K extends keyof T>(
    items: T[],
    key: K,
    value: T[K]
): T[] => {
    return items.filter(item => item[key] === value);
};

const admins = filterBy(employees, "role", "admin");
// [{ name: "John", ... }, { name: "Mark", ... }]

const john = filterBy(employees, "name", "John");
// [{ name: "John", age: 29, role: "admin" }]

// filterBy(employees, "name", 42);       // Error — 42 is not string
// filterBy(employees, "address", "x");   // Error — "address" not in Employee
```

---

## Classes

### Full OOP Example [See](../4_classes-and-oop.md#abstract-classes)

```ts
interface Printable {
    print(): string;
}

abstract class Vehicle implements Printable {
    constructor(
        protected brand: string,
        protected year: number
    ) {}

    abstract fuelType(): string;

    print(): string {
        return `${this.year} ${this.brand} (${this.fuelType()})`;
    }
}

class ElectricCar extends Vehicle {
    constructor(
        brand: string,
        year: number,
        private range: number
    ) {
        super(brand, year);
    }

    fuelType(): string {
        return "Electric";
    }

    getRange(): number {
        return this.range;
    }
}

class GasCar extends Vehicle {
    constructor(
        brand: string,
        year: number,
        private mpg: number
    ) {
        super(brand, year);
    }

    fuelType(): string {
        return "Gasoline";
    }
}

const tesla = new ElectricCar("Tesla", 2024, 350);
console.log(tesla.print());      // "2024 Tesla (Electric)"
console.log(tesla.getRange());   // 350

const bmw = new GasCar("BMW", 2023, 30);
console.log(bmw.print());        // "2023 BMW (Gasoline)"
```

---

## Utility Types

### Partial for Updates [See](../6_utility-types.md#partialt)

```ts
interface User {
    id: string;
    name: string;
    email: string;
    age: number;
}

function updateUser(id: string, updates: Partial<User>): User {
    const existing: User = {
        id: "1",
        name: "John",
        email: "john@mail.com",
        age: 25
    };

    return { ...existing, ...updates };
}

updateUser("1", { name: "Jane" });          // only update name
updateUser("1", { email: "new@mail.com" }); // only update email
```

### Record for Mapping [See](../6_utility-types.md#recordk-t)

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const methodColors: Record<HttpMethod, string> = {
    GET: "#61affe",
    POST: "#49cc90",
    PUT: "#fca130",
    DELETE: "#f93e3e"
};
```

### Pick & Omit for Views [See](../6_utility-types.md#pickt-k)

```ts
interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
}

// Public-facing user — remove sensitive fields
type PublicUser = Omit<User, "password">;

// Card preview — show only what's needed
type UserCard = Pick<User, "id" | "name">;
```
