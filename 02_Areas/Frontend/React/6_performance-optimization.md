# Performance Optimization

## Core Idea

> React is inherently fast, but unnecessary re-renders can slow down complex apps. Optimization in React is almost entirely about preventing child components from re-rendering or preventing heavy functions from re-calculating when their inputs haven't actually changed.

## The Re-render Cascade

### Problem It Solves

By default, when a parent component's state changes, **React re-renders the parent AND all of its children, recursively down the tree.** 
React doesn't know if the children need to update, so it plays it safe and re-renders everything. If you have a deeply nested tree or a child component that is computationally heavy to render (e.g., a massive data table), this cascade causes lag.

### The Solution: Memoization

Memoization is a caching technique. If a function is called with the exact same inputs as last time, return the cached result instead of doing the work again.

React provides three main tools for memoization:
1. `React.memo` (For entire components)
2. `useMemo` (For specific calculated values)
3. `useCallback` (For functions)

---

## The Root Problem: Referential Equality

To understand *why* we need these tools, you must understand how React compares variables.

React uses **Referential Equality** (shallow comparison) to check if a prop has changed. 
- `5 === 5` (True)
- `'hello' === 'hello'` (True)
- `[1, 2, 3] === [1, 2, 3]` (**FALSE**)
- `{ a: 1 } === { a: 1 }` (**FALSE**)
- `(() => {}) === (() => {})` (**FALSE**)

Every time a component re-renders, it recreates all objects, arrays, and functions defined inside of it. Even if they *look* identical, they are brand new references in memory. React sees a new reference and thinks, "The prop changed! I must re-render the child!"

---

## 1. `React.memo` (Memoizing Components)

### How it Works

You wrap a component in `React.memo`. React will now remember the last rendered output. When the parent re-renders, React will check the props passed to this child. If the props are *exactly* the same as last time, React skips rendering the child entirely.

```jsx
import { memo } from 'react';

const HeavyTable = memo(function HeavyTable(props) {
  /* Expensive rendering logic */
  return <table>...</table>;
});

export default HeavyTable;
```

### The Catch

If you pass an object, array, or function as a prop to `<HeavyTable />`, `React.memo` will **fail to prevent the render** because the parent recreates those objects on every render (Referential Equality failure). 

To fix this, we use `useMemo` and `useCallback`.

---

## 2. `useMemo` (Memoizing Values)

### Problem It Solves

1. Caching the result of a slow, heavy calculation (e.g., sorting 10,000 items).
2. Caching an object/array reference so it doesn't trigger child re-renders.

### Step-by-Step Breakdown

```jsx
const cachedValue = useMemo(() => {
  // 1. The calculation function
  return performHeavyCalculation(data);
}, [data]); // 2. The Dependency Array
```

React runs the function on the initial render and stores the result. On subsequent renders, it checks the dependencies (`data`). If `data` hasn't changed, React skips the function and returns the cached result.

### Solving the `React.memo` trap:
```jsx
function Parent({ darkTheme }) {
  // Without useMemo, this object gets a new memory address every render
  // With useMemo, the address stays the same unless darkTheme changes.
  const themeStyle = useMemo(() => {
    return { backgroundColor: darkTheme ? 'black' : 'white' };
  }, [darkTheme]);

  // HeavyTable (wrapped in React.memo) will now successfully skip re-renders!
  return <HeavyTable style={themeStyle} />;
}
```

---

## 3. `useCallback` (Memoizing Functions)

### Problem It Solves

Just like objects, functions are recreated on every render. If you pass a callback function (like an `onClick` handler) to a memoized child component, the child will re-render every time because the function reference changed.

### How it Works

`useCallback` is just syntax sugar for `useMemo` specifically designed for functions. It caches the function definition itself.

```jsx
// Caching a function reference
const handleClick = useCallback(() => {
  console.log("Button clicked. Product ID:", productId);
}, [productId]); 

// Equivalent using useMemo (for understanding, don't write this):
const handleClick = useMemo(() => {
  return () => console.log("Button clicked", productId);
}, [productId]);
```

### Mental Model

