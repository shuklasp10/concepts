# Runtime Fundamentals

## Execution flow

1. Program start
2. Parse syntax
3. Create `Global()` execution context
4. Push execution context to call stack
5. Create lexical environment for for execution context
6. Create Global object and bind `this` to Global object.
7. Memory creation phase starts in execution context
8. Code execution phase starts in execution context
9. If function is called, repeat steps 3-8 for function execution context
10. Program ends when call stack is empty and `Global()` execution context is popped from stack

## Execution context

A conceptual wrapper that contains information about the environment in which the current code is being executed.
It includes:

- **Lexical Environment**
- **Variable Environment**
- `this` Binding

> For `Global()` execution context, `this` refers to the global object (`window` in browser, `global` in Node.js).

Execution context is created when

- Program starts (**Global execution context**)
- Function is called (**Function execution context**)
- `eval()` is executed (**Eval execution context**)

After execution context is created and pushed to call stack it goes through two phases:

1. **Memory Creation Phase**
   - Lexical environment is created
   - Variables registered and hoisted
   - Function declarations stored and hoisted
   - `this` binding determined
2. **Code Execution Phase**
   - Code is executed line by line

> \[!TIP]
> During memory creation phase, for functions a function object is created with properties like`[[Code]]`and `[[Environment]]`

### How blocks are handled during code execution phase?

An execution context can have multiple lexical environment in its entire lifetime.

Each block creates a new lexical environment, one lexical environment is active at a time

```javascript
var a = 10;
if(true){
    console.log("hello")
}
console.log(a);
// Here `Global()` execution context has two lexical environments, one for global scope 
// and one for if block. During execution of if block, the block's lexical environment is active, 
//but after block execution finishes, it goes back to global lexical environment.
```

## Call Stack

A data structure that keeps track of the execution contexts in the order they are created.It follows Last In First Out (LIFO) principle.Maximum recursion depth is 10,000 due to limited stack memory.

> JavaScript is single-threaded, meaning only one execution context runs at a time

## Lexical Environment

A data structure that holds variables and scope information
Lexical environment contains

- Environment Record (*variables/functions*)
- Reference to outer lexical environment (*Refers to&#x20;*`[[Environment]]`*&#x20;property of function's object*)
  reference to outer lexical environment allows for scope chaining and variable lookup in parent scopes

> \[!NOTE]
> Reference to outer lexical environment is based on where the function is defined, not where it is called (lexical scoping).
>
> For Global execution context, the outer lexical environment is `null`

```js
let a = 10;
function foo() {
  console.log(a);
}
function bar() {
  let a = 20;
  foo();
}
bar();

// Output: 10
// Reason: `foo` is defined in the global scope, so it looks for `a` in the global lexical environment, not in `bar`'s lexical environment.
```

## Scope chain

Javascript mechanism to resolve variables.

Engine search variables in below order

1. Current lexical environment
2. Outer lexical environment
3. Parent lexical environment
4. global lexical environment

```js
let a = 10;
function foo() {
  let b = 20;
  console.log(a); // 10 (found in global lexical environment)
  console.log(b); // 20 (found in foo's lexical environment)
}
foo();
```

## Hoisting

Allocation of memory for variables and functions before execution during the memory creation phase.

| Declaration | Hoisting Behavior                         |
| ----------- | ----------------------------------------- |
| `var`       | hoisted and initialized as `undefined`    |
| `let`       | hoisted but remains in Temporal Dead Zone |
| `const`     | hoisted but remains in Temporal Dead Zone |
| `function`  | hoisted with full function definition     |
