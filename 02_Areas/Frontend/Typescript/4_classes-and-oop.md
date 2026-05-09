# Classes & OOP

## Basic Class

```ts
class Player {
    height: number;
    width: number;

    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
    }
}

const player = new Player(100, 200);
console.log(player.height); // 100
console.log(player.width);  // 200
```

## Access Modifiers

TypeScript adds access modifiers that don't exist in JavaScript:

| Modifier | Accessible From |
| --- | --- |
| `public` (default) | Everywhere — inside class, subclasses, and instances |
| `private` | Only within the declaring class |
| `protected` | Within the class and its subclasses — not on instances |

### Public (Default)

All class members are `public` by default:

```ts
class Player {
    public height: number; // explicit public
    width: number;         // implicit public (same behavior)

    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
    }
}
```

### Private

```ts
class Player {
    private height: number;
    width: number;

    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
    }
}

const player = new Player(100, 200);
// player.height; // Error — private property
player.width;     // OK — public
```

> **TS `private` vs JS `#private`:** TS `private` is **compile-time only** — erased in JS output, accessible at runtime via `player["height"]`. JS native `#` prefix is **runtime-enforced** — truly inaccessible.

### Protected

Accessible within the class and inherited classes, but **not** on instances:

```ts
class Player {
    protected age: number;

    constructor(age: number) {
        this.age = age;
    }
}

class SubPlayer extends Player {
    getAge = () => this.age; // OK — protected accessible in subclass
}

const player = new SubPlayer(25);
player.getAge(); // 25
// player.age;   // Error — protected not accessible on instance
```

### `readonly` Modifier

Can be read but not reassigned after initialization. Works with any access modifier:

```ts
class Player {
    readonly id: string;

    constructor() {
        this.id = String(Math.random() * 100); // assignment allowed in constructor
    }
}

const player = new Player();
console.log(player.id); // OK — reading allowed
// player.id = "new";   // Error — readonly
```

> `readonly` is **not** an access modifier — it's a property modifier. You can combine it with access modifiers: `private readonly id: string`.

## Parameter Properties (Shorthand)

When an access modifier or `readonly` is used in constructor parameters, TS auto-declares and assigns the property:

```ts
// Verbose — manual declaration + assignment
class Player {
    private height: number;
    public width: number;

    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
    }
}
```

```ts
// Shorthand — modifier in constructor does both
class Player {
    constructor(
        private height: number,
        public width: number,
        protected age: number
    ) {} // empty body — TS handles declaration + assignment
}
```

> This eliminates separate property declarations and `this.x = x` assignments. Any parameter with `public`, `private`, `protected`, or `readonly` becomes a class property.

## Getter & Setter

Special methods that control property access. Accessed **like properties**, not function calls:

```ts
class Player {
    constructor(
        private _height: number,
        private _width: number
    ) {}

    get height(): number {
        return this._height;
    }

    set width(value: number) {
        if (value < 0) throw new Error("Width must be positive");
        this._width = value;
    }
}

const player = new Player(100, 200);
player.height;      // 100 — calls getter (no parentheses)
player.width = 300; // calls setter
```

**Rules:**
- Getter — must have a return value and **no** parameters.
- Setter — must have **exactly one** parameter. TS does not allow a return type annotation on setters.

> **Convention:** Prefix backing fields with `_` (e.g., `_height`) to avoid naming conflicts with the getter/setter.

## Implements (Interface Contract)

`implements` enforces that a class satisfies the structure defined by an interface:

```ts
interface ProductType {
    name: string;
    amount: number;
    stock: number;
    offer?: boolean;
}

interface Identifiable {
    id: string;
}

class Product implements ProductType, Identifiable {
    id = String(Math.random() * 100);

    constructor(
        public name: string,
        public amount: number,
        public stock: number
    ) {}
}

const product = new Product("iPhone", 80000, 500);
console.log(product.id); // accessible — public property
```

**Rules:**
- Class must implement **all required** properties from the interface.
- Class can have **additional** properties beyond the interface.
- A class can implement **multiple** interfaces.
- Interface properties **cannot** be `private` in the implementing class — interfaces define public contracts.

## Abstract Classes

Cannot be instantiated directly — serve as **base classes** that define a common structure:

```ts
abstract class Shape {
    abstract area(): number;       // must be implemented by subclass
    abstract perimeter(): number;

    describe(): string {           // concrete method — shared by all subclasses
        return `Area: ${this.area()}, Perimeter: ${this.perimeter()}`;
    }
}

class Circle extends Shape {
    constructor(private radius: number) {
        super();
    }

    area(): number {
        return Math.PI * this.radius ** 2;
    }

    perimeter(): number {
        return 2 * Math.PI * this.radius;
    }
}

// const shape = new Shape(); // Error — cannot instantiate abstract class
const circle = new Circle(5);
circle.describe(); // "Area: 78.54, Perimeter: 31.42"
```

### Abstract Class vs Interface

| Feature | Abstract Class | Interface |
| --- | --- | --- |
| Concrete methods | ✅ Can have implementation | ❌ Only signatures |
| Constructor | ✅ | ❌ |
| Multiple inheritance | ❌ Single `extends` | ✅ Multiple `implements` |
| Access modifiers | ✅ | ❌ All members are public |
| Runtime existence | ✅ Compiled to JS class | ❌ Erased at compile time |
| State (properties) | ✅ Can have initialized properties | ❌ Only declares shape |

> **When to use which:** Use abstract class when subclasses share **common implementation**. Use interface when you only need to define a **contract** without shared code.

---

## TODO: Topics to Study

- [ ] Static methods and properties
- [ ] Method overriding and `override` keyword
- [ ] Generic classes
- [ ] Mixins pattern in TypeScript
