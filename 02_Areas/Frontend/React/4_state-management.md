# State Management (Context & Redux)

## Core Idea

> State management is about how components share data. While passing props works for small apps, large apps require global "stores" (like Context or Redux) so any component can access data without passing it through intermediate layers.

## The Problem: Prop Drilling

React data flows top-down (Unidirectional Data Flow). If a root component holds the `user` state, and a deeply nested `Avatar` component needs it, you have to pass `user` as a prop through every single component in between.

```jsx
// Prop Drilling Example
<App user={user}>
  <Header user={user}>
    <Navigation user={user}>
      <UserProfile user={user}>
        <Avatar user={user} />
      </UserProfile>
    </Navigation>
  </Header>
</App>
```

**Limitations of Prop Drilling:**
1. Components in the middle (`Header`, `Navigation`) receive props they don't even use, just to pass them down.
2. Refactoring becomes a nightmare.
3. Decreases component reusability.

---

## Context API: The Built-in Solution

### Problem It Solves

Context provides a way to pass data through the component tree without having to pass props down manually at every level.

### Step-by-Step Breakdown

1. **Create the Context:** (Creating the broadcast channel)
   `const ThemeContext = createContext('light');`
2. **Provide the Context:** (Broadcasting the data)
   `<ThemeContext.Provider value="dark"> ... </ThemeContext.Provider>`
3. **Consume the Context:** (Tuning into the channel)
   `const theme = useContext(ThemeContext);`

### Mental Model

