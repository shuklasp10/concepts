# React Interview Questions — Quick Reference

> 50 questions covering mid-level to senior concepts. Each answer references the detailed notes for deep understanding. Every concept is mapped to Vue equivalents for faster learning (where applicable).

---

## React Fundamentals

### 1. What is the difference between React and vanilla JavaScript DOM manipulation?
**One-liner:** React is declarative and uses a Virtual DOM; Vanilla JS is imperative and updates the real DOM directly.
- **Vanilla JS:** You tell the browser *how* to update the UI step-by-step (imperative).
- **React:** You declare *what* the UI should look like based on state, and React handles the efficient updates (declarative).
📖 [Detailed notes](1_core-fundamentals.md#mental-model--react-vs-vanilla-js)

### 2. What is Virtual DOM and how does React use it?
**One-liner:** A lightweight JavaScript representation of the actual DOM kept in memory to minimize expensive real DOM updates.
When state changes, React creates a new Virtual DOM tree, compares it with the previous one, and calculates the minimum necessary real DOM changes.
📖 [Detailed notes](1_core-fundamentals.md#interview-perspective)

### 3. Explain reconciliation in React.
**One-liner:** The process of diffing the old Virtual DOM with the new Virtual DOM and updating the real DOM efficiently.
It compares nodes at the same level. If the component type changes, it destroys the old tree and builds a new one. If it's the same, it only updates the changed attributes.
📖 [Detailed notes](2_runtime-fundamentals.md#the-render-and-commit-phases)

### 4. What are React components?
**One-liner:** Reusable, self-contained pieces of UI that accept inputs (props) and return React elements (JSX).
📖 [Detailed notes](1_core-fundamentals.md#components)

### 5. Difference between functional and class components?
| Functional Components | Class Components |
|-----------------------|------------------|
| Just JS functions returning JSX | ES6 classes extending `React.Component` |
| Use Hooks for state/lifecycle | Use `this.state` and lifecycle methods |
| Simple, less boilerplate | Verbose, requires binding `this` |
| Standard in modern React | Legacy |
📖 [Detailed notes](3_hooks-lifecycle.md#the-problem-with-class-components)

### 6. What are props in React?
**One-liner:** Read-only data passed from a parent component down to a child component. (Like function arguments).
📖 [Detailed notes](1_core-fundamentals.md#props-vs-state)

### 7. What is state in React?
**One-liner:** Internal, mutable data managed by the component itself that changes over time and triggers re-renders.
📖 [Detailed notes](1_core-fundamentals.md#props-vs-state)

### 8. Difference between props and state?
| Props | State |
|-------|-------|
| Passed from parent | Managed internally |
| Immutable (read-only) | Mutable (via setter) |
| Used to configure components | Used to track dynamic data |
📖 [Detailed notes](1_core-fundamentals.md#props-vs-state)

### 9. What causes a React component to re-render?
1. Its own state changes.
2. Its parent component re-renders (this cascades down).
3. Its consumed Context value changes.
*(Note: Changing props is just a byproduct of the parent re-rendering).*
📖 [Detailed notes](6_performance-optimization.md#the-re-render-cascade)

### 10. What is JSX? How does it work internally?
**One-liner:** Syntax sugar that allows writing HTML-like code inside JavaScript.
Internally, it compiles to pure JavaScript function calls: `React.createElement(tag, props, children)`.
📖 [Detailed notes](1_core-fundamentals.md#jsx-javascript-xml)

---

## Hooks

### 11. What is the difference between `useState` and `useRef`?
| `useState` | `useRef` |
|------------|----------|
| Triggers a re-render when changed | Does **not** trigger a re-render |
| Used for UI-related data | Used for DOM nodes or background mutable variables (e.g., timer IDs) |
| Read directly (`count`) | Read via `.current` (`ref.current`) |
📖 [Detailed notes](3_hooks-lifecycle.md#useref-an-escape-hatch)

### 12. When should you use `useEffect`?
**One-liner:** To synchronize a component with an external system (e.g., fetching data, connecting to a WebSocket, DOM manipulation outside React).
📖 [Detailed notes](3_hooks-lifecycle.md#useeffect-synchronizing-with-external-systems)

### 13. Explain the lifecycle of `useEffect`.
1. Component renders.
2. React updates the DOM.
3. `useEffect` runs (setup).
4. On re-render: `useEffect` runs cleanup function (from previous render), then runs setup function again.
5. On unmount: `useEffect` runs cleanup function.
📖 [Detailed notes](3_hooks-lifecycle.md#step-by-step-breakdown-1)

### 14. Difference between `useEffect` and `useLayoutEffect`?
- `useEffect`: Runs **asynchronously** after the DOM paints. (Good for 99% of cases).
- `useLayoutEffect`: Runs **synchronously** after React mutates the DOM, but *before* the browser paints. Used to read layout (e.g., scroll position) and avoid flickering.

### 15. What are dependency arrays in `useEffect`?
**One-liner:** An array of variables that tells React exactly when to re-run the effect.
- `undefined`: Runs after every render.
- `[]`: Runs once on mount.
- `[x, y]`: Runs when `x` or `y` changes.
📖 [Detailed notes](3_hooks-lifecycle.md#dependency-array-rules)

### 16. What problems can happen if dependencies are missing?
**One-liner:** The effect might capture stale closures (old state) or fail to react to changes, leading to bugs where the UI is out of sync with data.

### 17. Explain stale closures in React.
**One-liner:** When an asynchronous function (like `setTimeout`) inside an effect captures state from an older render cycle, instead of the most current state. Fixed by using functional state updates (`setCount(prev => prev + 1)`).
📖 [Detailed notes](3_hooks-lifecycle.md#the-stale-closure-problem)

### 18. What is `useMemo` and when should you use it?
**One-liner:** A hook that caches the *return value* of an expensive calculation or caches an object reference to prevent child re-renders. Use it when calculations are slow or to preserve referential equality.
📖 [Detailed notes](6_performance-optimization.md#2-usememo-memoizing-values)

### 19. Difference between `useMemo` and `useCallback`?
- `useMemo` caches the **result** of a function (the value).
- `useCallback` caches the **function definition itself**. (Syntactic sugar for `useMemo(() => fn, deps)`).
📖 [Detailed notes](6_performance-optimization.md#3-usecallback-memoizing-functions)

### 20. What is `useReducer` and when is it better than `useState`?
**One-liner:** An alternative to `useState` for complex state logic that involves multiple sub-values or when the next state depends on the previous one. Better for grouping related state updates.

### 21. Explain custom hooks and their benefits.
**One-liner:** Regular JS functions that start with `use` and call other hooks. They allow you to extract and reuse stateful logic (like fetching data or tracking window size) across multiple components without adding wrapper hell.
📖 [Detailed notes](3_hooks-lifecycle.md#custom-hooks-reusing-logic)

### 22. Why do hooks need to follow rules?
**One-liner:** React relies on the exact **call order** of hooks to associate local state with the correct hook call. If you put a hook in an `if` statement, the order changes, and React applies the wrong state to the wrong hook.
📖 [Detailed notes](3_hooks-lifecycle.md#the-rule-of-hooks)

### 23. What happens internally when hooks order changes?
React uses an internal array/linked list to track hooks for a component. If a conditional hook is skipped, all subsequent hooks shift index, reading the wrong state and crashing the app.

### 24. Explain cleanup functions in `useEffect`.
**One-liner:** A function returned by `useEffect` used to clean up subscriptions, timers, or event listeners. It runs *before* the effect runs again, and when the component unmounts.
📖 [Detailed notes](3_hooks-lifecycle.md#step-by-step-breakdown-1)

### 25. How would you cancel API requests in React?
Use the `AbortController` API inside a `useEffect`. In the cleanup function, call `abortController.abort()`.

---

## Rendering & Performance

### 26. What is `React.memo`?
**One-liner:** A higher-order component that prevents a functional component from re-rendering if its props have not changed (shallow comparison).
📖 [Detailed notes](6_performance-optimization.md#1-reactmemo-memoizing-components)

### 27. When does `React.memo` fail to prevent re-renders?
When the parent passes inline objects, arrays, or functions as props. Since these have new memory addresses on every parent render, `React.memo` sees them as "changed" props (referential equality failure).
📖 [Detailed notes](6_performance-optimization.md#the-root-problem-referential-equality)

### 28. Explain `key` prop in lists and why indexes are dangerous.
**One-liner:** `key` helps React identify which items have changed, been added, or removed. Using the array index as a key is dangerous because if the array is reordered or items are deleted, React will map the wrong state to the wrong component.
📖 [Detailed notes](2_runtime-fundamentals.md#the-key-prop)

### 29. How do you optimize React application performance?
1. Move state down closer to where it's used.
2. Pass heavy UI as `children` (lift content up).
3. Use `useMemo`/`useCallback` with `React.memo` for expensive renders.
4. Code split via `React.lazy`.
📖 [Detailed notes](6_performance-optimization.md#the-danger-of-premature-optimization)

### 30. What causes unnecessary re-renders?
- State defined too high in the component tree.
- Passing new object/function references to pure components.
- Context API values changing frequently (re-renders all consumers).

### 31. Explain code splitting in React.
**One-liner:** Breaking a large Javascript bundle into smaller chunks that are loaded on demand, improving initial load time. Achieved using dynamic `import()` and tools like Webpack or Vite.

### 32. What is lazy loading in React?
**One-liner:** Using `React.lazy()` to render a dynamic import as a regular component. It defers loading the component's code until it is actually needed on the screen. (Requires `<Suspense>` wrapper).

### 33. Difference between client-side rendering (CSR) and server-side rendering (SSR)?
- **CSR:** Browser downloads a blank HTML page and a huge JS bundle. React builds the UI in the browser. (Slower initial load, bad SEO).
- **SSR:** Server executes React, sends a fully populated HTML page to the browser. (Fast initial load, great SEO).

### 34. What is hydration in React?
**One-liner:** The process where React attaches event listeners and state to the static HTML that was generated by Server-Side Rendering (SSR), bringing it "to life".

### 35. Explain React Fiber architecture.
**One-liner:** React's modern rendering engine that breaks rendering work into interruptible chunks (fibers). It allows React to pause rendering, handle high-priority events (like user typing), and resume, preventing UI freezing.
📖 [Detailed notes](2_runtime-fundamentals.md#react-fiber)

---

## State Management

### 36. What is lifting state up?
**One-liner:** Moving state from child components to their closest common parent so that the children can share and stay in sync with the same data.
📖 [Detailed notes](1_core-fundamentals.md#props-vs-state)

### 37. What problems does prop drilling create?
**One-liner:** Passing props through deep layers of components that don't need the data makes the code hard to maintain, refactor, and ruins component reusability.
📖 [Detailed notes](4_state-management.md#the-problem-prop-drilling)

### 38. Difference between Context API and Redux?
| Context API | Redux |
|-------------|-------|
| Built-in dependency injection | External state management library |
| Re-renders all consumers on change | Only re-renders selected data (`useSelector`) |
| Good for static/low-frequency data | Good for complex/high-frequency data |
📖 [Detailed notes](4_state-management.md#context-api-vs-redux)

### 39. When should Context API NOT be used?
**One-liner:** Do not use it for state that changes frequently (like a typing input or ticking timer) because it will force every component consuming the context to re-render constantly.

### 40. Explain Redux flow.
Component dispatches an **Action** → Action goes to the **Reducer** → Reducer calculates new state → **Store** updates → Component reads new state via selector and re-renders.
📖 [Detailed notes](4_state-management.md#redux--redux-toolkit-rtk)

### 41. What is immutability and why is it important in React?
**One-liner:** Immutability means not modifying an object directly, but returning a new copy. It allows React to detect changes instantly using simple reference checks (`old === new`) instead of deep object comparison.
📖 [Detailed notes](4_state-management.md#why-must-state-be-immutable)

### 42. How does React detect state changes?
By using `Object.is()` to do a shallow comparison of the old state reference and the new state reference.

### 43. Why should state updates be immutable?
If you mutate state directly (`state.count++`), the memory reference stays the same. React checks `old === new`, sees they are the same reference, and skips re-rendering the component entirely.

---

## Advanced React

### 44. Explain controlled vs uncontrolled components.
- **Controlled:** Form data is handled by React state (`value` and `onChange`). React is the single source of truth.
- **Uncontrolled:** Form data is handled by the DOM itself. You read values using a `useRef`.

### 45. What are higher-order components (HOC)?
**One-liner:** A function that takes a component and returns a new, enhanced component. Used heavily in older React to share logic (e.g., `withRouter(MyComponent)`), but mostly replaced by Custom Hooks.

### 46. What are render props?
**One-liner:** A pattern where a component receives a function as a prop that returns a React element, allowing the component to share its internal state with the parent. (Largely replaced by hooks).

### 47. What are portals in React?
**One-liner:** `createPortal` allows you to render a child node into a different part of the DOM tree (e.g., `document.body`), breaking out of `overflow: hidden` constraints. Crucial for Modals and Tooltips. (Equivalent to Vue's `<Teleport>`).

### 48. What are Error Boundaries?
**One-liner:** Class components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the whole app. (No functional component hook equivalent yet).

### 49. What is Concurrent Rendering in React 18?
**One-liner:** A new behind-the-scenes mechanism (powered by Fiber) that allows React to prepare multiple versions of the UI at the same time. It makes rendering interruptible, meaning high-priority updates (typing) aren't blocked by heavy background renders.

### 50. Explain Suspense in React.
**One-liner:** A component `<Suspense fallback={<Spinner />}>` that lets you declarative "wait" for some code (like `React.lazy`) or data to load, showing a fallback UI in the meantime.
