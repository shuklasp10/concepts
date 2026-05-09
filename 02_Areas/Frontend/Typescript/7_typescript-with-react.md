# TypeScript with React

## Component Typing

### Functional Components

```tsx
// Inline props — for simple components
const Greeting = ({ name, age }: { name: string; age: number }) => {
    return <h1>Hello {name}, you are {age}</h1>;
};

// With type alias — preferred for reusable/complex props
type GreetingProps = {
    name: string;
    age: number;
    subtitle?: string; // optional
};

const Greeting = ({ name, age, subtitle }: GreetingProps) => {
    return (
        <div>
            <h1>Hello {name}, {age}</h1>
            {subtitle && <p>{subtitle}</p>}
        </div>
    );
};
```

> **`React.FC` (Function Component):** In React 18+ it no longer adds implicit `children` prop, but it still doesn't work well with generics and adds unnecessary complexity. **Prefer direct prop typing.**

### Children Props

```tsx
type LayoutProps = {
    children: React.ReactNode;  // most flexible — accepts anything renderable
    title: string;
};

const Layout = ({ children, title }: LayoutProps) => {
    return (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    );
};
```

| Type | Accepts |
| --- | --- |
| `React.ReactNode` | Everything — string, number, JSX, null, undefined, arrays |
| `React.ReactElement` | Only JSX elements (`<Component />`) |
| `JSX.Element` | Same as `ReactElement` but less flexible |
| `string` | Only strings |

## Event Types

| Event Type | Triggered By |
| --- | --- |
| `React.MouseEvent<T>` | `onClick`, `onMouseEnter`, `onMouseLeave` |
| `React.KeyboardEvent<T>` | `onKeyDown`, `onKeyUp` |
| `React.ChangeEvent<T>` | `onChange` |
| `React.FocusEvent<T>` | `onFocus`, `onBlur` |
| `React.FormEvent<T>` | `onSubmit` |
| `React.DragEvent<T>` | `onDragStart`, `onDrop` |
| `React.ClipboardEvent<T>` | `onCopy`, `onPaste` |

`T` is the HTML element type that triggered the event.

```tsx
const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    console.log(e.currentTarget.textContent);
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
        // submit logic
    }
};
```

> **`e.target` vs `e.currentTarget`:** `currentTarget` is the element the handler is attached to (always typed correctly). `target` is the element that triggered the event (may be a child element).

## Hooks Typing

### useState

```tsx
// Inferred type — TS infers from initial value
const [count, setCount] = useState(0);          // number
const [name, setName] = useState("John");       // string

// Explicit type — required when initial value doesn't match full type
const [user, setUser] = useState<User | null>(null);

type User = { name: string; age: number };
const [users, setUsers] = useState<User[]>([]);
```

> **When to be explicit:** When the initial value is `null`, an empty array `[]`, or doesn't represent all possible states.

### useRef

```tsx
// DOM reference — pass null, returns RefObject (readonly .current)
const inputRef = useRef<HTMLInputElement>(null);

// Mutable value — pass initial value, returns MutableRefObject
const timerRef = useRef<number>(0);
```

> **Rule:** Pass `null` for DOM refs (TS returns `RefObject`). Pass an initial value for mutable refs (TS returns `MutableRefObject`).

### useReducer

```tsx
type State = { count: number };
type Action =
    | { type: "increment" }
    | { type: "decrement" }
    | { type: "set"; payload: number };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "increment":
            return { count: state.count + 1 };
        case "decrement":
            return { count: state.count - 1 };
        case "set":
            return { count: action.payload };
        default:
            return state;
    }
};

const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: "increment" });
dispatch({ type: "set", payload: 100 });
// dispatch({ type: "reset" }); // Error — "reset" not in Action union
```

> Action type uses **discriminated union** — `type` is the discriminant property. This gives full type safety inside the switch.

### useContext

```tsx
type Theme = "light" | "dark";

const ThemeContext = createContext<Theme>("light");

// Provider — value must match Theme type
<ThemeContext.Provider value="dark">
    <App />
</ThemeContext.Provider>

// Consumer — type is automatically Theme
const theme = useContext(ThemeContext); // type: Theme
```

For context that may be undefined (no default value):

```tsx
const UserContext = createContext<User | undefined>(undefined);

// Custom hook with guard
function useUser(): User {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be within UserProvider");
    return ctx;
}
```

### useMemo & useCallback

```tsx
// useMemo — return type is inferred from the factory function
const doubled = useMemo(() => count * 2, [count]); // type: number

// useCallback — type is inferred from the callback signature
const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
        console.log(e.currentTarget);
    },
    []
);
```

## Props Patterns

### Callback Props

```tsx
type ButtonProps = {
    onClick: (id: string) => void;
    label: string;
};

const Button = ({ onClick, label }: ButtonProps) => {
    return <button onClick={() => onClick("123")}>{label}</button>;
};
```

### Style Props

```tsx
type BoxProps = {
    style?: React.CSSProperties;
    className?: string;
};

const Box = ({ style, className }: BoxProps) => {
    return <div style={style} className={className} />;
};
```

### Extending HTML Element Props

Inherit all native HTML attributes for a custom component:

```tsx
type CustomButtonProps = {
    variant: "primary" | "secondary";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const CustomButton = ({ variant, ...rest }: CustomButtonProps) => {
    return <button className={`btn-${variant}`} {...rest} />;
};

// Now supports all native button props: onClick, disabled, type, etc.
<CustomButton variant="primary" disabled>Click</CustomButton>
```

### Generic Components

```tsx
type ListProps<T> = {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
};

const List = <T,>({ items, renderItem }: ListProps<T>) => {
    return <ul>{items.map(renderItem)}</ul>;
};

// Usage — T is inferred from items
<List
    items={[{ name: "John" }, { name: "Jane" }]}
    renderItem={(item) => <li key={item.name}>{item.name}</li>}
/>
```

> The trailing comma in `<T,>` is required in `.tsx` files to distinguish the generic from a JSX tag.

---

## TODO: Topics to Study

- [ ] Typing Higher Order Components (HOC)
- [ ] Typing custom hooks
- [ ] Typing `forwardRef`
- [ ] Typing `React.lazy` and `Suspense`
- [ ] Polymorphic component patterns (`as` prop)
