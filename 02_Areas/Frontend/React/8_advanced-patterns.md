# Advanced Patterns & Architecture

## Core Idea

> Beyond basic state and components, React provides advanced patterns for sharing logic, handling edge cases, and optimizing large-scale applications (like Server-Side Rendering and Concurrent Mode).

---

## 1. Controlled vs Uncontrolled Components

### Problem It Solves
Form inputs natively hold their own state in the DOM (what you type into an `<input>` is stored in the browser). React needs a way to manage or access that data.

### Controlled Components
React completely controls the state of the input. The input's `value` is tied to a React state variable, and every keystroke triggers an `onChange` event to update that state.
- **Mental Model:** React is a **helicopter parent**. It must approve and store every single change the child (input) makes.
- **Benefit:** Instant validation, formatting, and a single source of truth.

### Uncontrolled Components
The DOM maintains its own state. React only accesses the value when needed (like on form submit) using a `useRef`.
- **Mental Model:** React is a **hands-off parent**. It lets the input do its thing, and only checks in on it when absolutely necessary (submission).
- **Benefit:** Less code, better performance for massive forms.

---

## 2. Patterns for Sharing Logic (HOCs & Render Props)

Before Custom Hooks existed, React relied on complex patterns to share logic.

### Higher-Order Components (HOC)
A function that takes a component as an argument and returns a new, enhanced component.
- **Mental Model:** A **phone case**. You take a regular phone (Component), put it in an armored case (HOC), and now you have an armored phone (Enhanced Component).
- **Example:** `withRouter(MyComponent)` or `connect(mapStateToProps)(MyComponent)`.
- **Modern Alternative:** Mostly replaced by Custom Hooks.

### Render Props
A pattern where a component accepts a function as a prop (often called `render` or `children`) and uses it to know what to render, passing internal state to it.
- **Modern Alternative:** Replaced by Custom Hooks, which avoid the deeply nested "wrapper hell" of render props.

---

## 3. Portals in React

### Problem It Solves
When building Modals, Tooltips, or Dropdowns, CSS properties like `overflow: hidden` or `z-index` on parent containers can clip or hide your elements.

### How It Works
`ReactDOM.createPortal(child, container)` allows you to render a component's HTML outside of its parent DOM hierarchy (usually appending it directly to `document.body`), while keeping it inside the React Component hierarchy (so context and events still bubble up).

- **Mental Model:** A **wormhole**. The component lives in the parent's house logically, but it visually projects its physical body into a completely different neighborhood.

---

## 4. Error Boundaries

### Problem It Solves
If a JavaScript error occurs during rendering in a React component, it corrupts React's internal state and unmounts the entire component tree (showing a blank white screen).

### How It Works
Error Boundaries are **Class Components** (there is no hook equivalent yet) that implement `componentDidCatch` or `getDerivedStateFromError`. They act like a `try/catch` block for the UI.

- **Mental Model:** A **fuse box**. If one room (component) draws too much power and shorts out, the fuse blows, preventing the entire house (app) from catching fire. You show a fallback UI (e.g., "Something went wrong") instead of a blank screen.

---

## 5. Client-Side vs Server-Side Rendering (CSR vs SSR)

### Client-Side Rendering (Standard React)
- **Flow:** Browser asks for page → Server sends a blank HTML file + a massive JS bundle → Browser downloads JS → React executes and builds the UI.
- **Pros:** Fast interactions after the initial load. Cheap to host.
- **Cons:** Slow initial load (user sees blank screen while JS downloads). Terrible for SEO (search engine bots see a blank page).

### Server-Side Rendering (Next.js/Remix)
- **Flow:** Browser asks for page → Server executes React, fetches data, and generates a fully populated HTML page → Sends it to browser (User sees content instantly) → Browser downloads JS in the background.
- **Pros:** Incredible SEO. Fast First Contentful Paint (FCP).
- **Cons:** Higher server costs. More complex architecture.

### Hydration
When the server sends the pre-rendered HTML in SSR, it is "dry" (static). **Hydration** is the process where React runs in the browser, attaches event listeners (like `onClick`), and links up the state, bringing the static HTML "to life".

---

## 6. React 18: Concurrent Rendering & Suspense

### Concurrent Rendering
Historically, once React started rendering, it could not be interrupted. If rendering a huge list took 200ms, the browser was locked.
**Concurrent Mode** allows React to prepare multiple versions of the UI in the background. It can pause a heavy render, handle a high-priority event (like typing in an input), and then resume the heavy render without freezing the UI.

### Suspense
`<Suspense fallback={<Spinner />}>` lets you declaratively "wait" for something (like lazy-loaded code or data fetching) and show a fallback UI in the meantime. 

---

## Interview Perspective

**Q: Explain controlled vs uncontrolled components.**
- **Controlled:** Form data is handled by React state (`value` and `onChange`). React is the single source of truth.
- **Uncontrolled:** Form data is handled by the DOM itself. You read values using a `useRef`.

**Q: What are higher-order components (HOC)?**
A function that takes a component and returns a new, enhanced component. Used heavily in older React to share logic (e.g., `withRouter(MyComponent)`), but mostly replaced by Custom Hooks.

**Q: What are render props?**
A pattern where a component receives a function as a prop that returns a React element, allowing the component to share its internal state with the parent. (Largely replaced by hooks).

**Q: What are portals in React?**
`createPortal` allows you to render a child node into a different part of the DOM tree (e.g., `document.body`), breaking out of `overflow: hidden` constraints. Crucial for Modals and Tooltips. (Equivalent to Vue's `<Teleport>`).

**Q: What are Error Boundaries?**
Class components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the whole app. (No functional component hook equivalent yet).

**Q: Difference between client-side rendering and server-side rendering?**
- **CSR:** Browser downloads a blank HTML page and a huge JS bundle. React builds the UI in the browser. (Slower initial load, bad SEO).
- **SSR:** Server executes React, sends a fully populated HTML page to the browser. (Fast initial load, great SEO).

**Q: What is hydration in React?**
The process where React attaches event listeners and state to the static HTML that was generated by Server-Side Rendering (SSR), bringing it "to life".

**Q: What is Concurrent Rendering in React 18?**
A new behind-the-scenes mechanism (powered by Fiber) that allows React to prepare multiple versions of the UI at the same time. It makes rendering interruptible, meaning high-priority updates (typing) aren't blocked by heavy background renders.

**Q: Explain Suspense in React.**
A component `<Suspense fallback={<Spinner />}>` that lets you declaratively "wait" for some code (like `React.lazy`) or data to load, showing a fallback UI in the meantime.

---

## Key Takeaways
- **Controlled inputs** use state; **Uncontrolled inputs** use refs.
- **Portals** are the standard way to build Modals.
- **Error Boundaries** act like a `try/catch` for component rendering.
- **SSR** generates HTML on the server for better SEO, while **Hydration** attaches interactivity on the client.
- **Concurrent Mode** makes React interruptible, ensuring heavy renders don't block user input.
