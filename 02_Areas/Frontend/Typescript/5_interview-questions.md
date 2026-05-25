# TypeScript Interview Questions — Quick Reference

> Top 30 questions covering basics to advanced type concepts. Each answer is concise and references the detailed notes for deep understanding.

---

## Basics

### 1. What is TypeScript and why would you use it over JavaScript?
**One-liner:** TypeScript is a strongly typed superset of JavaScript that catches errors at compile-time rather than runtime, preventing crashes in production.
📖 [Detailed notes](1_core-fundamentals.md#what-is-typescript)

### 2. What are the advantages of TypeScript?
**One-liner:** Early bug detection, superior IDE intellisense, safer refactoring, and living documentation.
📖 [Detailed notes](1_core-fundamentals.md#interview-perspective)

### 3. Difference between interface and type?
**One-liner:** `interface` is specifically for objects and supports declaration merging. `type` can define objects, primitives, unions, and uses intersections (`&`).
📖 [Detailed notes](2_types-and-interfaces.md#2-type-vs-interface)

### 4. Difference between any, unknown, and never?
- `any`: Disables type checking (Unsafe).
- `unknown`: Type is unknown, forces you to check it before using it (Safe).
- `never`: A value that will never occur (e.g., throwing an error).
📖 [Detailed notes](1_core-fundamentals.md#the-special-types-any-unknown-and-never)

### 5. What is type inference in TypeScript?
**One-liner:** The compiler's ability to automatically deduce a variable's type based on its initial value, removing the need for explicit type annotations.
📖 [Detailed notes](1_core-fundamentals.md#type-inference)

### 6. What are union types and intersection types?
- **Union (`|`):** The value can be type A **OR** type B.
- **Intersection (`&`):** The value combines properties of type A **AND** type B.
📖 [Detailed notes](2_types-and-interfaces.md#4-union-and-literal-types)

### 7. What is literal type in TypeScript?
**One-liner:** A type that represents a specific, exact value (e.g., `"SUCCESS"`) rather than a general primitive type (e.g., `string`).
📖 [Detailed notes](2_types-and-interfaces.md#4-union-and-literal-types)

### 8. Difference between null and undefined in TypeScript?
`undefined` means declared but not assigned. `null` is an intentional assignment representing "no value".
📖 [Detailed notes](1_core-fundamentals.md#null-vs-undefined)

### 9. What is enum in TypeScript? What are its drawbacks?
**One-liner:** A set of named constants. Drawback: They compile into actual JavaScript objects adding bundle weight, unlike Union Literal types which vanish completely.
📖 [Detailed notes](2_types-and-interfaces.md#6-enums--their-drawbacks)

### 10. Difference between compile-time and runtime in TypeScript?
**One-liner:** Compile-time is when TS checks types and strips them away. Runtime is when the browser executes the resulting JS. Type errors only exist at compile-time.
📖 [Detailed notes](1_core-fundamentals.md#compile-time-vs-runtime)

---

## Functions & Objects

### 11. How do optional parameters work in TypeScript?
**One-liner:** Append a `?` to the parameter name (`age?: number`). They must appear after all required parameters.
📖 [Detailed notes](3_functions-and-generics.md#optional-parameters)

### 12. Difference between function overloads and union types?
**One-liner:** Unions handle simple logic variations. Overloads define entirely different input/output combinations (signatures) for a single function.
📖 [Detailed notes](3_functions-and-generics.md#2-function-overloads-vs-union-types)

### 13. What is a readonly property?
**One-liner:** A modifier that ensures an object property cannot be reassigned after it is created.
📖 [Detailed notes](2_types-and-interfaces.md#5-object-property-modifiers)

### 14. What is index signature in TypeScript?
**One-liner:** Used when exact property names are unknown, but key/value types are known (e.g., `[key: string]: number`).
📖 [Detailed notes](2_types-and-interfaces.md#5-object-property-modifiers)

### 15. What is structural typing?
**One-liner:** TypeScript checks if the "shape" of an object matches the required type, not its explicit name (Duck Typing).
📖 [Detailed notes](2_types-and-interfaces.md#1-structural-typing-duck-typing)

### 16. Difference between interface extension and type intersection?
**One-liner:** Interface extension (`extends`) is strict and catches conflicting types. Type intersection (`&`) mathematically merges them, often resolving conflicts to `never`.
📖 [Detailed notes](2_types-and-interfaces.md#3-extending-interfaces-vs-intersecting-types)

### 17. What is declaration merging?
**One-liner:** When TypeScript finds multiple `interface` blocks with the exact same name, it merges them into a single interface automatically. (Cannot be done with `type`).
📖 [Detailed notes](2_types-and-interfaces.md#declaration-merging-the-unique-power-of-interface)

### 18. How do generics work in TypeScript?
**One-liner:** They act as variables for Types (`<T>`). You pass a type argument into a function/class, and TS applies that specific type throughout the logic.
📖 [Detailed notes](3_functions-and-generics.md#3-generics-the-ultimate-reusability-tool)

### 19. What problem do generics solve?
**One-liner:** They allow writing highly reusable code without sacrificing type safety (avoiding the use of `any`).

### 20. Difference between extends in inheritance vs generics constraint?
**One-liner:** Inheritance `extends` means "copy parent and add more". Generic constraint `<T extends User>` means "whatever type T is, it MUST match the shape of User."
📖 [Detailed notes](3_functions-and-generics.md#inheritance-extends-vs-generic-constraint-extends)

---

## Advanced Types

### 21. What are utility types in TypeScript?
**One-liner:** Built-in generic types (like `Partial`, `Pick`) that globally facilitate common type transformations.
📖 [Detailed notes](4_advanced-types.md#2-utility-types-the-core-5)

### 22. Explain Partial, Required, Pick, Omit, and Record.
- `Partial`: All properties optional.
- `Required`: All properties required.
- `Pick`: Extract specific subset of properties.
- `Omit`: Remove specific subset of properties.
- `Record`: Create strict dictionary of Keys and Values.
📖 [Detailed notes](4_advanced-types.md#2-utility-types-the-core-5)

### 23. What is keyof in TypeScript?
**One-liner:** Operator that takes an object type and returns a Union Type of all its property names (keys).
📖 [Detailed notes](4_advanced-types.md#keyof)

### 24. What is typeof in TypeScript type system?
**One-liner:** Extracts the structural type from an existing JavaScript variable at compile time.
📖 [Detailed notes](4_advanced-types.md#typeof-in-a-type-context)

### 25. What are mapped types?
**One-liner:** A way to create new types by iterating over the keys of an existing type using the `in` keyword.
📖 [Detailed notes](4_advanced-types.md#3-mapped-types)

### 26. What are conditional types?
**One-liner:** Types that resolve dynamically based on a condition using ternary syntax: `T extends U ? TrueType : FalseType`.
📖 [Detailed notes](4_advanced-types.md#4-conditional-types-and-infer)

### 27. What is infer keyword?
**One-liner:** Used within Conditional Types to declare a temporary type variable that TypeScript deduces on the fly (e.g., extracting the type out of an Array).
📖 [Detailed notes](4_advanced-types.md#the-infer-keyword)

### 28. Explain covariance and contravariance in TypeScript.
**One-liner:** Covariance allows a more specific type to be returned safely. Contravariance allows a more generic type to be passed safely as a function parameter.
📖 [Detailed notes](4_advanced-types.md#6-covariance-and-contravariance)

### 29. What is discriminated union?
**One-liner:** A pattern where multiple objects in a Union share a common literal property (`type: "success"`). Checking this property safely narrows the type.
📖 [Detailed notes](4_advanced-types.md#5-discriminated-unions)

### 30. How does TypeScript handle async functions and Promises?
**One-liner:** Uses the generic `Promise<T>`. You annotate the async function's return type as `Promise<TheResolvedDataType>`.
📖 [Detailed notes](3_functions-and-generics.md#5-async-functions-and-promises)
