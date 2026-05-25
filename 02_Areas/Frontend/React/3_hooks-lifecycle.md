# Hooks & Component Lifecycle

## Core Idea

> Hooks allow function components to "hook into" React features like state and lifecycle methods. Before hooks, these features were only available in Class components.

## The Problem with Class Components

### Problem It Solves

Before React 16.8 (when Hooks were introduced), if a component needed state or lifecycle methods (`componentDidMount`, `componentWillUnmount`), you had to write a Class component. 

**Limitations of Classes:**
1. **Scattered Logic:** Code for a single feature (e.g., subscribing to a chat) was split across `componentDidMount` (to subscribe) and `componentWillUnmount` (to unsubscribe).
2. **`this` Keyword Confusion:** JavaScript's `this` is notoriously tricky. You had to constantly `.bind(this)` to event handlers.
3. **Hard to Reuse Logic:** Sharing stateful logic required complex patterns like Higher-Order Components (HOCs) or Render Props, resulting in "wrapper hell" (deeply nested component trees).

### The Solution: Hooks

Hooks solve this by letting you use state and side-effects in simple JavaScript functions, organizing code by **logical concern** rather than by lifecycle timing.

> **Mental Model:** Think of Hooks as **plugins** you attach to a functional component to give it superpowers (memory, ability to fetch data, etc.).

---

## The Rule of Hooks

1. **Only call Hooks at the top level:** Do not call them inside loops, conditions, or nested functions. React relies on the order in which Hooks are called to keep track of state between renders.
2. **Only call Hooks from React Functions:** Call them from standard functional components or custom hooks.

### What happens internally when hook order changes?
React uses an internal array (or linked list in Fiber) to track hooks for each component. When you call `useState`, React reads the current index in the array, returns that state, and increments the index. 
If a hook is placed inside an `if` statement and gets skipped, the index gets misaligned. Subsequent hooks will read the wrong state from the array, causing catastrophic bugs or app crashes.

---

## `useState`: Memory for Components

### Core Idea

`useState` allows a component to remember values between renders. 

```jsx
const [count, setCount] = useState(0);
```

### Mental Model

- **`useState`** is a box with a label on it. 
- You give it an initial value (`0`).
- It gives you back two things: the current value in the box (`count`), and a magic button to replace the value (`setCount`).
- **Crucial:** Pressing the magic button (`setCount`) doesn't just change the value; it **tells the chef (React) to re-cook (re-render) the meal (component)**.

### The "Stale Closure" Problem

Because state is a snapshot, asynchronous operations might read old state.

```jsx
const [count, setCount] = useState(0);

function handleAsyncClick() {
  setTimeout(() => {
    // If user clicked 5 times quickly, this might still read `0`
    setCount(count + 1); 
  }, 1000);
}
```

**Solution:** Functional Updater
```jsx
// React passes the *actual* most recent state to the callback
setCount(prevCount => prevCount + 1);
```

---

## `useEffect`: Synchronizing with External Systems

### Problem It Solves

Components often need to talk to things outside of React: fetching data from an API, subscribing to a websocket, or manually manipulating a DOM element. These are called **Side Effects**. `useEffect` is where you put this code.

### Step-by-Step Breakdown

```jsx
useEffect(() => {
  // 1. SETUP: This runs after the component is added to the DOM
  const connection = createConnection(serverUrl);
  connection.connect();

  // 2. CLEANUP (Optional): This runs before the component is removed, 
  // or before the setup runs again.
  return () => {
    connection.disconnect();
  };
}, [serverUrl]); // 3. DEPENDENCIES: Only re-run if this changes
```

### Dependency Array Rules

| Dependency Array | Behavior | Mental Model |
|------------------|----------|--------------|
| `undefined` (No array) | Runs after **every** render | "I want this to happen constantly, every time the UI updates." |
| `[]` (Empty array) | Runs **only once** on mount | "I want this to happen exactly once when the component is born." |
| `[x, y]` | Runs on mount, and whenever `x` or `y` changes | "Keep this synchronized specifically with x and y." |

### Mental Model

Think of `useEffect` as an **Assistant**. 
- **Setup:** You tell the assistant, "Go connect to the chat server."
- **Cleanup:** You tell the assistant, "If I close this window, or if we change chat rooms, make sure you disconnect the old connection first."
- **Dependencies:** "Only do this work if the chat room ID actually changed. Don't bother if it's the same."

### Canceling API Requests
You can use the cleanup function to cancel API requests if the component unmounts before the request finishes.
```jsx
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData);

  // Cleanup aborts the fetch if unmounted
  return () => controller.abort(); 
}, []);
```

> **Vue Comparison:** `useEffect` roughly maps to Vue's `watch` combined with lifecycle hooks (`onMounted`, `onUnmounted`). Vue's reactivity system tracks dependencies automatically, whereas React requires you to manually list them in the dependency array.

---

## `useLayoutEffect` vs `useEffect`

