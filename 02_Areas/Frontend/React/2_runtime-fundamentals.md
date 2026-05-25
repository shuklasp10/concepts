# Runtime Fundamentals

## Core Idea

> React operates in phases. Rendering is simply React calling your components to ask "what should the UI look like?", while Committing is React actually updating the DOM to match that answer. 

## The Render and Commit Phases

### Problem It Solves

If you updated the DOM every time a variable changed, your app would be incredibly slow. DOM manipulations are the most expensive operations in the browser. React solves this by separating the calculation of the UI from the actual drawing of the UI.

### Step-by-Step Breakdown

Any UI update in React happens in three steps:

1. **Triggering** a render (someone ordered a dish).
2. **Rendering** the component (preparing the dish in the kitchen).
3. **Committing** to the DOM (placing the dish on the table).

#### 1. Triggering a Render
A render is triggered for two reasons:
- **Initial Render:** The app starts, and `root.render()` is called.
- **State Update:** A component (or its parent) updates its state using a setter function (`setCount`).

#### 2. Rendering Phase (Pure Calculation)
"Rendering" in React does **not** mean painting to the screen. It means React is calling your component functions.
- React calls your component.
- Your component returns JSX.
- React compares this new JSX with the previous JSX (this comparison process is called **Reconciliation** or Diffing).
- React creates a list of differences.

> **CRITICAL RULE:** Rendering must be **Pure**. It should only calculate the new UI. It should not change pre-existing variables, mutate the DOM, or make network requests. It takes inputs (props/state) and returns an output (JSX).

#### 3. Committing Phase (DOM Mutation)
Once React knows exactly what changed, it applies those changes to the real DOM.
- For the initial render, React uses `appendChild()` to put all DOM nodes on screen.
- For re-renders, React applies the minimal necessary operations (changing text, adding a class, swapping a node) to make the DOM match the latest render output.

After the Commit phase, the browser handles **Painting** the screen.

### Mental Model

Imagine React is a **photographer**.
1. **Trigger:** You ask for a new photo.
2. **Render:** The photographer looks through the lens, arranges the subjects, and calculates the perfect shot. (Nothing has changed in the physical album yet).
3. **Commit:** The photographer prints the photo and puts it in the album.

### What Causes a Re-render?

A component will re-render if:
1. Its **State** changes (`setState`).
2. Its **Parent** re-renders (this cascades down to all children).
3. A **Context** it consumes changes.

Notice what is missing: **Props**. A child component does not re-render *because* its props changed; it re-renders because its parent re-rendered to pass those new props down. If a parent re-renders and passes the exact same props, the child still re-renders (unless optimized with `React.memo`).

---

## State as a Snapshot

### Problem It Solves

If state mutated instantly, asynchronous operations inside a render cycle would become unpredictable. By treating state as a snapshot, React ensures consistency during a single render pass.

### How It Works Internally

When React calls your component, it passes a **snapshot** of the state for that specific render.

```jsx
const [number, setNumber] = useState(0);

// What happens if we click this button?
<button onClick={() => {
  setNumber(number + 1);
  setNumber(number + 1);
  setNumber(number + 1);
}}>+3</button>
```

### The Naive Assumption
You might think the number becomes `3`. 

### The Actual Behavior
The number becomes `1`. Why? Because during *this specific render*, `number` is `0`. 
The code above evaluates to:
```jsx
setNumber(0 + 1);
setNumber(0 + 1);
setNumber(0 + 1);
```

React batches these updates. It queues three instructions to "set the state to 1". In the next render, the snapshot of `number` will be `1`.

### Mental Model

State is not a variable that you mutate; it is a **constant value for a specific render**. Setting state does not change the existing variable; it **requests a completely new render** with a new value.

> **React vs Vue Comparison:** In Vue, state is a mutable reactive proxy. If you did `count.value++` three times synchronously, the value *would* instantly become 3, and Vue would batch the re-render. React requires you to use functional updaters if you want to read the latest queued state: `setNumber(prev => prev + 1)`.

---

## Preserving and Resetting State

### Core Idea
State is tied to a position in the **UI tree**, not to a specific component instance in memory.

### How React Tracks State

When React renders a tree, it associates state with the specific path in the tree. 
If a `<Counter />` is rendered as the first child of a `<div>`, React creates state for `div -> child[0]`.

