# Browser and Web API

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

```javascript
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

1. **element.style.cssPropertyName** set value of a css property
   - `element.style.color = 'red'`
2. **element.classList**
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

## Drag Events

- **draggable** attribute of element is set true to make is draggable element.

```html
<div draggable="true">

</div>
```

| Events        | On Element | Details                |
| ------------- | ---------- | ---------------------- |
| `onDragStart` | draggable  | When drag starts       |
| `onDrag`      | draggable  | Continuous during drag |
| `onDragEnd`   | draggable  | When element released  |
| `onDragEnter` | target     | When over target       |
| `onDragOver`  | target     | Continuous over target |
| `onDragLeave` | target     | When leaving target    |
| `onDrop`      | target     | When dropped on target |

### Execution order

`onDragStart` -> `onDrag` -> `onDragEnter` -> `onDragOver`
-> `onDragLeave` -> `onDrop` -> `onDragEnd`

### Notes

- call `e.preventDefault()` on `onDrop` and `onDragOver` to allow dropping.
- use `dataTransfer` to transfer data between drag and drop
