# Core  fundamentals

## Hooks

Hook let us use react feature in components. Either we can use built-in hooks or combine them to make custom hooks.

Hooks must be call at top most level in component. It should not be loop or conditions.

Type of hooks:

1. **State hooks:** `useState`, `useReducer`
2. **Context hooks:** `useContext`
3. **Ref hooks:** `useRef`, `useImperativeHandle`
4. **Effect hooks:** `useEffect`, `useLayoutEffect`, `useInsertionEffect`, `useEffectEvent`
5. **Performance hooks:** `useMemo`, `useCallback`, `useTransition`, `useDeferredValue`
6. **Other hooks:** `useDebugValue`, `useId`, `useSyncExternalStore`, `useActionState`

### useRef

**Problem:** Normal variables in component resets on every render. State variables will trigger render on change. If we want variable whose value persist between renders and updating it does not trigger render, then we need a `ref`

Ref always wrap value in `current` property of an object. To update value this `current` key should be used

```js
const countRef = useRef(0) // countRef = { current: 0 }
countRef.current = countRef.current + 1
```

Ref should not be changed during renders. It should be read or write inside event handlers, `useEffect`, `useLayoutEffect`, callbacks

```js
function App(){
	const countRef = useRef(0)
	countRef.current++ // BAD
	return <>
		<div>{countRef.current}</div>
	</> 
}
```

> Refs are often used to hold DOM node.
>
> ```js
> const inputRef = useRef(null)
> ...
> function handleClick(){
> inputRef.current.focus()
> }
> ...
> <input ref={inputRef} />
> ```

### useMemo

It caches the result of calculation(callback function) between re-renders.

**Syntax:** `const cachedValue = useMemo(callback, [dependency])`

**Usage:**

1. Skipping expensive recalculations
2. Skipping re-rendering of components
3. Preventing an Effect from firing too often
4. Memoizing a dependency of another Hook
5. Memoizing a function

When an object or a function is passed as dependecy or prop which trigger re-render then sometime passing same object is treated as different due to change in reference. In that case, memoizing object or function prevent re-renders.

```js
function App(isDark){
	const theme = { dark: isDark}
	useEffect(()=>{}, [theme])
}
// Here everytime component renders new theme object will be created which will trigger useEffect even though values are same. To prevent this we can memoize it.
const theme = useMemo(()=>({dark: isDark}), isDark)
```

When parent re-renders it renders all its child components as well. To prevent this we can memoize child component then it will render only when props changes.

```js
import { memo } from 'react'

const App = memo((props)=>{...})
```

> **Do not memoize everything pre-prematurely** Only is there is large subtree which may cause performance issue. Memoization has below cost.
>
> 1. Memory cost: React stores previous and current value for comparison.
> 2. Comparison overhead: If props changes frequently, then component will re-render but with additional comparison
> 3. Complexity: Codebase harder to read over marginal gains.
>
> Before memoization, to avoid re-rendering restructuring your component tree so that the state lives in a component that has fewer children.

### useCallback

This hook caches function between renders

**Syntax:** `const cachedFn = useCallback(fn, [dependency])`

We can use `useMemo` to cache function as well by wrapping in a callback and even react internall work roughly like this `const cachedFn = useMemo(()=>fn, [dependency])`

### useEffect

Used to synchronize components with some external systems (server, network, widget outside react)

#### Execution order

- Component added to DOM for first time
    - __setup__ executed
- Dependency changed
    - component rerenders
    - __cleanup__ executed with old values
    - __setup__ executed with new values

```js
useEffect(()=>{
    ...setup function
    return ()=>{
        ...cleanup function
    }
},[dependencies]);
```

**Dependency** props, state, variables and functions  
**No Dependency array** run setup after every rerender  
**Empty Dependency array** run on initial render but not on rerender

## Patterns

### Don Abramov's patterns

**Pattern 1:** Move State Down Extract the stateful part into its own component so the expensive child doesn't re-render. 

**Pattern 2:** Lift Content Up (Children as Props) [see example](example.md#pattern-example-1)

