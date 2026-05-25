# TypeScript with React

## Core Idea

> Using TypeScript with React shifts error catching from the browser (when the user clicks a button) to the editor (when the developer writes the code). It provides a strict contract for what data a component requires and what events it fires.

---

## 1. Typing Component Props

### Problem It Solves
In Vanilla JavaScript React, if a `UserCard` component expects a `user` object but you pass it a string, React won't complain until the component tries to render `user.name` and the entire app crashes with `Cannot read properties of undefined`.

### The Solution: Interfaces for Props
You define an `interface` (or `type`) that acts as a strict blueprint for the props the component receives.

```tsx
interface UserCardProps {
  name: string;
  age: number;
  isOnline?: boolean; // Optional prop
}

// Option A: Destructuring directly in the signature (Recommended)
function UserCard({ name, age, isOnline = false }: UserCardProps) {
  return <div>{name} is {age}</div>;
}

// Option B: Typing the props object
function UserCard(props: UserCardProps) {
  return <div>{props.name} is {props.age}</div>;
}
```

### Mental Model
Think of the Props Interface as a **Bouncer at a Club**. 
If another component tries to render `<UserCard />` without providing the required `name` and `age`, the bouncer (TypeScript) blocks them immediately in the code editor.

---

## 2. Typing `children`

### `React.ReactNode`
When you want your component to act as a wrapper (like a Modal or Layout), it needs to accept `children`. The most encompassing type for this is `React.ReactNode`.

- **What it represents:** Literally anything React can render (strings, numbers, JSX elements, arrays of elements, `null`, `undefined`).

```tsx
import { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode; // The standard way to type children
}

function Modal({ title, children }: ModalProps) {
  return (
    <div className="modal">
      <h2>{title}</h2>
      <div className="content">{children}</div>
    </div>
  );
}
```

---

## 3. Typing Hooks

Most of the time, TypeScript relies on **Type Inference** for hooks. But sometimes you need to explicitly pass Generics.

### `useState`
Usually, inference is enough:
```tsx
const [count, setCount] = useState(0); // TS knows it's a number
```

When you initialize state with `null` or an empty array, inference fails. You must use Generics to tell TypeScript what the state *will eventually* hold.
```tsx
interface User { id: string; name: string; }

// TS needs help here. It could be a User, or it could be null.
const [user, setUser] = useState<User | null>(null);

// TS needs help here. It's an array, but an array of what?
const [items, setItems] = useState<string[]>([]);
```

### `useRef`
`useRef` is commonly used for two distinct things, and they are typed differently.

**1. Connecting to a DOM Element (Read-Only)**
Provide the specific HTML Element type, and initialize with `null`.
```tsx
// Notice HTMLInputElement
const inputRef = useRef<HTMLInputElement>(null);

function focusInput() {
  // Optional chaining is required because inputRef.current might be null initially
  inputRef.current?.focus(); 
}
```

**2. Storing a Mutable Value (Read/Write)**
Provide the type of the value you want to store.
```tsx
const intervalRef = useRef<number>(0);

intervalRef.current = setInterval(tick, 1000);
```

---

## 4. Typing Events

### Problem It Solves
When a user types in an input, or clicks a button, the browser generates an Event object. Typing these correctly gives you autocompletion for properties like `e.target.value` or `e.preventDefault()`.

### The Common Event Types
You import these specific event types directly from React.

1. **`React.ChangeEvent`** (Typing in an input)
2. **`React.MouseEvent`** (Clicking a button)
3. **`React.FormEvent`** (Submitting a form)

```tsx
import { ChangeEvent, FormEvent, MouseEvent } from 'react';

function Form() {
  // 1. Typing the Input Change
  // Notice we pass <HTMLInputElement> so TS knows what `e.target` is
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value); 
  };

  // 2. Typing the Form Submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitted");
  };

  // 3. Typing the Button Click
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log("Clicked at coordinates:", e.clientX, e.clientY);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

---

## Interview Perspective

**Q: How do you strongly type components in React?**
By defining an `interface` or `type` that describes the exact shape of the `props` object, and annotating the functional component's parameters with that interface.

**Q: What is the best way to type the `children` prop?**
Using `React.ReactNode`. It is the broadest type and covers everything React can legitimately render (elements, strings, numbers, arrays, fragments).

**Q: When should you explicitly type `useState`?**
When the initial value does not provide enough information for type inference. The most common examples are initializing with `null` (e.g., `useState<User | null>(null)`) or an empty array (e.g., `useState<Product[]>([])`).

**Q: What is the difference between `React.ReactNode` and `React.ReactElement`?**
`ReactNode` represents anything that can be rendered (including primitives like strings/numbers). `ReactElement` is much stricter; it specifically represents an object created by `React.createElement` (i.e., actual JSX tags like `<div />` or `<MyComponent />`).

**Q: How do you type an `onChange` event for an input?**
By using `React.ChangeEvent<HTMLInputElement>`. This tells TypeScript that the event is a change event, specifically originating from an HTML input, which gives you type-safe access to `e.target.value`.

---

## Key Takeaways

- Use **Interfaces** for Props. It acts as a strict contract between a parent and child component.
- Rely on **Type Inference** for simple `useState` hooks, but explicitly type them when initializing with `null` or `[]`.
- Event typing is specific. Import `ChangeEvent`, `MouseEvent`, or `FormEvent` directly from React, and pass the specific HTML element generic (like `<HTMLInputElement>`).
