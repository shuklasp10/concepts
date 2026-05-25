# Advanced Topics: Proxy and Reflect

## Core Idea in One Sentence
A Proxy is a wrapper around an object that intercepts and redefines fundamental operations (like reading, writing, or deleting properties) on that object.

## Problem It Solves
Historically, if you wanted to know when a property on an object was accessed or changed, you had to use getters and setters (`Object.defineProperty`). 
**Limitations of older approach:**
- You had to know the property names in advance.
- You couldn't easily detect when a *new* property was added.
- You couldn't intercept array index mutations easily (a major pain point in Vue 2).

Proxies solve this by intercepting operations on the **entire object**, not just specific predefined properties.

## Mental Model — The Security Guard / Middleman
Imagine a highly exclusive VIP club (the **Target Object**). 
You cannot talk to the VIP directly. Instead, you must talk to their **Bodyguard (the Proxy)**.
The Bodyguard has a **rulebook (the Handler)** with instructions (**Traps**) on what to do when someone tries to interact with the VIP.

- Want to get the VIP's name? The bodyguard intercepts the request, checks the rules, and decides whether to tell you.
- Want to change the VIP's schedule? The bodyguard intercepts, validates the change, and applies it to the VIP.

## Core Concepts
To create a Proxy, you need three things:
1. **Target**: The original object you want to wrap.
2. **Handler**: An object containing the rules (traps).
3. **Traps**: Methods in the handler that intercept operations (e.g., `get`, `set`, `has`, `deleteProperty`).

## Syntax / API

```javascript
const target = { name: "Alice", age: 25 };

const handler = {
    // Trap for reading properties
    get(target, property) {
        console.log(`Someone is reading ${property}`);
        return target[property];
    },
    // Trap for writing properties
    set(target, property, value) {
        console.log(`Someone is setting ${property} to ${value}`);
        target[property] = value;
        return true; // Indicate success
    }
};

// Create the Proxy
const proxy = new Proxy(target, handler);

proxy.name; // Logs: Someone is reading name
proxy.age = 26; // Logs: Someone is setting age to 26
```

## Internal Working: How Interception Happens
```
User code: proxy.age = 26
       ↓
JavaScript Engine detects operation on a Proxy
       ↓
Looks inside the Proxy's `handler` for a `set` trap
       ↓
Is there a `set` trap?
   ├── YES: Execute the trap function.
   └── NO:  Forward the operation directly to the `target`.
```

## Real-World Engineering Examples

### 1. Data Validation (Strict Types)
Ensuring an object only accepts valid data types.

```javascript
const user = {};
const userProxy = new Proxy(user, {
    set(target, prop, value) {
        if (prop === 'age') {
            if (typeof value !== 'number') {
                throw new TypeError('Age must be a number');
            }
            if (value < 0) {
                throw new RangeError('Age cannot be negative');
            }
        }
        target[prop] = value;
        return true;
    }
});

userProxy.age = 25; // ✅ Works
userProxy.age = "twenty"; // ❌ TypeError: Age must be a number
```

### 2. The Vue 3 Reactivity System (Mental Model)
Vue 3 uses Proxies to know exactly when state changes so it can re-render components.

```javascript
// Extremely simplified Vue 3 reactive()
function reactive(target) {
    return new Proxy(target, {
        get(target, prop) {
            // TRACK: "The current component is reading this property"
            trackDependency(target, prop);
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            // TRIGGER: "This property changed, notify components to re-render"
            triggerUpdate(target, prop);
            return true;
        }
    });
}
```

### 3. Default Object Values (Python's defaultdict)
Returning a default value instead of `undefined` when a property doesn't exist.

```javascript
const defaults = new Proxy({}, {
    get(target, prop) {
        return prop in target ? target[prop] : "Not Found";
    }
});

console.log(defaults.name); // "Not Found" instead of undefined
```

---

## Enter `Reflect` — The Proxy's Best Friend

### Why `Reflect` exists
In the examples above, we did `target[prop] = value` inside the proxy trap. While this works for simple cases, it breaks down with complex prototypes and getters/setters (specifically, the `this` context gets messed up).

The `Reflect` object provides methods that **exactly match** the Proxy traps. It is the "correct" way to forward the intercepted operation back to the original target.

### Mental Model for Reflect
If the Proxy is the Bodyguard intercepting the message, **Reflect is the Bodyguard turning around and whispering the exact same message to the VIP**.

### The "Correct" Proxy Pattern
Always use `Reflect` inside Proxy traps!

```javascript
const handler = {
    get(target, prop, receiver) {
        console.log(`Reading ${prop}`);
        // CORRECT: Forwards the exact operation, preserving 'this' (receiver)
        return Reflect.get(target, prop, receiver); 
    },
    set(target, prop, value, receiver) {
        console.log(`Setting ${prop} = ${value}`);
        // CORRECT: Returns true/false indicating success
        return Reflect.set(target, prop, value, receiver);
    }
};
```

### Why `target[prop]` fails without Reflect
If the target object has a getter that uses `this`, and you access it via a child object that inherits from the proxy, `this` will point to the *wrong object* if you just use `target[prop]`. `Reflect.get(target, prop, receiver)` ensures `this` correctly points to the `receiver` (the original object that made the call).

---

## Trade-offs and Performance Considerations

| Pro | Con |
|-----|-----|
| **Deep Interception:** Catches property additions, deletions (`delete obj.prop`), and array mutations automatically. | **Performance Overhead:** Intercepting operations is slower than direct object access. Avoid using Proxies in tight performance-critical loops (e.g., rendering thousands of frames/sec). |
| **Separation of Concerns:** Keeps validation/logging logic outside of the business data. | **Polyfill Issues:** Proxies cannot be perfectly polyfilled for older browsers (like IE11). |
| **No Boilerplate:** Don't need to define every property manually like `Object.defineProperty`. | **Opaque:** `console.log(proxy)` can sometimes be confusing in DevTools, though modern browsers handle it well. |

---

## Common Mistakes
1. **Infinite Loops in Traps**: Doing `proxy.prop` inside the `get` trap of that same `proxy` will cause an infinite loop. Always interact with the `target` or use `Reflect`.
2. **Forgetting to return `true` in `set` trap**: In strict mode, if a `set` trap doesn't return `true`, it throws a `TypeError`.

---

## Interview Perspective

**Q: What is a Proxy in JavaScript?**
A Proxy is an object that wraps another object and intercepts fundamental operations (like reading, setting, or deleting properties) using traps. 

**Q: How does Vue 3 reactivity differ from Vue 2?**
Vue 2 used `Object.defineProperty` which required walking the object and defining getters/setters for *existing* properties. It couldn't detect new property additions or array index mutations.
Vue 3 uses `Proxy`, which intercepts operations on the *entire object*, automatically catching new properties and array changes, resulting in fewer bugs and better performance.

**Q: Why do we use `Reflect` inside Proxy traps?**
To safely forward the operation to the target object. Crucially, `Reflect` methods accept a `receiver` argument, which ensures that `this` context is preserved correctly when dealing with getters/setters and prototype inheritance.

---

## Key Takeaways
- **Proxy** intercepts operations on objects.
- **Target** = Original object. **Handler** = Rules. **Traps** = The specific intercepted operations.
- Always pair **Proxy** with **Reflect** to ensure correct `this` binding and execution.
- Proxies are the magic behind modern frontend reactivity (Vue 3, MobX).
