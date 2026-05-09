# Function Mechanics

When a function's execution context is created

**Lexical Environment** is defined during function object creation time. It is based on where the function is written.

**`this` Binding** is defined during function execution. It is based on where the function is called.

## Closures

Behavior of JS where an inner function can access the scope of an outer function even after the execution of the outer function is finished.

Closures are created when a function object is created.

> It's not a feature, but a consequence of lexical scoping and outer environment references

**How scope is persisted**

1. When outer function executes it creates inner function object.
2. This inner function object contains `[[Code]]` and `[[Environment]]`
3. `[[Environment]]` is reference to the lexical environment where inner function is defined (outer function's scope).
4. When `outer()` finishes, normally its execution context should be removed from the stack.
5. Because `inner` still references the lexical environment, **the environment cannot be garbage collected**.
6. When inner function is called, it uses `[[Environment]]` reference to create its lexical environment.
7. This persistent environment is called a **closure**.

If inner function does not use anything from the outer function, it will directly reference the most outer scope from where it is using something. If none, then it will reference the global scope. This happens because JS optimizes closure.

> NOTE: Closures can be used as encapsulation like classes in OOP

```javascript
function CreateAccount(){
    let balance = 0;
    return {
        deposit(amount){ balance += amount },
        withdraw(amount){ balance -= amount },
        getBalance(){ return balance }
    }
}
const myAccount = CreateAccount();
myAccount.deposit(100);
myAccount.withdraw(30);
myAccount.getBalance() // 70
```

### Real world usecases

- `useState` internally uses closures.
- Memoization

```javascript
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) return cache[key];
    cache[key] = fn(...args);
    return cache[key];
  };
}
```

## Context Binding

Like closures, which are lexically determined when a function object is created, **context** is dynamically determined when a function is invoked.

**Context binding** means what the value of the `this` object will be when the function executes.

`this` is a reference to the **object that is currently executing the function**.

Internally, a function is executed like this. So, every function call has a `this` value.

```javascript
functionObject.[[Call]](thisValue, arguments)
```

**Priority order:** new > explicit > implicit > default

### Default binding

Function invoked without any owner

```javascript
function show(){ console.log("Hello") }
show()
```

Here, `this` in:

- non-strict mode is `window` or `global` object
- strict mode is `undefined`

### Implicit binding

Function invoked through an object

```javascript
const user = {
  name: "Shri",
  greet() {
    console.log(this.name);
  }
};
user.greet();
```

Here, `this` becomes `user`

Implicit binding may break based on where it is invoked.

```javascript
var user1 = {
    name: "John",
    show: function() {
        console.log(this.name);
    }
}
var user2 = {
    name: "Jane",
    show: user1.show
}
var show = user1.show;
user1.show(); // this -> user1
user2.show(); // this -> user2
show(); // this -> global or window
```

### Explicit binding

Function invoked with manual binding using `call`, `apply`, and `bind`.

**call** invokes the function like the engine does by passing the `this` object as the first argument and then the function's arguments.

**apply** invokes the function the same as call but passes the function arguments in an array.

**bind** returns a new function with a fixed `this`. Calling bind again on a bound function does nothing

```javascript
function show(greet){
    console.log(greet + " " + this.name);
}
show.call({ name: "Alice" }, "Hello"); // Output: Hello Alice
show.apply({ name: "Bob" }, ["Hi"]); // Output: Hi Bob
const boundShow = show.bind({ name: "Charlie" });
boundShow("Hey"); // Output: Hey Charlie
```

> Internally bind works like this:

```javascript
Function.prototype.bind = function(context, ...args) {
  const fn = this;
  return function(...newArgs) {
    return fn.apply(context, args.concat(newArgs));
  };
};
```

### `new` binding

When we invoke a function with the `new` keyword, it does the following:

1. Creates an empty `this` object and sets its `[[Prototype]]` to the constructor's `prototype` property, then calls the function using the newly created `this`.
2. After function execution, returns `this` (unless function explicitly returns another object).

```javascript
function Person (name){
    this.name = name;
}
var user = new Person("John");
console.log(user.name); // John
```

When `new Person()` is called, it does the following:

```javascript
let obj = {};
Person.call(obj, "John");
return obj;
```

> Every time we create an object from a constructor, a new `this` context is created and passed to the constructor function, which initializes that `this` context and returns it as the new object.

> Arrow functions do not create their own `this` object when invoked; instead, they capture it lexically from the outer scope.

> **Why `new` overrides explicit binding:**
>
> When a function is called with `new`, the engine invokes `[[Construct]]` instead of `[[Call]]`. `[[Construct]]` creates a fresh object and uses it as `this`, completely ignoring any `this` value bound via `bind()`, `call()`, or `apply()`. The bound `this` from `bind()` only applies during normal `[[Call]]` invocations.
>
> ```js
> function Person(name) { this.name = name; }
> const BoundPerson = Person.bind({ name: "Ignored" });
> const p = new BoundPerson("Alice");
> console.log(p.name); // "Alice" — bound this was ignored
> ```

### Prevent context loss

Arrow function was introduced in ES6 to prevent context loss. Functions created with `function` create their own execution context and `this`. So if they are called without context `this` becomes `global`

But when we use `this` in arrow function, it checks for its value in its parent lexical environment.

```js
const obj = {
	name: "shri",
	func1: function () { setTimeout(function () { console.log(this.name) }, 0) },
	func2: function () { setTimeout(() => { console.log(this.name) }, 0) }
}

obj.func1()
obj.func2();
```

### Interview Tips:

- Binding priority new > explicit > implicit > default
- **default** `fn()`, **implicit** `obj.fn()`, **explicit** `fn.call(obj)` or `fn.apply(obj)` or `fn.bind(obj)`, **new** `new fn()`
- Reference lost -> implicit binding lost `const fn = obj.fn; fn()`;
- Callback functions lose context. `setTimeout(obj.fn, 0)` invokes with default binding.
- Arrow functions do not have their own `this`; instead they are invoked with outer lexical context.
- Bound functions cannot be rebound (calling bind again on a bound function does nothing).

## Higher order functions

HOF are functions that operate on other functions.
Two types of HOF:

1. **Taking a function as an argument** (most commonly used). E.g., `map`, `filter`, `reduce`.
2. **Returning a function** (less frequently used). E.g., `bind`, `memoize`.

## Pure functions

A pure function follows two rules:

1. **No side effects:** It does not change state or variables outside its scope.
2. **Deterministic output:** For the same input set, it should return the same output.

Characteristics of pure functions:

- **Referential transparency:** If a function is replaced with its output value, it should not affect the behavior of the program.
- **Immutability:** Do not modify passed arguments.

---

## TODO: Topics to Study

- [ ] IIFE (Immediately Invoked Function Expressions)
- [ ] Function declarations vs expressions vs arrow functions comparison
- [ ] Currying and partial application
- [ ] Debounce and throttle
- [ ] `arguments` object vs rest parameters
- [ ] Function composition