- **`useEffect`** runs **asynchronously** *after* the browser paints the screen. (Good for 99% of cases like data fetching).
- **`useLayoutEffect`** runs **synchronously** *before* the browser paints the screen. 
Use it only when you need to read layout from the DOM (like measuring a div's width) and mutate state based on it, to prevent a visual flicker.

---

## `useReducer`

### Problem It Solves
When state logic gets complex (e.g., multiple sub-values, or the next state depends heavily on the previous state), `useState` becomes hard to manage. `useReducer` centralizes state update logic.

### How It Works
It takes a reducer function and an initial state.
```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    default: throw new Error();
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
// Usage: dispatch({ type: 'increment' })
```

---

## `useRef`: An Escape Hatch

### Problem It Solves

Sometimes you need to remember a value between renders, but you **don't** want changing that value to trigger a re-render. State (`useState`) always triggers a re-render. Variables are destroyed and recreated on every render. We need a middle ground.

### How it Works

`useRef` returns a plain JavaScript object with a single property: `{ current: initialValue }`.

```jsx
const timerId = useRef(null);
const inputRef = useRef(null);

function start() {
  // Mutating .current does NOT trigger a re-render
  timerId.current = setInterval(() => {}, 1000); 
}
```

### Common Use Cases

1. **Holding DOM Elements:** Grabbing an `<input>` to call `.focus()` on it.
2. **Mutable Instance Variables:** Storing timer IDs, previous state values, or tracking if a component is mounted.

### Mental Model

Think of `useRef` as a **safe deposit box** given to the component. 
- You can put things in the box (`ref.current = value`).
- You can take things out.
- The box persists across all renders.
- React **does not care** when you open the box. It will never re-render the component just because you changed what's inside.

---

## Custom Hooks: Reusing Logic

### Problem It Solves

If two components needed the same stateful logic (e.g., tracking window dimensions), you had to duplicate the code.

### The Solution

You can extract hooks into your own JavaScript functions, prefixing them with `use`. 

```jsx
// Custom Hook
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    function updateSize() { setSize({ width: window.innerWidth }); }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
}

// Usage in multiple components
function ComponentA() {
  const size = useWindowSize();
  return <div>{size.width}</div>;
}
```

> **Vue Comparison:** Custom Hooks are the exact equivalent of **Composables** in Vue 3 (Composition API). They both solve the problem of sharing stateful logic cleanly, replacing old patterns like Mixins (Vue) or HOCs (React).

---

## Interview Perspective

**Q: Difference between functional and class components?**
Functional components are simple JS functions that use Hooks for state and lifecycle. Class components are ES6 classes that extend `React.Component`, use `this.state`, and lifecycle methods (`componentDidMount`). Functional components are the modern standard because they are less verbose and avoid `this` binding issues.

**Q: What is the difference between `useState` and `useRef`?**
Both persist data across renders. The key difference is that updating `useState` schedules a component re-render, while mutating `useRef.current` does not. `useState` should be used for values that affect the UI; `useRef` should be used for DOM nodes or "background" instance variables (like timer IDs).

**Q: When should you use `useEffect`?**
To synchronize a component with an external system (e.g., fetching data, manual DOM manipulation, subscribing to events). 

**Q: Explain the lifecycle of `useEffect`.**
On mount, the setup function runs. On re-render (if dependencies changed), the cleanup function runs with the *old* values, then the setup runs with the *new* values. On unmount, the cleanup function runs one last time.

**Q: What problems can happen if dependencies are missing?**
The effect might capture "stale closures" (old state references) or fail to react to changes, leading to bugs where the UI is out of sync with data.

**Q: Explain stale closures in React.**
When an asynchronous function (like `setTimeout`) inside an effect captures state from an older render cycle, instead of the most current state. It is fixed by using functional state updates (e.g., `setCount(prev => prev + 1)`).

**Q: Why shouldn't you call Hooks inside conditional statements?**
React relies on the call order of Hooks to match state variables to their corresponding `useState` calls across renders. If a hook is hidden inside an `if` statement, the order changes, and React will assign the wrong state to the wrong hook, crashing the app.

**Q: What happens internally when hooks order changes?**
React tracks hooks in a linked list (or array) associated with the component instance. If a conditional hook is skipped, the index shifts, and all subsequent hooks read the wrong state from the list.

**Q: Explain custom hooks and their benefits.**
Custom hooks are regular JS functions starting with `use` that encapsulate other hooks. They allow you to extract and share stateful logic (like tracking window size or fetching data) across multiple components without adding wrapper hell.

**Q: Can you explain the purpose of the dependency array in `useEffect`?**
It tells React exactly which values the effect depends on. React compares the current values to the previous values. If none have changed, React skips running the effect, which is crucial for performance and preventing infinite loops.

---

## Key Takeaways

- **`useState`** is for data that changes and updates the UI.
- **`useEffect`** is for synchronizing with the outside world (networks, DOM, timers).
- **`useRef`** is for data that changes but *doesn't* update the UI, or for referencing DOM nodes.
- **Custom Hooks** allow you to bundle state and effects together to share logic across components.
- **Never mutate state directly**, and always respect the exhaustive dependency lint rules for `useEffect`.
