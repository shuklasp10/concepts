# Web developement Notes: Javascript

## Table of Contents
- [Higher order function](#higher-order-function)
- [Pure functions](#pure-functions)
- [Scoping](#scoping)
- [Closures](#closures)
- [Types of Array HOF](#types-of-array-hof)
- [Promises](#promises)
- [Date in javascript](#date-in-javascript)
- [Client side storage](#client-side-storage)
- [DOM manipulation](#dom-manipulation)
- [Events](#events)
- [Middleware](#middleware)

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
1. __Referential transparency:__ if function is replaced with its output value, it should not affect behaviour of program.
2. __Immutability:__ do not modify passed arguments

## Scoping

### let and const scoping
* __block__ Anything withing curly braces
* let and const follow block level scoping
```
{let a = 10}
console.log(a) //error
```

* __global & window__ both reference same object. `window` used in context of browser and `global` in context of node application.

* __globally scoped variable__ if let and const are not inside any block then they are inside _global or window_ block. It means they can accessed by another script using same application.

* __precedence__ nearest scoped variable is used first then look for outer scoped variable
```
let a = 10;
{
    let a = 8;
    console.log(a); //8
}
```

### scope for var
* var does not follow block level scoping
```
if(true){ var a = 10 }
console.log(a) //10
```
* It attach to parent object in which it is declared. like function, object .
* __precedence__ nearest scoped variable is used first then look for outer scoped variable

## Closures
- Closure is method of keeping scope of outer function available to inner function even outer function is executed.  
- Closure exist if there is function inside a function.

```
function outer(){
    let i = 10;
    return inner(){console.log(i)}
}
var show = outer();
show(); //10
```
__Keypoints__
1. Closure variable gets updated if it is changed in inner function.
```
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
```
for(let i=0; i<3; i++){
  setTimeout(function() {console.log(i)}, 10);
}
```
this will create three instance of `i` for each iteration. so output will be `0 1 2`
```
for(var i=0; i<3; i++){
  setTimeout(function() {console.log(i)}, 10);
}
```
this will create single instance of `i` which will be updated by each iteration. so output will be `3 3 3`.

## Types of Array HOF
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

### reduce
callback function in reduce take one extra argument known as __accumulator (acc)__ .
Accumulator will store value performed on each element of array.

```
const total = arr.reduce((acc,ele)=>{
    acc += ele;
    return acc;
});
```


## handling input on key press
```
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
```
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

```
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
    * returns current date and time with ISO 8601 format.
    * __format__ YYYY-MM-DDTHH:MM:SS:MMMZ
    * __T__ represent separator, time start after that
    * __Z__ represent timezone z - UTC 
2. `const date = new Date(n);`
    * returns date after n miliseconds from unix epoch (1970-01-01T00:00:01.001Z)
    * `new Date(0)` - (1970-01-01T00:00:00.000Z)
    * `new Date(1)` - (1970-01-01T00:00:00.001Z)
    * `new Date(1001)` - (1970-01-01T00:00:01.001Z)
3. `const date = new Date(yr,m,d,hr,min,sec)`;
    * month is 0-indexed so 0-jan, 1-Feb, 11-Dec

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
1. `date.setMonth(date.getMonth() + 1);`
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
    * `localStorage.setItems('key','value')` takes two parameter, key and value string
    * `localStorage.getItems('key')` takes one parameter key
    * `localStorage.removeItems('key')`

2. sessionStorage
    * `sessionStorage.setItems('key','value')` takes two parameter, key and value string
    * `sessionStorage.getItems('key')` takes one parameter key
    * `sessionStorage.removeItems('key')`

3. cookies
    * `document.cookie = 'name=shri; expires'+new Date(2025,1,1).toUTCString()`

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
    * `console.log(element.innerHTML)` // `<p>this is para</p>`
    * `element.innerHTML = <h1>para changed to heading</h1>`
2. __element.textContent__ get or set text content inside tag and its children .
    * `console.log(element.textContent)` // `this is para`
3. __element.innerText__ similar to textContent but also consider css styles. It repaints html based on css and return text content of only visible elements.

### Modifying element attributes
Change element attributes like src, href etc

1. __element.setAttribute(attr, val)__ takes attributes and its value and set it element.
    * `element.setAttribute('src','image.jpg');`
2. __element.getAttribute(attr)__ takes attributes and return its value.
    * `element.getAttribute('src');` //image.jpg
3. __element.removeAttribute(attr)__ takes attributes and remove that attribute.
    * `element.removeAttribute('src');`

### Modifying element style
change inline style of element 
`element.style.cssPropertyName`
1. __`element.style.cssPropertyName`__ set value of a css property
    * `element.style.color = 'red'`
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
* __Events:__ things that happen in system which is told to code and code react accordingly
* __Event fire:__ when event is fired in browser window, it is attached to element present in browser.
* __Event listener:__ is a object which listens for event fire and calls event handler once event is fired.
* __Event handler:__ block of code or function which execute as reaction to event fire.
### Adding event listeners
There are three ways to add event listeners to an element.
1. `addEventListener`
2. event handler properties
3. inline event handlers
#### addEventListener
```
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
* Objects should have event listener to listen if event is fired.
* if multiple event listener is added to an element then all be executed orderly.
```
myElement.addEventListener("click", functionA);
myElement.addEventListener("click", functionB);
```
* Some event are available for all elements such as `click`
* Some event are element specific such as `play` event is only available for `<video>` element.
* __remove event listeners:__ if event listerners is added to any element it can be removed using `btn.removeEventListener()`

#### event handler properties
objects that can fire events usually have property starting with `on` followed by name of event.
```
btn.onclick(handleBtnClick);
```
* Unlike addEventListener, event handler properties can not handle multiple event handlers
```
element.onclick = function1;
element.onclick = function2;
```
* Here function2 will overwrite function1 handler

#### Inline event handlers _(Not recommended)_
`<button onclick="bgChange()">Press me</button>`
* here onclick attribute value is purely javascript code.

### Events objects
* Objects that are automatically passed to event handlers
```
const btn = document.querySelector("button");
function handler(event){
    console.log(event);
    console.log('button is clicked)
}
btn.addEventListener('click',handler);
```
* `e.target` return element itself
* `e.preventDefault()` prevent default event of element such as submit button of form.

### Events in NodeJS
* `events` library used for working with events
* `EventEmitter` class used to emit events
```
const EventEmitters = require('events');

const myEmitter = new EventEmitter();
```
* `on` method used to add event listeners
```
myEmitter.on('eventName',handlerFunction);
```
* `emit` method to emit or trigger event
```
myEmitter.emit('eventName');
```
* `once` same as `on` but event can be fired only once.

## Middleware


##