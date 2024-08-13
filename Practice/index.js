const EventEmitter = require('events');

const myEmitter = new EventEmitter();
myEmitter.once('fire',()=>{
    console.log('event is fired');
})
myEmitter.emit('fire')
myEmitter.emit('fire')
