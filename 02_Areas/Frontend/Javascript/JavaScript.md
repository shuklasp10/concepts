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

- __string__
- __number__
- __bigint__
- __boolean__
- __undefined__
- __null__
- __symbol__

### Non primitive (reference)

- __object__
- __array__
- __function__
- __date__

### special types

- __Infinity__
- __NaN__

### Built-in objects

- __Set__
  - stores unique value of any type

    ```js
    const set = [...new Set(arr)]
    ```

- __Map__
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

- The `call()` method invokes a function with a given this value and arguments provided one by one

```js
var employee1 = { firstName: "John", lastName: "Rodson" };
var employee2 = { firstName: "Jimmy", lastName: "Baily" };

function invite(greeting1, greeting2) {
  console.log(
    greeting1 + " " + this.firstName + " " + this.lastName + ", " + greeting2
  );
}

invite.call(employee1, "Hello", "How are you?"); // Hello John Rodson, How are you?
invite.call(employee2, "Hello", "How are you?"); // Hello Jimmy Baily, How are you?
```

### Apply

- Invokes the function with a given this value and allows you to pass in arguments as an array

```js
var employee1 = { firstName: "John", lastName: "Rodson" };
var employee2 = { firstName: "Jimmy", lastName: "Baily" };

function invite(greeting1, greeting2) {
  console.log(
    greeting1 + " " + this.firstName + " " + this.lastName + ", " + greeting2
  );
}

invite.apply(employee1, ["Hello", "How are you?"]); // Hello John Rodson, How are you?
invite.apply(employee2, ["Hello", "How are you?"]); // Hello Jimmy Baily, How are you?
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

- Call and Apply are pretty much interchangeable. Both execute the current function immediately. You need to decide whether it’s easier to send in an array or a comma separated list of arguments. You can remember by treating Call is for comma (separated list) and Apply is for Array.

- Bind creates a new function that will have this set to the first parameter passed to bind().

## Higher order functions

HOF are those functions which operates on other functions
Two types of HOF:

1. __Taking function as argument__ most commonly used. Eg map, filter
2. __Returning function__ less frequently used

## Pure functions

Pure function follows two rules

1. __No side effects:__ does not change state or variable outside its scope.
2. __Deterministic scope:__ for same input set it should return same output
Charateristics
3. __Referential transparency:__ if function is replaced with its output value, it should not affect behaviour of program.
4. __Immutability:__ do not modify passed arguments

## Scoping

### let and const scoping

- __block__ Anything withing curly braces
- let and const follow block level scoping

```js
{let a = 10}
console.log(a) //error
```

- __global & window__ both reference same object. `window` used in context of browser and `global` in context of node application.

- __globally scoped variable__ if let and const are not inside any block then they are inside _global or window_ block. It means they can accessed by another script using same application.

- __precedence__ nearest scoped variable is used first then look for outer scoped variable

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
- __precedence__ nearest scoped variable is used first then look for outer scoped variable

## Hoisting

- Behaviour of javascript which moves variable or function definition (not declaration) to top of its scope.
- Only var follow hoisting, let and const does not moves on top
- use `let` or `const` to prevent hoisting.

```js
console.log(a) //undefined
var a = 10
```

### Temporal dead zone

- Behaviour of js which hoist `let` and `const` variables and function but unlike `var` they is not initialized by `undefined` resulting in `ReferenceError`.
- TDZ starts from starting of enclosed block to the line where variable is declared

```js
function show(){
    // ...TDZ
    let a = 10;
}
```

## Closures

- Closure is method of keeping scope of outer function available to inner function even outer function is executed.  
- Closure exist if there is function inside a function.

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

this will create three instance of `i` for each iteration. so output will be `0 1 2`

```js
for(var i=0; i<3; i++){
  setTimeout(function() {console.log(i)}, 10);
}
```

this will create single instance of `i` which will be updated by each iteration. so output will be `3 3 3`.

## Array

### Array HOF

| HOF |Return | Description |
|------|------|------|
| `map` | Array | returns new array with elements return by callback functions |
| `filter` | Array | returns new array with elements for which callback returns true |
| `forEach` | Undefined | same as map but does not return new array |
| `reduce` | Value | returns single value by operating on each element |
| `some` | Boolean | return true if for any element callback returns true |
| `every` | Boolean | return true if for all element callback returns true |
| `find` | Single element | returns first element for which callback returns true |
| `findIndex` | Single index | same as find but returns index instead of element |
| `findLast` | Single element | returns last element for which callback returns true |
| `findLastIndex` | Single index | same as findLast but returns index instead of element |

### reduce

callback function in reduce take one extra argument known as __accumulator (acc)__ .
Accumulator will store value performed on each element of array.

```js
const total = arr.reduce((acc,ele)=>{
    acc += ele;
    return acc;
});
```

### Array methods

| __Method Name__         | __Parameters__                          | __Return Value__                              | __Details__                                                                 |
|--------------------------|------------------------------------------|-----------------------------------------------|------------------------------------------------------------------------------|
| __`Array.from()`__       | `arrayLike`, _`mapFn`, `thisArg`_       | A new array.                                 | Creates a new array from an array-like or iterable object.                  |
| __`Array.of()`__         | `...elements`                           | A new array.                                 | Creates a new array with the given arguments as elements.                   |
| __`Array.isArray()`__    | `value`                                 | `true` or `false`.                           | Checks if the given value is an array.                                      |
| __`push()`__             | `...elements`                           | The new length of the array.                 | Adds one or more elements to the end of an array.                           |
| __`pop()`__              | _(none)_                                | The removed element or `undefined`.          | Removes the last element from an array.                                     |
| __`unshift()`__          | `...elements`                           | The new length of the array.                 | Adds one or more elements to the beginning of an array.                     |
| __`shift()`__            | _(none)_                                | The removed element or `undefined`.          | Removes the first element from an array.                                    |
| __`splice()`__           | `start`, _`deleteCount`, `...items`_    | An array containing the removed elements.    | Adds or removes elements from an array at the specified index.              |
| __`concat()`__           | `...arrays`                             | A new array.                                 | Merges two or more arrays into a new array.                                 |
| __`at()`__               | `index`                                 | The element at the specified index or `undefined`. | Returns the element at the specified index (supports negative indices).     |
| __`indexOf()`__          | `searchElement`, _`fromIndex`_          | The index of the element or `-1`.            | Returns the first index of the element or -1 if not found.                  |
| __`lastIndexOf()`__      | `searchElement`, _`fromIndex`_          | The last index of the element or `-1`.       | Returns the last index of the element or -1 if not found.                   |
| __`includes()`__         | `searchElement`, _`fromIndex`_          | `true` or `false`.                           | Checks if the array contains a specific element.                            |
| __`sort()`__             | _`compareFunction`_                    | The sorted array (in place).                 | Sorts the elements of an array in place.                                    |
| __`reverse()`__          | _(none)_                                | The reversed array (in place).               | Reverses the order of elements in an array.                                 |
| __`flat()`__             | _`depth`_                              | A new flattened array.                       | Flattens a nested array up to the specified depth (default is 1).           |
| __`slice()`__            | _`start`, `end`_                       | A new array containing the extracted elements.| Returns a shallow copy of a portion of an array into a new array.           |
| __`copyWithin()`__       | `target`, `start`, _`end`_              | The modified array.                          | Copies part of an array to another location in the same array.              |
| __`fill()`__             | `value`, _`start`, `end`_              | The modified array.                          | Fills elements in the array with a static value.                            |
| __`join()`__             | _`separator`_                          | A string of joined elements.                 | Joins all elements into a string with a specified separator (default is a comma). |
| __`toString()`__         | _(none)_                                | A string of array elements separated by commas.| Converts the array into a comma-separated string.                           |
| __`toLocaleString()`__   | _(none)_                                | A locale-specific string.                    | Converts the array into a locale-specific string representation.            |
| __`entries()`__          | _(none)_                                | An iterator of key-value pairs.              | Returns an iterator with key-value pairs for each index.                    |
| __`keys()`__             | _(none)_                                | An iterator of keys (indices).               | Returns an iterator with keys (indices) of the array.                       |
| __`values()`__           | _(none)_                                | An iterator of values.                       | Returns an iterator with values of the array.                               |

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

1. __pending__ - waiting for operation completion
2. __fulfilled__ - operation completed successfully and returned value
3. __rejected__ - operation failed

### create promise

__walkthrough__  

1. Creating promise means wrapping asynchronous operation in promise object.
2. `Promise()` constructor - is used for creating promises.  
3. executor - function passed as parameter in constructor which conatins async operation.
4. resolve, reject - functions passed in executor which are called once async operation is completed or failed.
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
3. `finally()` takes a function which is executed always either resolved or rejected.

### promise chaining

multiple promise can be chained if we want to execute only if first one is completed.  
We can chain using mutiple `.then()` where function in previous `then()` return a promise.

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
    - __format__ YYYY-MM-DDTHH:MM:SS:MMMZ
    - __T__ represent separator, time start after that
    - __Z__ represent timezone z - UTC
2. `const date = new Date(n);`
    - returns date after n miliseconds from unix epoch (1970-01-01T00:00:01.001Z)
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

1. Date can be compared using comparisor operator (<,>,<=,>=,==) or by converting in milliseconds using `getTime()`.

### formatting date

1. `date.toDateString()` Mon May 15 2024
2. `date.toTimeString()` 12:00:00 GMT+0000 (Coordinated Universal Time)
3. `date.toISOString()` 2024-05-15T12:00:00.000Z

## Client side storage

### types of storages

1. __local storage__  accessed with `localStorage`
2. __session storage__ accessed with `sessionStorage`
3. __cookies__ accessed with `document.cookie`

|          | cookies | local storage | session storage |
|----------|----------|----------|----------|
|__capacity__| 4KB | 10MB | 5MB |
|__Browser__| HTML4/HTML5 | HTML5 | HTML5 |
|__Accessible from__| Any window | Any window | same tab |
|__Expires__| Manually set | Manually set | Tab close |
|__Storage Location__| Browser/Server | Browser | Browser |
|__Sent with request__| Yes | No | No |

1. localStorgae
    - `localStorage.setItems('key','value')` takes two parameter, key and value string
    - `localStorage.getItems('key')` takes one parameter key
    - `localStorage.removeItems('key')`

2. sessionStorage
    - `sessionStorage.setItems('key','value')` takes two parameter, key and value string
    - `sessionStorage.getItems('key')` takes one parameter key
    - `sessionStorage.removeItems('key')`

3. cookies
    - `document.cookie = 'name=shri; expires'+new Date(2025,1,1).toUTCString()`

## DOM manipulation

### Accessing element

1. __document.getElementById()__ takes id and return an element.
2. __document.getElementByClassName()__ takes class name and return array of element.
3. __document.getElementByTagName()__ takes tag name and return array of element.
4. __document.querySelector()__ takes css selector(tag, .class, #id) and return first matched element.
5. __document.querySelector()__ takes css selector(tag, .class, #id) and return first matched element.
6. __document.querySelectorAll()__ takes css selector(tag, .class, #id) and return array of matched element.

### Modifying element content

After selecting element with above methods we can change its content.

```[javascript]
let,
const element = document.getElementById('myId')
```

1. __element.innerHTML__ get or set inner html content.
    - `console.log(element.innerHTML)` // `<p>this is para</p>`
    - `element.innerHTML = <h1>para changed to heading</h1>`
2. __element.textContent__ get or set text content inside tag and its children .
    - `console.log(element.textContent)` // `this is para`
3. __element.innerText__ similar to textContent but also consider css styles. It repaints html based on css and return text content of only visible elements.

### Modifying element attributes

Change element attributes like src, href etc

1. __element.setAttribute(attr, val)__ takes attributes and its value and set it element.
    - `element.setAttribute('src','image.jpg');`
2. __element.getAttribute(attr)__ takes attributes and return its value.
    - `element.getAttribute('src');` //image.jpg
3. __element.removeAttribute(attr)__ takes attributes and remove that attribute.
    - `element.removeAttribute('src');`

### Modifying element style

change inline style of element
`element.style.cssPropertyName`

1. __`element.style.cssPropertyName`__ set value of a css property
    - `element.style.color = 'red'`
2. __`element.classList`__
    1. `element.classList.add('new_class1','new_class2')`
    2. `element.classList.remove('class1','class2)`
    3. `element.classList.toggle('myClass')` if myclass is present then it remove it else add it
        1. `element.classList.toggle('myClass', true)` add the class
        2. `element.classList.toggle('myClass', false)` remove the class
    4. `element.classList.contains('class1')` returns true if class present else false.
    5. `element.classList.replace('old-class','new-class')`
    6. `element.classList.item(0)` or `element.classList[0]`
    7. `element.classList.length` gives number of classed in the element.

### Creating and insert element

1. `document.createElement('tagname')` take tagname and return element created
2. `element.appendChild(newElement)` append child to parent element.

### Event Handling

Manipulating dom element in response to user action

1. `element.addEventListener('click',handleClick)`
1. `element.removeEventListener('click',handleClick)`

## Events

- __Events:__ things that happen in system which is told to code and code react accordingly
- __Event fire:__ when event is fired in browser window, it is attached to element present in browser.
- __Event listener:__ is a object which listens for event fire and calls event handler once event is fired.
- __Event handler:__ block of code or function which execute as reaction to event fire.

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
- if multiple event listener is added to an element then all be executed orderly.

```js
myElement.addEventListener("click", functionA);
myElement.addEventListener("click", functionB);
```

- Some event are available for all elements such as `click`
- Some event are element specific such as `play` event is only available for `<video>` element.
- __remove event listeners:__ if event listerners is added to any element it can be removed using `btn.removeEventListener()`

#### event handler properties

objects that can fire events usually have property starting with `on` followed by name of event.

```js
btn.onclick(handleBtnClick);
```

- Unlike addEventListener, event handler properties can not handle multiple event handlers

```js
element.onclick = function1;
element.onclick = function2;
```

- Here function2 will overwrite function1 handler

#### Inline event handlers _(Not recommended)_

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
- `e.preventDefault()` prevent default event of element such as submit button of form.

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
- to handle asynchronous operations __event loop__ is used.

### working for event loop

- __Call Stack__ contains job which is currently being executed. call stack can have one job at a time. If function in call stack call inner fuction then inner function is added to top of call stack.
- __Task queue__ contains all the job that is to be executed line by line.
- __Web API__ if any async operations is encountered by call stack then it delegated to web api to handle it (dom request, network request etc) and moves to another job from task queue.
- __callback queue__ one web api finish task it pushes callback function to callback queue.
- Event loop constantly check if call stack is empty (that is after finishing task queue) then it pushes job from callback queue.

## Performance calculator

```js
let startTime = performance.now();
let endTime = performance.now();
let timeElapsed = endTime - startTime;
```

## Drag Events

- __draggable__ attribute of element is set true to make is draggable element.

```html
<div draggable="true">

</div>
```

| Events | Applicable on | Details |
|---------|-------------|----------|
| `onDragStart` | draggable element | triggered when dragging started|
| `onDrag` | draggable element | continously run when dragged |
| `onDragEnd` | draggable element | when element is released |
| `onDragEnter` | Other element | when draggable element enter other target element|
| `onDragOver` | Other element | continoulsy run when draggable element is hovered over target|
|`onDragLeave` | Other element | runs when draggable element leaves target|
| `onDrop` | Other element | when element is dropped on target|

### Execution order

`onDragStart` -> `onDrag` -> `onDragEnter` -> `onDragOver` -> `onDragLeave` -> `onDrop` -> `onDragEnd`

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
