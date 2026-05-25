# Core Fundamentals

## What is React?

> React is a JavaScript library for building user interfaces. Unlike Angular or Vue (which are frameworks), React is strictly a view library. It does not dictate how you handle routing, state management, or data fetching.

### Mental Model — React vs Vanilla JS

Think of Vanilla JS as **micromanaging a worker** — you have to tell them exactly what to do at every step ("find this button, change its color, add a listener"). React is like **hiring an architect** — you just provide the blueprint (the state) of what the house should look like, and React figures out the most efficient way to build or update it.

| Aspect | Vanilla JS | React |
|--------|------------|-------|
| Paradigm | Imperative (How to do it) | Declarative (What it should look like) |
| DOM Updates | Manual (`document.getElementById`) | Automatic (React handles it via Virtual DOM) |
| Data Flow | Scattered | Unidirectional (Top-down) |
| UI Organization | HTML, CSS, JS separated | Components (Logic + UI together) |
| Performance | Fast for simple apps, slow at scale if not optimized | Predictable performance via reconciliation |

---

## Declarative vs Imperative UI

### Problem It Solves

In traditional Vanilla JS (Imperative), UI state and DOM state easily get out of sync. If a user has 5 items in a cart, you have to manually update the cart counter, the checkout button, and the item list. If you forget one, you have a bug.

### Mental Model

- **Imperative (Vanilla JS):** "Go to the kitchen, open the fridge, take out bread, put cheese on it, put it on a plate." (Step-by-step instructions).
- **Declarative (React):** "I want a cheese sandwich." (Describe the desired outcome).

In React, you define how the UI should look for a given `state`. When the `state` changes, React re-evaluates the UI and applies the necessary changes to the DOM automatically.

---

## JSX: JavaScript XML

### Problem It Solves

Historically, web development separated structure (HTML) and logic (JavaScript). But in modern web apps, logic and structure are tightly coupled. A button's HTML is useless without its `onClick` logic. JSX allows you to write HTML-like syntax directly inside JavaScript, keeping related concerns together.

### How it Works Internally

JSX is not valid JavaScript. It is syntactic sugar that gets compiled (usually by Babel) into pure JavaScript function calls.

```jsx
// How you write it (JSX)
const element = <h1 className="greeting">Hello, world!</h1>;

// What it compiles to (Under the hood)
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, world!'
);
```

### Mental Model

JSX is like a **template literal on steroids**. Just as `` `Hello ${name}` `` lets you embed JavaScript variables inside strings, JSX lets you embed JavaScript logic directly inside UI structures using curly braces `{}`.

### Important Rules of JSX

1. **Return a single root element:** You cannot return multiple sibling elements without wrapping them. (Use `<React.Fragment>` or `<>...</>` to avoid adding extra `<div>` nodes).
2. **Close all tags:** Even tags that don't need closing in HTML (like `<img>` or `<input>`) must be closed in JSX (`<img />`).
3. **camelCase naming:** HTML attributes become camelCase (`class` becomes `className`, `onclick` becomes `onClick`) because JSX translates to JavaScript objects, and `class` is a reserved keyword in JS.

---

## Components

### Core Idea

A component is a reusable piece of the UI. It is simply a JavaScript function that takes inputs (props) and returns a React element (JSX).

### Why the Component Model?

Before React, we organized code by technology (HTML files, CSS files, JS files). This scaled poorly because changing a single feature meant editing three different files. React organizes code by **feature or logical unit**. A `Button` component contains its own structure, style, and logic.

### Mental Model

Think of components as **custom HTML tags**. Just like the browser knows how to render an `<input>`, you can teach React how to render a `<UserProfile>` or a `<ShoppingCart>`. 

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// Usage
function App() {
  return (
    <div>
      <Welcome name="Alice" />
      <Welcome name="Bob" />
    </div>
  );
}
```

---

## Props vs State

This is the most critical distinction in React.

| Aspect | Props (Properties) | State |
|--------|-------------------|-------|
| Analogy | DNA passed from parent (cannot change) | A person's mood (can change internally) |
| Source | Passed down from a parent component | Managed internally by the component itself |
| Mutability | **Read-only** (Immutable) | **Mutable** (via state setter functions) |
| Purpose | Configure a component, pass data down | Keep track of data that changes over time |
| Triggers Render? | Yes (when parent passes new props) | Yes (when state is updated) |

### Step-by-Step Breakdown

1. **Props** flow downwards. A parent passes a configuration to a child. The child *cannot* modify its props.
2. **State** is local. If a child needs to change something, it must use its own state.
3. **Data Flow:** If a child needs to update parent data, the parent must pass a *function* down as a prop, and the child calls that function. This is called **"Lifting State Up"**.

### Reactivity Engine: React vs Vue

**Vue (Automatic):** Vue wraps your state in Proxies. It knows *exactly* which variables changed and surgically updates only the components that read those variables.
**React (Manual):** React doesn't track variable access. You have to explicitly tell React "I am changing this state" by calling a setter function (e.g., `setCount`). When you do, React re-renders the *entire* component (and all its children) and compares the new output to the old output to find differences.

> **Key insight:** React's reactivity is based on **Immutability and Explicit Updates**. You never modify state directly (`count = 5`); you replace it (`setCount(5)`).

---

## Interview Perspective

**Q: What is the difference between React and vanilla JavaScript DOM manipulation?**

Vanilla JS is imperative — you write step-by-step instructions for *how* the browser should update the DOM. React is declarative — you define *what* the UI should look like based on state, and React handles the actual DOM updates automatically.

**Q: Why does React use a Virtual DOM instead of updating the real DOM directly?**

The real DOM is slow to update. When you change something, the browser has to recalculate layout and repaint the screen. React keeps a lightweight copy of the DOM in memory (Virtual DOM). When state changes, it creates a new Virtual DOM, compares it to the old one (Diffing), calculates the absolute minimum number of real DOM updates needed, and applies them all at once in a batch (Reconciliation).

**Q: What are React components?**

Reusable, self-contained pieces of UI that accept inputs (props) and return React elements (JSX).

**Q: What are props and state? What's the difference?**

- **Props** are read-only data passed down from a parent to configure a child.
- **State** is mutable data managed internally by a component.
- The key difference: a component cannot change its own props, but it can change its own state.

**Q: Why can't components update their own props?**

Props are designed to enforce a **Unidirectional Data Flow**. If children could modify props, data could flow in any direction, making it impossible to track down bugs (a problem common in two-way data binding systems like AngularJS). If a child needs to mutate data, it should be state, not a prop.

**Q: What is JSX and how does it work internally?**

JSX is syntax sugar that allows you to write HTML-like markup inside JavaScript. Internally, it is not executed by the browser; it is compiled (e.g., by Babel) into pure JavaScript `React.createElement(tag, props, children)` calls.

**Q: What is the difference between an Element and a Component?**

An **Element** is what a component returns. It's a plain JavaScript object describing what should appear on the screen (e.g., `<div />`). A **Component** is a function or class that accepts inputs and returns a React element.

---

## Key Takeaways

- **Declarative over Imperative:** Tell React *what* you want, not *how* to build it.
- **Components are functions:** They take data (props) and return UI (JSX).
- **Props are read-only; State is mutable.**
- **Unidirectional Data Flow:** Data always flows down. To send data up, pass callbacks down.
- **Never mutate state directly:** Always use the provided setter functions to trigger re-renders.
