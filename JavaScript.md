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


## Higher order functions
HOF are those functions which operates on other functions
Two types of HOF:
1. __Taking function as argument__ most commonly used. Eg map, filter
2. __Returning function__ less frequently used

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