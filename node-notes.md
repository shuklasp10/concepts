# Web Developemnt Notes: Node

## Table of Contents
- [Introduction](#introduction)
- [Events and Callbacks](#events-and-callbacks)
- [File system](#file-system)
- [Express](#express)
- [Routing](#routing)
- [Middleware](#middleware)


## Introduction
- __Node__ It is an open-source, server-side JavaScript runtime environment.
- __nvm__ is used to manage nodejs version and switch them.
- In a directory entry point always will be ```index.js``` and can be run by ```node .``` command.

## Events and Callbacks

__event__ signal something happening in the system and __callback__ are executed in response.

### EventEmitter
Build in class to emit events using ```emit(eventName)``` method. Objects that can emit events inherit from EventEmitter class.

### EventListeners
Functions that wait for emitting events and after that execute callback function using ```on(eventName, callback)``` method.

```[javascript]
const EventEmitter from 'events';

const emitter = new EventEmitter()

emitter.on('start',()=>{
    console.log('Process started');
})

emitter.emit('start');
```
### Notes
1. Nodejs work on __event-drive arcitecture__ for asynchrnous programming.
2. When event is emitted all listener function are called synchronously.

## File system
__fs module__ in allows nodejs to work with file on the system.

### Reading File
Reading file synchronously - _Blocks further execution of code until reading is completed_
```
const fs = require('fs');

const data = fs.readFileSync('./input.txt','utf-8');
console.log(data);
console.log('reading completed');
```
Reading file asynchronously - doesn't block execution instead executes callback fucntion upon completion
```
fs.readFile('input.txt','utf-8',(err, data)=>{
    console.log(data);
})
console.log('this will execute first');
```

## Express
Express module is framework to build web applications and APIs

### Configure .env file
__dotenv__ module is used to get environment variables from .env file.
dotenv need to be configured at top of index file.
```
//index.js
require('dotenv').config()
```

### creating a web server with express

```
//index.js
require('dotenv').config();
const express = require('express');

const app = express();

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`);
});
```

## Routing
handles http methods and execute RESTful APIs
```
app.method_name('path',(req,res)=>{
    ..code
})
```
- __GET__ - Retrieves data from the server

- __POST__ - Submits data to the server to create a new resource.

- __PUT__ - Updates an existing resource on the server. Used to replace existing resource.

- __DELETE__ - Removes a resource from server

- __PATCH__ - Partially updates an existing resource. PATCH: Partially updates an existing resource.

- __HEAD__ - Retrieves the headers of a resource. Useful for checking the metadata of a resource, such as its content type or modification date.

- __OPTIONS__ - Used to determine which HTTP methods and headers are supported by a server.

## Middleware
It process incoming request before reaching to route handlers.  
Used to perform tasks such as logging, authentication, data parsing, error handling.

```
const express = require('express');

const app = express();

// err is optional
const logger = (err, req, res, next) => {
    console.log('Incoming request',req.method, req.url);
}

app.use(logger);

app.get('/',(req,res)=>{
    console.log('this will print after logger');
    res.status(200).send(data);
})

app.listen(5000, () => {
    console.log('server is running);
}).
```

