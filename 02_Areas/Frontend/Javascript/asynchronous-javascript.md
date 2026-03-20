# Asychronous Javascript

## Event Loop

- Javascript is single threaded, synchronous by nature.
- to handle asynchronous operations **event loop** is used.

### working for event loop

- **Call Stack** executes current job. Async operations are delegated.
- **Task queue** contains all the job that is to be executed line by line.
- **Web API** handles async operations (DOM, network) from call stack.
- **callback queue** receives callback functions from Web API.
- Event loop pushes callbacks when call stack empties.

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