- `useMemo` caches the **return value** of a function. (The soup).
- `useCallback` caches the **function itself**. (The recipe for the soup).

---

## The Danger of Premature Optimization

### Trade-offs

You should **not** wrap everything in `memo`, `useMemo`, and `useCallback`. 

**Why?** 
1. **Memory Cost:** React has to store the old values in memory to compare them.
2. **Execution Cost:** React has to run the dependency comparison (`prev === next`) on every render. For simple components, this comparison is slower than just re-rendering the component!
3. **Complexity:** It makes code harder to read and maintain.

### Best Practices Before Memoizing

Before using these hooks, see if you can fix the structure first:
1. **Move State Down:** If a `hover` state only affects a button, put the state inside the `<Button>` component, not the parent `<Layout>`.
2. **Lift Content Up (Children as Props):** If a parent has heavy state, pass the non-updating UI as `children`. React knows `children` didn't change and won't re-render them.

> **Rule of Thumb:** Only use memoization if you are actually experiencing a performance problem, or if you have a component you know is undeniably expensive to render.

---

## 4. Code Splitting & Lazy Loading

### Problem It Solves
By default, tools like Webpack or Vite bundle your entire React application into one massive JavaScript file. If your app is large, the user has to download 5MB of JS before seeing anything, resulting in a slow initial load time.

### How It Works
Code splitting breaks your app into smaller "chunks". You only download the code you need for the page you are currently viewing. `React.lazy()` allows you to render a dynamic import as a regular component.

```jsx
import React, { Suspense, lazy } from 'react';

// This component is now its own separate JS file (chunk)
const HeavyDashboard = lazy(() => import('./HeavyDashboard'));

function App() {
  return (
    // Suspense shows a fallback UI while the chunk is downloading
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyDashboard />
    </Suspense>
  );
}
```

### Mental Model
Instead of forcing the user to download the entire library (the monolithic bundle) just to read one book, you only give them the book they asked for (lazy loading), and fetch other books later if needed.

---

## Interview Perspective

**Q: What is `React.memo`?**
A higher-order component that prevents a functional component from re-rendering if its props have not changed (shallow comparison).

**Q: When does `React.memo` fail to prevent re-renders?**
When the parent passes inline objects, arrays, or functions as props. Since these have new memory addresses on every parent render, `React.memo` sees them as "changed" props (referential equality failure).

**Q: How do you optimize React application performance?**
1. Move state down closer to where it's used.
2. Pass heavy UI as `children` (lift content up).
3. Use `useMemo`/`useCallback` with `React.memo` for expensive renders.
4. Code split via `React.lazy`.

**Q: What causes unnecessary re-renders?**
- State defined too high in the component tree.
- Passing new object/function references to pure components.
- Context API values changing frequently (re-renders all consumers).

**Q: What is the difference between `useMemo` and `useCallback`?**
They both cache values between renders based on dependencies. `useMemo` is used to cache the result of an expensive computation or a stable object reference. `useCallback` is used specifically to cache a function reference, usually so it can be passed as a prop to a `React.memo` optimized child component without breaking the optimization.

**Q: Why shouldn't I wrap every component in `React.memo`?**
Because shallow comparison of props takes time. If a component renders very quickly, or if its props change on almost every render anyway, the comparison overhead makes the app slower, not faster.

**Q: Explain referential equality in the context of React rendering.**
React checks if props have changed by comparing their memory addresses (`===`). If a parent renders and creates an inline object `const style = { color: 'red' }`, it creates a new memory address every time. Even if the content is identical, React sees a different address and forces the child to re-render. We use `useMemo` to keep the memory address stable.

---

## Key Takeaways

- **React re-renders children by default.** 
- **`React.memo`** stops a component from re-rendering if its props haven't changed.
- **Referential Equality** is why inline objects, arrays, and functions break `React.memo`.
- **`useMemo`** caches values/objects to maintain stable references or skip heavy math.
- **`useCallback`** caches function definitions to maintain stable references.
- **Don't prematurely optimize.** Restructure components (moving state down) before reaching for memoization hooks.
