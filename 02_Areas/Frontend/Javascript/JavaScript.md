# Web developement Notes: Javascript

## Table of Contents

- [Datatypes](#datatypes)
- [Higher order functions](#higher-order-functions)
- [Call, Apply, and Bind](#call-apply-and-bind)
- [Pure functions](#pure-functions)
- [Scoping](#scoping)
- [Hoisting](#hoisting)
- [Closures](#closures)
- [Array](#array)
- [Promises](#promises)
- [Date in javascript](#date-in-javascript)
- [Client side storage](#client-side-storage)
- [DOM manipulation](#dom-manipulation)
- [Events](#events)
- [Event Loop](#event-loop)
- [Drag events](#drag-events)
- [Performance Calculator](#performance-calculator)

## Datatypes

### Primitive

> Always passed as value.

- **string**
- **number**
  - Numbers are **64 bit** IEEE 754 double precision.
  - Breakdown: Sign(1) + Exponent(11) + Mantissa(52)
  - Also include floats
  - Minimum safe range: `-(2^53 - 1)` or `9007199254740991` or `Number.MIN_SAFE_INTEGER`
  - Maximum safe range: `(2^53 - 1)` or `9007199254740991` or `Number.MAX_SAFE_INTEGER`
  - Beyond this range numbers exist but precision is lost.

    ```js
    console.log(Number.MAX_SAFE_INTEGER+1 === Number.MAX_SAFE_INTEGER+2)
    //true
    ```

  - Minimum positive range: `5e-324` or `Number.MIN_VALUE` 
  - Maximum range: `1.7976931348623157e+308` or `Number.MAX_VALUE`
  - Beyond this range become `0` for minimum and `Infinity` for maximum

    ```js
    console.log(Number.MAX_VALUE * 2); // Infinity
    console.log(Number.MIN_VALUE / 2); // 0
    ```

<!-- TODO: Move it in separate section and add link  -->
  > `NaN` is special numeric value to represent invalid numbers.
  > Example: `0/0`, `Math.sqrt(-1)`, `"Hello"`
  > `NaN === NaN` will always be false. To compare use `Number.isNaN(value)`
  > `isNaN()` old way it try to convert value in number first then compare. Use `Number.isNaN()` for safe check. 

- **bigint**
  - For number beyond safe integer.
  - Range limited by memory.
- **boolean**
- **undefined**
- **null**
  - `Null` is primitive datatype but its `typeof` is `object`. This is
    intentional bug in Javascript.
- **symbol**
  - Used as **unique identifiers**, mostly as keys in object.
  - Two symbol with same value can't be equal.
  - `Symbol("id") === Symbol("id")` false

### Non primitive (reference)

> Always passed as reference
> 
> Javascript has one non-primitive type `object`, rest all are specialized objects.

- **object**
- **array**
- **function**
- **date**
- **RegExp**
- **map**
- **set**
- **weakmap**
- **weakset**

### Built-in objects

- **Set**
  - stores unique value of any type

    ```js
    const set = [...new Set(arr)]
    ```
  
- **Map**
  - map stores key, value pair where key can be anything not only string

    ```js
    const map = new Map()
    map.set('key','value')
    map.get('key') //value
    ```

  - `map.size` gives number of entries in map.
  - `Object.fromEntries(map)` convert map to object.

## Call, apply and bind

### Call

- The `call()` method invokes a function with a given this value and
  arguments provided one by one

```js
var employee1 = { firstName: "John", lastName: "Rodson" };
var employee2 = { firstName: "Jimmy", lastName: "Baily" };

function invite(greeting1, greeting2) {
  console.log(
    greeting1 + " " + this.firstName + " " + this.lastName + ", " + greeting2
  );
}

invite.call(employee1, "Hello", "How are you?");
// Hello John Rodson, How are you?
invite.call(employee2, "Hello", "How are you?");
// Hello Jimmy Baily, How are you?
```

### Apply

- Invokes the function with a given this value and allows you to pass in
  arguments as an array

```js
var employee1 = { firstName: "John", lastName: "Rodson" };
var employee2 = { firstName: "Jimmy", lastName: "Baily" };

function invite(greeting1, greeting2) {
  console.log(
    greeting1 + " " + this.firstName + " " + this.lastName + ", " + greeting2
  );
}

invite.apply(employee1, ["Hello", "How are you?"]); 
// Hello John Rodson, How are you?
invite.apply(employee2, ["Hello", "How are you?"]); 
// Hello Jimmy Baily, How are you?
```

### bind

- returns a new function, allowing you to pass any number of arguments

```js
var employee1 = { firstName: "John", lastName: "Rodson" };
var employee2 = { firstName: "Jimmy", lastName: "Baily" };

function invite(greeting1, greeting2) {
  console.log(
    greeting1 + " " + this.firstName + " " + this.lastName + ", " + greeting2
  );
}

var inviteEmployee1 = invite.bind(employee1);
var inviteEmployee2 = invite.bind(employee2);
inviteEmployee1("Hello", "How are you?"); // Hello John Rodson, How are you?
inviteEmployee2("Hello", "How are you?"); // Hello Jimmy Baily, How are you?
```

- Call and Apply are interchangeable. Both execute the function immediately.
- Decide based on argument format: Call for comma-separated, Apply for array.
- Bind creates a new function with preset 'this' and initial arguments.

## Higher order functions

HOF are those functions which operates on other functions
Two types of HOF:

1. **Taking function as argument** most commonly used. Eg map, filter
2. **Returning function** less frequently used

## Pure functions

Pure function follows two rules

1. **No side effects:** does not change state or variable outside its scope.
2. **Deterministic scope:** for same input set it should return same output
Charateristics
3. **Referential transparency:** if function is replaced with its output value,
   it should not affect behaviour of program.
4. **Immutability:** do not modify passed arguments

## Scoping

### let and const scoping

- **block** Anything withing curly braces
- let and const follow block level scoping

```js
{let a = 10}
console.log(a) //error
```

- **global & window** both reference same object.
- `window` in browser context, `global` in Node.js context

- **globally scoped variable** if let and const are not inside any block
  then they are inside *global or window* block.
- It means they can accessed by another script using same application.

- **precedence** nearest scoped variable is used first
  then look for outer scoped variable

```js
let a = 10;
{
    let a = 8;
    console.log(a); //8
}
```

### var scoping

- var does not follow block level scoping

```js
if(true){ var a = 10 }
console.log(a) //10
```

- It attach to parent object in which it is declared. like function, object .
- **precedence** nearest scoped variable is used first
  then look for outer scoped variable

## Hoisting

- Behaviour of javascript which moves variable or function definition
- (not declaration) to top of its scope.
- Only var follow hoisting, let and const does not moves on top
- use `let` or `const` to prevent hoisting.

```js
console.log(a) //undefined
var a = 10
```

### Temporal dead zone

- Behaviour of js which hoist `let` and `const` but unlike `var`
- They are not initialized, causing `ReferenceError`
- TDZ spans from block start to variable declaration line

```js
function show(){
    // ...TDZ
    let a = 10;
}
```

## Closures

- Closure keeps outer scope accessible after outer function execution.
- Exists when a function is defined inside another function.

```js
function outer(){
    let i = 10;
    return inner(){console.log(i)}
}
var show = outer();
show(); //10
```

### Keypoints

1. Closure variable gets updated if it is changed in inner function.

    ```js
    function outer(){
        var a = 11

        return function inner(){
            a++
            console.log(a);
        }
    }
    var show = outer()
    show(); //12
    show(); //13
    ```

2. Earlier closures were used to create private variables.
3. Closure is used to create helper functions with only one function definition.

    ```js
    for(let i=0; i<3; i++){
    setTimeout(function() {console.log(i)}, 10);
    }
    ```

this will create three instance of `i` for each iteration.
so output will be `0 1 2`

```js
for(var i=0; i<3; i++){
  setTimeout(function() {console.log(i)}, 10);
}
```

this will create single instance of `i` which will be updated by each iteration.
so output will be `3 3 3`.

## Array

### Array HOF

| HOF         | Return   | Description                          |
| ----------- | -------- | ------------------------------------ |
| `map`       | Array    | new array with callback results      |
| `filter`    | Array    | array of elements passing test       |
| `forEach`   | Undefined| executes callback (no return)        |
| `reduce`    | Value    | single value from reduction          |
| `some`      | Boolean  | true if any passes test              |
| `every`     | Boolean  | true if all pass test                |
| `find`      | Element  | first matching element               |
| `findIndex` | Index    | index of first match                 |
| `findLast`  | Element  | last matching element                |
| `findLastI` | Index    | index of last match                  |

### reduce

callback function in reduce takes one extra argument: **accumulator**.
Accumulator will store value performed on each element of array.

```js
const total = arr.reduce((acc,ele)=>{
    acc += ele;
    return acc;
});
```

### Array methods

| Method             | Description                  |
| ------------------ | ---------------------------- |
| `Array.from()`     | Create array from iterable   |
| `Array.of()`       | Create array with elements   |
| `Array.isArray()`  | Check if value is array      |
| `push()`           | Add elements to end          |
| `pop()`            | Remove last element          |
| `unshift()`        | Add elements to start        |
| `shift()`          | Remove first element         |
| `splice()`         | Add/remove at index          |
| `concat()`         | Merge arrays                 |
| `at()`             | Get element at index         |
| `indexOf()`        | Find element index           |
| `lastIndexOf()`    | Find last element index      |
| `includes()`       | Check if contains element    |
| `sort()`           | Sort array in place          |
| `reverse()`        | Reverse array order          |
| `flat()`           | Flatten nested arrays        |
| `slice()`          | Get portion of array         |
| `copyWithin()`     | Copy part to another spot    |
| `fill()`           | Fill with static value       |
| `join()`           | Join to string               |
| `toString()`       | Convert to string            |
| `toLocaleString()` | Locale string                |
| `entries()`        | Key-value iterator           |
| `keys()`           | Index iterator               |
| `values()`         | Value iterator               |

## handling input on key press

```js
const addTag = (e) =>{
    if( e.key == "enter" ){
        add tag...
    }
}
```

`<input onKeyDown={addTag} />`

## adding chip in input field

div = chip span + input (flexgrow : 1)

## Promises

Object in javascript to handle asynchronous operation.  
Promise represents a value that may be present now, in future or never.

### states of promise

1. **pending** - waiting for operation completion
2. **fulfilled** - operation completed successfully and returned value
3. **rejected** - operation failed

### create promise

**walkthrough**  

1. Creating promise means wrapping asynchronous operation in promise object.
2. `Promise()` constructor - is used for creating promises.  
3. executor - function with async operation (resolve, reject).
4. resolve, reject - functions called when async operation completes.
5. executor is immediatly executed when promise is created
6. If operation completed resolve is called with value as its argument.
7. If operation is failed reject is called with error as its argument.

```js
const newPromise = new Promise((res,rej)=>{
    ...async operation
    if(passed) res(data)
    else rej(error)
});
```

### promise methods

promise methods are executed handle promise value or error

1. `then()` it takes a function which is executed after promise is completed.
2. `catch()` takes a function which is executed after promise fails
3. `finally()` executes regardless of resolution or rejection.

### promise chaining

multiple promises can be chained if first completes successfully.  
Chain using multiple `.then()` where each returns a promise.

```js
myProm1.then(()=>{
    return myProm2
}).then(()=>{
    return myProm3
})
```

### keypoints

1. async functions return promise

## Date in javascript

date is represented by `Date` object.

### creating date object

various method of creating date object

1. `const currentDate = new Date();`
    - returns current date and time with ISO 8601 format.
    - **format** YYYY-MM-DDTHH:MM:SS:MMMZ
    - **T** represent separator, time start after that
    - **Z** represent timezone z - UTC
2. `const date = new Date(n);`
    - returns date after n milliseconds from Unix epoch
    - `new Date(0)` - (1970-01-01T00:00:00.000Z)
    - `new Date(1)` - (1970-01-01T00:00:00.001Z)
    - `new Date(1001)` - (1970-01-01T00:00:01.001Z)
3. `const date = new Date(yr,m,d,hr,min,sec)`;
    - month is 0-indexed so 0-jan, 1-Feb, 11-Dec

### accessing date component

following method are used for accessing components from date object

1. `date.getFullYear()` 2024
2. `date.getMonth()` 0-indexed month
3. `date.getDate()` 15
4. `date.getHours()` 23
5. `date.getMinutes()` 59
6. `date.getSeconds()` 59
7. `date.getTime()` return total ms between current date and start time

### manipulating dates

1. `date.setDate(date.getDate() + 7);`
2. `date.setMonth(date.getMonth() + 1);`
3. `date.setFullYear(date.getFullYear() - 1);`
4. Same can be done for hr, min and sec.

### comparing dates

1. Compare dates using operators or convert to milliseconds with `getTime()`.

### formatting date

1. `date.toDateString()` Mon May 15 2024
2. `date.toTimeString()` 12:00:00 GMT+0000 (Coordinated Universal Time)
3. `date.toISOString()` 2024-05-15T12:00:00.000Z

## Client side storage

### types of storages

1. **local storage**  accessed with `localStorage`
2. **session storage** accessed with `sessionStorage`
3. **cookies** accessed with `document.cookie`

|                       | cookies        | local storage | session storage |
| --------------------- | -------------- | ------------- | --------------- |
| **capacity**          | 4KB            | 10MB          | 5MB             |
| **Browser**           | HTML4/HTML5    | HTML5         | HTML5           |
| **Accessible from**   | Any window     | Any window    | same tab        |
| **Expires**           | Manually set   | Manually set  | Tab close       |
| **Storage Location**  | Browser/Server | Browser       | Browser         |
| **Sent with request** | Yes            | No            | No              |

1. localStorgae
    - `localStorage.setItems('key','value')` - stores key-value pair
    - `localStorage.getItems('key')` takes one parameter key
    - `localStorage.removeItems('key')`

2. sessionStorage
    - `sessionStorage.setItems('key','value')` - stores key-value pair
    - `sessionStorage.getItems('key')` takes one parameter key
    - `sessionStorage.removeItems('key')`

3. cookies
    - `document.cookie = 'name=shri; expires'+new Date(2025,1,1).toUTCString()`

## DOM manipulation

### Accessing element

1. **document.getElementById()** takes id and return an element.
2. **getElementByClassName()** returns array of elements by class name.
3. **getElementByTagName()** returns array of elements by tag name.
4. **querySelector()** returns first element matching CSS selector.
5. **querySelectorAll()** returns array of elements matching CSS selector.
6. **querySelectorAll()** returns array of all matched elements for selector.

### Modifying element content

After selecting element with above methods we can change its content.

```[javascript]
let,
const element = document.getElementById('myId')
```

1. **element.innerHTML** get or set inner html content.
    - `console.log(element.innerHTML)` // `<p>this is para</p>`
    - `element.innerHTML = <h1>para changed to heading</h1>`
2. **element.textContent** get or set text content inside tag and its children .
    - `console.log(element.textContent)` // `this is para`
3. **innerText** like textContent but respects CSS visibility rules.

### Modifying element attributes

Change element attributes like src, href etc

1. **setAttribute()** sets element attributes and values.
    - `element.setAttribute('src','image.jpg');`
2. **element.getAttribute(attr)** takes attributes and return its value.
    - `element.getAttribute('src');` //image.jpg
3. **element.removeAttribute(attr)** takes attributes and remove that attribute.
    - `element.removeAttribute('src');`

### Modifying element style

change inline style of element
`element.style.cssPropertyName`

1. **`element.style.cssPropertyName`** set value of a css property
    - `element.style.color = 'red'`
2. **`element.classList`**
    1. `element.classList.add('new_class1','new_class2')`
    2. `element.classList.remove('class1','class2)`
    3. `toggle('myClass')` - add if absent, remove if present
        1. `element.classList.toggle('myClass', true)` add the class
        2. `element.classList.toggle('myClass', false)` remove the class
    4. `contains('class')` - returns true if class is present
    5. `element.classList.replace('old-class','new-class')`
    6. `element.classList.item(0)` or `element.classList[0]`
    7. `element.classList.length` gives number of classed in the element.

### Creating and insert element

1. `document.createElement('tagname')` take tagname and return element created
2. `element.appendChild(newElement)` append child to parent element.

### Event Handling

Manipulating dom element in response to user action

1. `element.addEventListener('click',handleClick)`
2. `element.removeEventListener('click',handleClick)`

## Events

- **Events:** happen in system and code reacts accordingly
- **Event fire:** when event triggers, browser attaches it to element.
- **Event listener:** listens for event and calls handler when fired.
- **Event handler:** function that executes in reaction to event fire.

### Adding event listeners

There are three ways to add event listeners to an element.

1. `addEventListener`
2. event handler properties
3. inline event handlers

#### addEventListener

```html
<body>
    <button id="btn">Click me!</button>
    <script>
        const btn = document.getElementById('btn');
        function btnHandler(){
            console.log('button is clicked');
        }
        btn.addEventListener('click',btnHandler)
    </script>
</body>
```

- Objects should have event listener to listen if event is fired.
- multiple listeners execute orderly on same element.

```js
myElement.addEventListener("click", functionA);
myElement.addEventListener("click", functionB);
```

- Some event are available for all elements such as `click`
- Some events are element-specific (e.g., `play` for `<video>`).
- **remove event listeners:** use `removeEventListener()` to remove.

#### event handler properties

objects with `on` property prefix followed by event name.

```js
btn.onclick(handleBtnClick);
```

- Unlike `addEventListener()`, handler properties can't handle multiple handlers

```js
element.onclick = function1;
element.onclick = function2;
```

- Here function2 will overwrite function1 handler

#### Inline event handlers *(Not recommended)*

`<button onclick="bgChange()">Press me</button>`

- here onclick attribute value is purely javascript code.

### Events objects

- Objects that are automatically passed to event handlers

```js
const btn = document.querySelector("button");
function handler(event){
    console.log(event);
    console.log('button is clicked)
}
btn.addEventListener('click',handler);
```

- `e.target` return element itself
- `preventDefault()` prevents element's default action.

### Events in NodeJS

- `events` library used for working with events
- `EventEmitter` class used to emit events

```js
const EventEmitters = require('events');

const myEmitter = new EventEmitter();
```

- `on` method used to add event listeners

```js
myEmitter.on('eventName',handlerFunction);
```

- `emit` method to emit or trigger event

```js
myEmitter.emit('eventName');
```

- `once` same as `on` but event can be fired only once.

## Event Loop

- Javascript is single threaded, synchronous by nature.
- to handle asynchronous operations **event loop** is used.

### working for event loop

- **Call Stack** executes current job. Async operations are delegated.
- **Task queue** contains all the job that is to be executed line by line.
- **Web API** handles async operations (DOM, network) from call stack.
- **callback queue** receives callback functions from Web API.
- Event loop pushes callbacks when call stack empties.

## Performance calculator

```js
let startTime = performance.now();
let endTime = performance.now();
let timeElapsed = endTime - startTime;
```

## Drag Events

- **draggable** attribute of element is set true to make is draggable element.

```html
<div draggable="true">

</div>
```

| Events        | On Element        | Details                      |
| ------------- | ----------------- | ---------------------------- |
| `onDragStart` | draggable         | When drag starts             |
| `onDrag`      | draggable         | Continuous during drag       |
| `onDragEnd`   | draggable         | When element released        |
| `onDragEnter` | target            | When over target             |
| `onDragOver`  | target            | Continuous over target       |
| `onDragLeave` | target            | When leaving target          |
| `onDrop`      | target            | When dropped on target       |

### Execution order

`onDragStart` -> `onDrag` -> `onDragEnter` -> `onDragOver`
-> `onDragLeave` -> `onDrop` -> `onDragEnd`

### Notes

- call `e.preventDefault()` on `onDrop` and `onDragOver` to allow dropping.
- use `dataTransfer` to transfer data between drag and drop

    ```js
    dropzone.addEventListener('drop', (event) => {
       event.preventDefault();
       const data = event.dataTransfer.getData('text/plain');
       dropzone.textContent = `Dropped: ${data}`;
   });
    ```
