# Examples

## prototype example 1

[Go back](../4_objects-and-prototypes.md#prototype-chaining)

```js
const User = { name: "John" }
const admin = { role: "admin", __proto__: User }
const agent = { role: "agent" }
agent.__proto__ = User
```

[Go back](../4_objects-and-prototypes.md#prototype-chaining)

## prototype example 2

[Go back](../4_objects-and-prototypes.md#prototype-chaining)

```js
const parentObj = {
  name: "John",
  updateName() {
    this.name = "Jane"
  }
}
const childObj = {
  __proto__: parentObj
}

console.log(childObj.name) // "John" from parentObj 
childObj.updateName() // Here while calling function childObj will be passed as 'this'. So, 'this.name' will set name property in childObj itself. Because this is defined based on where function is invoked not where is defined.
console.log(childObj.name) // "Jane" from childObj
console.log(parentObj.name) // "John" from parentObj
```

[Go back](../4_objects-and-prototypes.md#prototype-chaining)

## prototype example 3

[Go back](../4_objects-and-prototypes.md#prototype-chaining)

```js
const user = { name: 'John' }
const admin = { role: "admin", __proto__: user }
for(let key in admin) {
  console.log(key)
}
```

[Go back](../4_objects-and-prototypes.md#prototype-chaining)

## function prototype example 1

[Go back](../4_objects-and-prototypes.md#function-prototype)

```js
function User(name){
	this.name = name,
	showName() {
		console.log(this.name)	
	}
}

const john = new User("John")
john.showName() // "John"

```

[Go back](../4_objects-and-prototypes.md#function-prototype)

## function prototype example 2

[Go back](../4_objects-and-prototypes.md#function-prototype)

```js
const userPrototype = {
  showName() {
		console.log(this.name)	
	}
}
function User(name){
	this.name = name
}

console.log(User.prototype) // {}
User.prototype = userPrototype;

const user = new User("John")
user.showName() // "John"
console.log(user.__proto__) // { showName: [Function: showName] }
```

[Go back](../4_objects-and-prototypes.md#function-prototype)

## Native prototype example 1

[Go back](../4_objects-and-prototypes.md#native-prototype)

```js
if (!String.prototype.repeat) { // if there's no such method
  // add it to the prototype

  String.prototype.repeat = function(n) {
    // repeat the string n times

    // actually, the code should be a little bit more complex than that
    // (the full algorithm is in the specification)
    // but even an imperfect polyfill is often considered good enough
    return new Array(n + 1).join(this);
  };
}

alert( "La".repeat(3) ); // LaLaLa
```

[Go back](../4_objects-and-prototypes.md#native-prototype)

## Native prototype example 2

[Go back](../4_objects-and-prototypes.md#native-prototype)

```js
let obj = {
  0: "Hello",
  1: "world!",
  length: 2,
};

obj.join = Array.prototype.join;

alert( obj.join(',') ); // Hello,world!
```


It works because the internal algorithm of the built-in join method only cares about the correct indexes and the length property. It doesn’t check if the object is indeed an array. Many built-in methods are like that.

[Go back](../4_objects-and-prototypes.md#native-prototype)