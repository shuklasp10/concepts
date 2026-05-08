# Example

## pattern example 1

[⬅ go back](1_core-fundamentals.md#patterns)

### problem

```javascript
const App = () => {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      <p>Your selected color: {color}</p>
      <ExpensiveTree />   {/* 🔴 This re-renders every keystroke! */}
      <AnotherHeavyComponent />  {/* 🔴 This too! */}
    </div>
  );
};
```

### solution

```javascript
// This component OWNS the state and re-renders on every keystroke
const ColorPicker = () => {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      <p>Your selected color: {color}</p>
    </div>
  );
};

// App no longer has any state, so it NEVER re-renders after mount
const App = () => {
  return (
    <div>
      <ColorPicker />              {/* Only this re-renders */}
      <ExpensiveTree />            {/* ✅ Never re-renders! */}
      <AnotherHeavyComponent />    {/* ✅ Never re-renders! */}
    </div>
  );
};

```

[⬅ go back](1_core-fundamentals.md#patterns)