Think of Context as a **Radio Broadcast**.
- The `Provider` is the radio tower transmitting a signal (the data).
- The intermediate components are just houses the signal passes through (they don't care about the signal).
- The `useContext` hook is a radio receiver inside a specific house, tuned to the exact frequency of the tower to listen to the data.

### The Trade-off (Why not use Context for everything?)

Context is great for data that doesn't change often (Themes, Auth User, Language). 
However, **when a Context value changes, EVERY component consuming that context re-renders.** Context is not optimized for high-frequency state updates. It lacks the ability to subscribe to only a specific *slice* of the data.

---

## Redux & Redux Toolkit (RTK)

### Problem It Solves

When an app grows complex, you have many disparate pieces of state changing frequently. Redux provides a predictable, centralized container for application state, enforcing strict rules on how and when state can be updated.

### Redux Architecture

Redux revolves around three core concepts:
1. **Store:** The single source of truth (the giant object holding all state).
2. **Actions:** Objects describing *what* happened (`{ type: 'increment', payload: 1 }`).
3. **Reducers:** Functions that decide *how* the state changes based on the action.

### Mental Model

Think of Redux as a **Bank**.
- You cannot just walk behind the counter and change your account balance (Direct Mutation).
- Instead, you fill out a deposit slip (**Action**).
- You hand the slip to the teller (**Dispatch**).
- The teller follows strict banking rules to calculate your new balance based on the slip (**Reducer**).
- The bank's vault is updated (**Store**).

### Why Must State Be Immutable?

In a reducer, you *must* return a brand new object, rather than modifying the existing one.
```js
// BAD (Mutation)
state.count = state.count + 1;
return state;

// GOOD (Immutability)
return { ...state, count: state.count + 1 };
```
**Why?** React (and Redux) determines if it needs to re-render components by doing a fast **reference equality check** (`oldState === newState`). If you mutate the object, the reference stays the same, and React won't know the data changed. Returning a new object gives a new reference, instantly signaling an update.

---

## Redux Toolkit (Modern Redux)

Redux historically required a lot of boilerplate. Redux Toolkit (RTK) solves this.

### `createSlice`

A "slice" represents a single feature's logic (e.g., cart, user, counter). RTK's `createSlice` automatically generates the action creators and the reducer for you.

*Bonus:* Under the hood, RTK uses a library called `Immer`, which allows you to write "mutating" code that is safely converted into immutable updates automatically.

```js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    // Looks like mutation, but Immer makes it safe!
    increment: (state) => { state.count += 1; }, 
    incrementByAmount: (state, action) => { state.count += action.payload; }
  }
});

export const { increment, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

### Reading and Writing Data (Hooks)

- **`useSelector` (Reading):** Extracts a specific piece of data from the store. Crucially, the component will *only* re-render if this specific piece of data changes.
- **`useDispatch` (Writing):** Gives you the function to send actions to the store.

```jsx
import { useSelector, useDispatch } from 'react-redux';
import { increment } from './counterSlice';

function Counter() {
  // Only re-renders if 'count' changes
  const count = useSelector((state) => state.counter.count); 
  const dispatch = useDispatch();

  return <button onClick={() => dispatch(increment())}>{count}</button>;
}
```

---

## Context API vs Redux

| Feature | Context API | Redux (RTK) |
|---------|-------------|-------------|
| Setup | Built-in, zero setup | Requires installing libraries, boilerplate |
| Performance | Re-renders all consumers on any change | Highly optimized, only re-renders affected components |
| Best For | Static/low-frequency data (Themes, Auth) | High-frequency, complex data (Data fetching, Carts) |
| DevTools | Basic | Excellent (Redux DevTools for time-travel debugging) |
| Architecture | decentralized (multiple contexts) | Centralized (one global store) |

> **Key insight:** Do not reach for Redux immediately. Start with Props. If Prop Drilling hurts, try Context. If Context causes performance issues or state logic becomes tangled, then move to Redux.

---

## Interview Perspective

**Q: What is lifting state up?**
Moving state from child components to their closest common parent so that the children can share and stay in sync with the same data.

**Q: What problems does prop drilling create?**
Passing props through deep layers of components that don't need the data makes the code hard to maintain, refactor, and ruins component reusability.

**Q: Why use Redux over Context API?**
Context is a dependency injection mechanism, not a state management tool. Context re-renders *every* consumer when its value changes, which scales poorly for complex state. Redux uses selectors (`useSelector`) to ensure components only re-render when the specific data they care about changes.

**Q: When should Context API NOT be used?**
Do not use it for state that changes frequently (like a typing input or ticking timer) because it will force every component consuming the context to re-render constantly.

**Q: Explain Redux flow.**
Component dispatches an **Action** → Action goes to the **Reducer** → Reducer calculates new state → **Store** updates → Component reads new state via selector and re-renders.

**Q: What is a Reducer?**
A pure function that takes the current state and an action as arguments, and returns a new state object. It must be pure—meaning it cannot mutate arguments, make API calls, or have side effects.

**Q: How does Redux Toolkit simplify Redux?**
It eliminates boilerplate by combining action creators and reducers into `createSlice`. It also uses `Immer` under the hood, allowing developers to write simpler mutating syntax (e.g., `state.count++`) while guaranteeing immutable state updates safely.

**Q: What is immutability and why is it important in React?**
Immutability means not modifying an object directly, but returning a new copy. It allows React to detect changes instantly using simple reference checks (`old === new`) instead of deep object comparison.

**Q: How does React detect state changes?**
By using `Object.is()` to do a shallow comparison of the old state reference and the new state reference.

**Q: Why should state updates be immutable?**
If you mutate state directly (`state.count++`), the memory reference stays the same. React checks `old === new`, sees they are the same reference, and skips re-rendering the component entirely.

---

## Key Takeaways

- **Prop Drilling:** Passing props deeply through components that don't need them.
- **Context API:** Great for global, low-frequency state (Theme, Auth). Avoid for high-frequency updates.
- **Redux:** Centralized, predictable state container using Actions and Reducers.
- **Immutability:** Crucial for React/Redux to detect changes efficiently via reference equality.
- **RTK (Redux Toolkit):** The modern, standard way to write Redux, eliminating boilerplate and making immutable updates easier via Immer.
