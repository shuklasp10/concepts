# Core Fundamentals

## Closures

Behaviour of JS where inner function can access scope of outer function even after execution of outer function is finished.

Closures are created when function object is created.

> \[!TIP]
> Its not a feature, but a consequence of lexical scoping and outer environment references

**How scope is persisted**

1. When outer function executes it creates inner function object.
2. This inner function object contains `[[Code]]` and `[[Environment]]`
3. `[[Environment]]` is reference to the lexical environment where inner function is defined (outer function's scope).
4. When `outer()` finishes, normally its execution context should be removed from the stack.
5. Because `inner` still references the lexical environment, **the environment cannot be garbage collected**.
6. When inner function is called, it uses `[[Environment]]` reference to create its lexical environment.
7. This persistent environment is called a **closure**.

> \[!NOTE]
> Closures can be used as encapsulation like classes in oops

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
  return function (x) {
    if (cache[x]) return cache[x];
    cache[x] = fn(x);
    return cache[x];
  };
}
```

## Context Binding

Like closures is lexically determined when function object is created, **context** is dynamically determined when function is invoked.

**Context binding&#x20;**&#x6D;eans when function executes what will be value of `this` object.

`this` is reference to the **object that is currently executing the function**.

Internally, function is executed like this. So, every function call have `this` value.

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

Here, `this` in&#x20;

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

Function invoked with manual binding using `call`, `apply` and `bind`

**call&#x20;**&#x69;nvokes function like engine does by passing `this` object as first argument and then functions arguments

**apply&#x20;**&#x69;nvokes function same as call but pass function argument in array.ot**bind&#x20;**&#x72;eturns new function with fixed `this`&#x20;

```javascript
function show(greet){
    console.log(greet + " " + this.name);
}
show.call({ name: "Alice" }, "Hello"); // Output: Hello Alice
show.apply({ name: "Bob" }, ["Hi"]); // Output: Hi Bob
const boundShow = show.bind({ name: "Charlie" });
boundShow("Hey"); // Output: Hey Charlie
```
 > \[!NOTE]
> Internally bind work like this

### `new` binding

When we invoke function with `new` keyword it does following

1. Created empty `this`&#bjectx2. call function using newly created `this`
3. after function execution, returns `this`&#x20;

```javascript
function Person (name){
    this.name = name;
}
var user = new Person("John");
console.log(user.name); // John
```
2When `new Person()` is called it does following

```javascript
let obj = {}
Person.call(obj, "John")
return obj
```

> \[!NOTE]
> Everytime we create an object from constructor a new `this` context is created and passed to constructor function which initializes that `this` context and return it as new object.

> \[!TIP]
> Arrow function ado not create their own`this` object when invoked, instead they capture it lexically from outer scope.

> \[!WARNING]
> TODO: why `new` override explicit binding, check interna
 working `[[call]]` vs `[[construct]]`
### Interview Tips:

- Binding priority new > explicit > implicit > default
- **default&#x20;**`fn()`, **implicit&#x20;**`obj.fn()`, **explicit&#x20;**`fn.call(obj)` or `fn.apply(obj)` or `fn.bind(obj)`, **new&#x20;**`new fn()`
- Reference lost -> implicit binding lost `const fn = obj.fn; fn()`&#x20;
- Callback function lose context. `setTimeout(obj.fn, 0)` invokes with default binding&#x20;
- Arrow function do not have t
eir own `this`, instead invoked with outer lexical context

## Prototypes

## Classes















