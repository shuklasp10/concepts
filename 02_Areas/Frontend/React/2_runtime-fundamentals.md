# Runtime fundamentals

## React render & commit

**Render** In react, rendering means react calling component to finalize what to show on screen.

Render is triggered in two case:

1. **Initial render:** React call root component and append in root node
2. **State update:** After initial render, render is triggered because of component's (or any parent's) state update

### Initial render

After app start, initially we have to render root component manually. Sometime frameworks hide this step, but it is done in two step

1. creating root by passing target DOM node in `createNode` method
2. then calling `render` method on that root and pass root component

```js
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
root.render(<App />)
```

### Re-renders

After initial render, react automatically queues re-render on state update. 

Re-renders are recursive, it means if any component's state is updated then along with that component all child component will also re-render.

> Rendering must be alway **Pure**
>
> Given the same input, any component should result in same JSX and it should not change other object or variables that existed before rendering.
>
> This is the reason when developing in "Strict mode" react calls component twice to identify bugs caused by impure components.

Re-rendering of child components can be optimized if parent is very high in tree for performance, but we should not optimize prematurely.

After re-rendering react creates new virtual DOM and compare to old virtual DOM using diffing algorithm. Then it apply necessary changes to real DOM. This is called **commiting**

**Browser Paint** once react updates the real DOM, browser renders new DOM on screen, this render in react is called browser render or painting.

> If child component is passed as children prop then rendering the parent component will not trigger child component re-render. Because actual child component is render in parent's wrapper and its JSX is passed to parent component.
>
> ```js
> const ColorWrapper = ({ children }) => {
>   const [color, setColor] = useState('red');
>   return (
>     <div style={{ backgroundColor: color }}>
>       <input value={color} onChange={e => setColor(e.target.value)} />
>       {children}   {/* children is just a prop — it was created OUTSIDE */}
>     </div>
>   );
> };
> // App creates ExpensiveTree once and passes it down
> const App = () => {
>   return (
>     <ColorWrapper>
>       <ExpensiveTree />   {/* ✅ Created here in App, never re-renders! */}
>     </ColorWrapper>
>   );
> };
> ```

## State in React

### State as snapshot

When a component renders, react creates its snapshot which include current props, UI and events handlers at the time of rendering. React uses this snapshot to calculate for next re-rendering.

```js
<button onClick={() => {
        setNumber(number + 1);
        setNumber(number + 1);
        setNumber(number + 1);
      }}>+3</button>
```

Here, when `onClick` handler is called, value of state will be same till next render. So all setNumber will be called with number as 0. Now, for same event handler react batches the setState operation and calculate final state value and render with that finalized value.

So, component will re-render once with number as 1.

Even if we have setTimeout value of state will be same as of  snapshot.

```js
<button onClick={() => {
        setNumber(number + 5);
        setTimeout(() => {
          alert(number); // 0
        }, 3000);
      }}>+5</button>
```

Since when setTimeout is triggered, value of number in snapshot is 0 so alert will be 0.

### Preserving & Resetting state

State is isolated for between components. Every copy of component have their own copy of state and change independently.

```js
import { useState } from 'react';

export default function App() {
  return (
    <div>
      <Counter />
			<Counter />
    </div>
  );
}
```

**Preserve** React keep the same state as long as same component render at same place in tree. When component change its place in tree, component gets destroyed from previous place and state detroyed as well and render at new place with fresh copy of state.

**Destroy** React destroy state when component disappear or render at different place in tree.

> Here, tree means React element tree that react manages for reconciliation. It is not actual DOM tree

```js
<div>
{isFancy ? 
	<Counter isFancy={true} /> :
	<Counter isFancy={false} />
}
</div>
// Here Counter's state will be preserved when isFancy changes because in both case Counter will render as first child of div.

{isFancy ? 
	<div>
		<Counter isFancy={true} />
	</div> :
	<section>
		<Counter isFancy={false} />
	</section>
}
// Here Counter's state resets when isFancy changes because in each case Counter renders at different place.
```

> Position of component in the tree matters not in JSX.
>
> To preserve the state component should render at  same place between re-renders.

If same component is render at different place then entire subtree state is reset.

We should not create nested component because every time parent component re-renders the nested component will be newly created and state resets. So it will be like rendering different component at same place.

```js
import { useState } from 'react';

export default function MyComponent() {
  const [counter, setCounter] = useState(0);

  function MyTextField() {
    const [text, setText] = useState('');

    return (
      <input
        value={text}
        onChange={e => setText(e.target.value)}
      />
    );
  }

  return (
    <>
      <MyTextField />
      <button onClick={() => {
        setCounter(counter + 1)
      }}>Clicked {counter} times</button>
    </>
  );
}
```

Conditonal rendering might create different position even if same component is rendering at same position.

```js
<div>
{isFancy ? 
	<Counter isFancy={true} /> :
	<Counter isFancy={false} />
}
</div>
// React will track Counter at one position so switching will preserve state

<div>
	isFancy && <Counter />
	!isFancy && <Counter />
</div>
// React will track Counter at two places so changing isFancy will destroy Counter from position 1 and render at position 2. So it will be same component at different position hence state is reset.
```

#### Reset state for same component at same place

There are two ways to reset state on re-rendering same component at same place:

1. Render component at different position
2. Given explicit identity to each component `key'

```js
// Preserve state
<div>
{isFancy ? 
	<Counter isFancy={true} /> :
	<Counter isFancy={false} />
}
</div>

// Reset state - 1
<div>
	isFancy && <Counter />
	!isFancy && <Counter />
</div>

// Reset state - 2
<div>
{isFancy ? 
	<Counter key="Fancy" isFancy={true} /> :
	<Counter key="NotFancy" isFancy={false} />
}
</div>
```

`keys` are not globally unique. They only specify the position within the parent.

#### Preserving state for removed component

1. Render all component and hide them using css instead of removing them in react.
2. Lift the state up to track all component state
3. Track state from different source like `localStorage`

## React fiber

- React Fiber is the internal rewrite of React’s reconciliation engine introduced in React 16.
- Problem solved:
    - Before Fiber, React updates were synchronous and could block the browser during large renders.
    - React could not interrupt long render work, prioritize updates, or split work across frames.
- How it works:
    - React represents each component as a “fiber” node.
    - Each fiber stores component type, props, state, effects, and links to child/sibling/parent fibers.
    - Rendering is broken into small units of work. React can pause, yield to the browser, and resume later.
    - The render phase builds or updates the fiber tree and records what changes are needed.
    - The commit phase applies those changes to the DOM in one fast pass.
- Key concepts:
    - Render phase is interruptible; commit phase is not.
    - Updates are prioritized so user input and animations can be handled first.
    - Enables features like time-slicing, transitions, Suspense, and concurrent rendering.
- Outcome:
    - More responsive UI for complex apps.
    - Better handling of large updates without blocking the browser.
    - Foundation for modern React features.