#### Preserving State
If a component stays in the exact same position between renders, React preserves its state.

```jsx
// The state of Counter is PRESERVED when isFancy changes,
// because it remains the first child of the div in both cases.
{isFancy ? (
  <Counter isFancy={true} /> 
) : (
  <Counter isFancy={false} />
)}
```

#### Resetting State
If a component disappears, or moves to a different position, React destroys its state.

```jsx
// The state is RESET because the DOM structure changed.
// Counter moved from being a child of <div> to a child of <section>.
{isFancy ? (
  <div><Counter /></div>
) : (
  <section><Counter /></section>
)}
```

### The `key` Prop

Sometimes you *want* to force React to reset state, even if the component is in the same position (e.g., switching from a chat with Alice to a chat with Bob). You do this using the `key` prop.

```jsx
// The key tells React these are completely different components.
// When 'chatId' changes, the old state is destroyed and a new one is created.
<ChatWindow key={chatId} />
```

> **Mental Model:** A component's identity is defined by **(Component Type + Position in Tree + Key)**. Change any of these, and React treats it as a brand new component, wiping its state.

---

## React Fiber

### The Problem with Old React (Stack Reconciler)
Before React 16, React used a synchronous "Stack" reconciler. If you had a massive component tree and triggered an update, React would calculate the virtual DOM changes synchronously. It couldn't stop. If this calculation took 100ms, the browser was completely blocked for 100ms—meaning no typing, no scrolling, no animations. The app felt frozen.

### The Solution: Fiber
React Fiber is a complete rewrite of React's core rendering engine. It breaks rendering work into small units (Fibers). 

### How It Works Internally
A Fiber is essentially a JavaScript object that represents a unit of work (a component). 
Instead of a rigid call stack, Fiber acts like a **linked list**. 

Because work is broken down into small chunks, React can:
1. Start rendering a complex tree.
2. Pause the rendering if a higher-priority task comes in (like the user typing in an input).
3. Handle the typing event so the UI stays responsive.
4. Resume the previous rendering work where it left off.
5. Or throw away the previous work if it's no longer relevant.

### Mental Model

- **Old React (Stack):** A chef who starts cooking a massive 5-course meal and ignores all waiters, phone calls, and new orders until the entire meal is plated.
- **New React (Fiber):** A chef who prepares one ingredient, checks if there's an urgent ticket (like a VIP order), switches to the urgent ticket if necessary, and then goes back to the original meal.

---

## Interview Perspective

**Q: Explain reconciliation in React.**

Reconciliation is the process where React diffs the old Virtual DOM with the new Virtual DOM to figure out what changed. It then calculates the most efficient way to update the real DOM. If a component type changes (e.g., from `<div>` to `<section>`), React destroys the old DOM tree and builds a new one.

**Q: What causes a React component to re-render?**

1. The component updates its own state.
2. The component's parent re-renders (cascading effect).
3. A Context value the component is consuming changes.

**Q: What is the difference between Rendering and Committing?**
Rendering is the pure calculation of what the UI *should* look like (generating virtual DOM). Committing is the actual mutation of the real DOM to match the virtual DOM. React can render a component multiple times without committing if it's interrupted (thanks to Fiber).

**Q: Explain React Fiber architecture.**

Fiber is React's internal rendering engine. It breaks rendering work into small, interruptible chunks (fibers) organized as a linked list. This allows React to pause rendering, handle high-priority events (like user typing), and resume or discard the previous work, ensuring the UI never freezes.

**Q: Why does my state log the old value immediately after calling setState?**
Because state in React behaves like a snapshot for the current render. `setState` does not mutate the current variable; it queues an update for the *next* render. If you log the variable in the current render, it still holds the snapshot value.

**Q: How do you force a component to re-mount (reset its state)?**
Pass a unique `key` prop to the component and change that key. React uses the key as part of the component's identity. When the key changes, React unmounts the old instance and mounts a new one with fresh state.

---

## Key Takeaways

- **Render $\neq$ Paint:** Rendering is just calculating changes.
- **Renders must be pure:** Never mutate data outside the component during render.
- **State is a snapshot:** It remains constant for a given render cycle.
- **Identity matters:** Component state is tied to its position in the tree. Use `key` to reset it.
- **Fiber:** The engine that makes React interruptible, allowing it to pause heavy renders to keep the UI responsive.