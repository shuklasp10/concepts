# Asychronous Javascript

## Event Loop

> Javascript runtime mechanism to enable asynchronous operations.

### Core topics

- **Call Stack** - Executes synchronous code in order. Processes one function at a time using LIFO (Last In, First Out) principle.
- **Web/Runtime API** - Browser or Node.js APIs that handle asynchronous operations (not part of JavaScript engine itself).
- **Task Queue (Macrotask/Callback Queue)** - Holds callbacks from macrotasks like `setTimeout`, `setInterval`, and I/O operations.
- **Microtask Queue** - Higher priority queue for microtasks like Promise callbacks and `queueMicrotask()`. Executes completely before any macrotask.
- **Event Loop** - Coordinates execution flow. Monitors call stack; when empty, executes all microtasks first, then one macrotask, then repeats.

### Execution sequence

```javascript
if (call stack empty):    
	run ALL microtasks
	then run ONE macrotask   
```

> Per event loop cycle, after finishing all microtasks, the engine picks one macrotask, executes it completely, then pauses and re-evaluates.
>
> 👉 **why one macrotask?** To prevent starvation of:
>
> 1. UI updates (in browser)
> 2. I/O callbacks
> 3. rendering
>
> If JS ran all macrotasks at once:
>
> 1. UI could freeze
> 2. long queues would block everything

### Async Task Lists

**Microtask Queue:** `Promise`, `queueMicrotask`, MutationObserver, process.nextTick (highest priority)

**Macrotask Queue:** Timers, DOM Events, I/O operations (Node.js), setImmediate (Node.js)

## Promises

Object in javascript to handle asynchronous operation.Promise represents a value that may be present now, in future or never.

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

multiple promises can be chained if first completes successfully.Chain using multiple `.then()` where each returns a promise.

```js
myProm1.then(()=>{
    return myProm2
}).then(()=>{
    return myProm3
})
```

### keypoints

1. async functions return promise