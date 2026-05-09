# Object and Prototypes

## Prototype 

### Prototype chaining

Every object has an internal property `[[Prototype]]` stores reference to a parent object (or `null`).

Prototypes can be access/modify using `__proto__`

[See Example](./examples/examples.md#prototype-example-1)

> `__proto__` is actually getter/setter for `[[Prototype]]` property. `__proto__` is outdated and exist for historic reasons. Instead, JS recommend to use below function to set/get prototype.
>
> `Object.getPrototypeOf` and `Object.setPrototypeOf`

Prototype can be used for reading property only. Write/delete operation directly work with object. [See Example](./examples/examples.md#prototype-example-2)

`for...in` loop iterates over inherited properties too [See Example](./examples/examples.md#prototype-example-3). Other than `for...in` almost all other key or value getter (like `Object.keys()` or `Object.values()`) ignore inherited property.

> **Why properties from `Object` does not show in `for...in` iteration?**
>
> Only properties with enumerable as true shows in iteration. All properties in `Object` have enumerable false.

To check if property is owned by object itself not inherited use `obj.hasOwnProperty(key)`

### Function prototype

New objects can be created using function as constructor with `new` keyword [See more](./5_function-mechanics.md#new-binding)  [See Example](./examples/examples.md#function-prototype-example-1)

Function objects have `prototype` property, the new operator uses function prototype to set `[[Prototype]]` for the new object.

Default value of function `prototype` is an object with only property `constructor` that points back to the function itself. We can check same using `user.prototype.constructor === User` 

> **How to create object from another object's constructor without having access to actual constructor?**
>
> This will only work is default prototype is not changed. [Reference](https://javascript.info/function-prototype#:~:text=So%2C%20to%20keep%20the%20right%20%22constructor%22%20we%20can%20choose%20to%20add/remove%20properties%20to%20the%20default%20%22prototype%22%20instead%20of%20overwriting%20it%20as%20a%20whole%3A)
>
> ```js
> function User(name){
> this.name = name
> }
>
> const firstUser = new User("John")
> const secondUser = new firstUser.__proto__.constructor("Jane")
> console.log(firstUser.name) // John
> console.log(secondUser.name) // Jane
> ```

Function prototype can be changed before creating object to set same as objects prototype. [See Example](./examples/examples.md#function-prototype-example-2)

### Native Prototype

Every built-in constructor has its own native prototype. For example

`new Object()` here Object is constructor and its prototype i.e. `Object.prototype` is huge object which actually contains methods and properties for objects. We can verify like this\

```js
let obj = {}
obj.__proto__ === Object.prototype // true

let arr = []
arr.__proto__ === Array.prototype // true
```

Some method may overlap like `Array` has its own `toString()` method. So, in such case nearest method in chain is applied. 

We can modify native prototypes to add our custom methods. 

```js
Array.prototype.show = function() { console.log(this) }
let arr = [1,2,3]
arr.show() // 1,2,3
```

> Prototype are global so they may create conflicts so modifying native prototype is avoided.

There is only one usecase of modifying native prototype

**Polyfilling:** It is a term for making a substitute for a method that exists in the JavaScript specification, but is not yet supported by a particular JavaScript engine. Then we can manually implement it. [See Example](./examples/examples.md#native-prototype-example-1)

**Borrowing prototype methods** We can borrow methods from one prototype to another as long as the borrowed method is applicable on both types of objects. [See Example](./examples/examples.md#native-prototype-example-2)

---

## TODO: Topics to Study

- [ ] `Object.create()`
- [ ] ES6 `class` syntax and prototype mapping
- [ ] `instanceof` operator
- [ ] Property descriptors (`Object.defineProperty`, enumerable/writable/configurable)
- [ ] `Object.freeze()`, `Object.seal()`, `Object.assign()`
- [ ] Shallow vs deep copy
- [ ] `structuredClone()`
- [ ] Symbol as property keys