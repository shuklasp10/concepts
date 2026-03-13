# Core Fundamentals

## Closures

Behaviour of JS where inner function can access scope of outer function even after execution of outer function is finished.

> \[!TIP]
> Its not a feature, but a consequence of lexical scoping and outer environment references

**How scope is persisted**

1. When outer function executes it creates inner function object.
2. This inner function object contains `[[Code]]` and `[[Environment]]`
3. `[[]Environment]]` is reference to the lexical environment where inner function is defined (outer function's scope).
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

## Prototypes

## Classes
