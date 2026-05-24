# Core Fundamentals

## What is Vue.js

> Vue is a progressive JavaScript framework for building user interfaces. Unlike React (a library), Vue is an opinionated framework that includes routing, state management, and build tooling out of the box.

### Mental Model — React vs Vue

Think of React as **LEGO bricks** — you pick every piece yourself (routing, state, styling). Vue is like an **IKEA kit** — it gives you a curated set of tools that work together, but you can still swap pieces.

| Aspect | React | Vue |
|--------|-------|-----|
| Type | Library | Framework |
| Template | JSX (JS-first) | HTML templates (HTML-first) |
| State updates | Immutable (`setState`) | Mutable (direct assignment) |
| Reactivity | Manual (`useState`, re-render) | Automatic (proxy-based tracking) |
| Component style | Functions + hooks | Options API or Composition API |
| Ecosystem | Pick your own (React Router, Redux) | Official solutions (Vue Router, Pinia) |
| Learning curve | JSX barrier, then flexible | Easy start, gradual complexity |

---

## Vue 2 vs Vue 3

### Problem It Solves

Vue 2 had fundamental limitations in its reactivity system, code organization, TypeScript support, and performance. Vue 3 was a ground-up rewrite to fix these.

### Key Differences

| Feature | Vue 2 | Vue 3 |
|---------|-------|-------|
| **Reactivity engine** | `Object.defineProperty` — can't detect new property addition or deletion | `Proxy` — tracks everything automatically |
| **API style** | Options API only | Options API + Composition API |
| **Root component** | `new Vue({ el: '#app' })` | `createApp(App).mount('#app')` |
| **Multiple root elements** | Single root element required | Fragments supported (like React) |
| **TypeScript** | Poor support, requires decorators | First-class support, fully typed |
| **Performance** | Larger bundle, slower virtual DOM | Tree-shakable, faster patching |
| **State management** | Vuex | Pinia (recommended) |
| **Lifecycle hooks** | `beforeCreate`, `created`, etc. | `onMounted`, `onUnmounted`, etc. |
| **Teleport** | Not available | `<Teleport>` (like React Portal) |
| **Suspense** | Not available | `<Suspense>` (experimental) |

### Reactivity Engine — The Core Difference

**Vue 2 — Object.defineProperty**

```js
// Vue 2 internally does this for each property
Object.defineProperty(obj, 'name', {
    get() { /* track dependency */ },
    set(val) { /* trigger update */ }
})
```

**Limitations:**
- Cannot detect adding new properties: `this.obj.newProp = 'x'` won't be reactive
- Cannot detect deleting properties: `delete this.obj.prop` won't trigger update
- Must use `Vue.set(obj, 'key', value)` or `this.$set()` as workaround
- Array mutation detection requires overriding array prototype methods

**Vue 3 — Proxy**

```js
// Vue 3 internally wraps the entire object
const state = new Proxy(target, {
    get(target, key) { /* track dependency */ },
    set(target, key, value) { /* trigger update */ }
})
```

**Advantages:**
- Detects **any** property access, addition, or deletion automatically
- Works with arrays natively — no prototype patching
- Better performance — no need to recursively walk all properties upfront

> **React comparison:** React doesn't have a reactivity system at all. You tell React "something changed" via `setState`. Vue **knows** what changed because it's tracking your property access through proxies.

### Mental Model — Reactivity Engine

Vue 2 is like putting a **security camera on each room** — you have to install cameras in advance, and new rooms won't have cameras. Vue 3 is like having a **smart building system** — it monitors the entire building automatically, including any new rooms added later.

### Breaking Changes Summary

```js
// Vue 2
new Vue({
    el: '#app',
    data: { count: 0 },
    template: '<div>{{ count }}</div>'
})

// Vue 3
import { createApp, ref } from 'vue'
const app = createApp({
    setup() {
        const count = ref(0)
        return { count }
    },
    template: '<div>{{ count }}</div>'
})
app.mount('#app')
```

> **Interview tip:** The move from `Object.defineProperty` to `Proxy` is the single most important architectural change. It fixed the most common source of bugs in Vue 2 (reactivity caveats with objects and arrays).

---

## Options API vs Composition API

### Problem — Options API's Limitation

In Options API, a component's logic is organized by **option type** (data, methods, computed, watch). As components grow, related logic gets scattered across options.

```js
// Options API — logic for "search" is scattered
export default {
    data() {
        return {
            searchQuery: '',    // ← search logic here
            userData: null,     // ← user logic here
        }
    },
    computed: {
        filteredResults() {},   // ← search logic here
        userFullName() {},      // ← user logic here
    },
    methods: {
        handleSearch() {},      // ← search logic here
        fetchUser() {},         // ← user logic here
    },
    watch: {
        searchQuery() {},       // ← search logic here
    }
}
```

**Problem:** As the component grows, you're jumping between `data`, `methods`, `computed`, and `watch` to understand a single feature.

> **React comparison:** Imagine if React forced you to put all `useState` in one block, all `useEffect` in another, and all handler functions in yet another. That's Options API.

### Solution — Composition API

Composition API lets you organize code by **logical concern**, not by option type.

```js
// Composition API — search logic is together
import { ref, computed, watch } from 'vue'

function useSearch() {                    // ← all search logic together
    const searchQuery = ref('')
    const filteredResults = computed(() => { /* ... */ })
    watch(searchQuery, () => { /* ... */ })
    function handleSearch() { /* ... */ }
    return { searchQuery, filteredResults, handleSearch }
}

function useUser() {                      // ← all user logic together
    const userData = ref(null)
    const userFullName = computed(() => { /* ... */ })
    async function fetchUser() { /* ... */ }
    return { userData, userFullName, fetchUser }
}

export default {
    setup() {
        const { searchQuery, filteredResults, handleSearch } = useSearch()
        const { userData, userFullName, fetchUser } = useUser()
        return { searchQuery, filteredResults, handleSearch, userData, userFullName, fetchUser }
    }
}
```

### Mental Model — Options API vs Composition API

**Options API** = Organizing a filing cabinet **by document type** (contracts in one drawer, invoices in another). To work on "Project X", you open every drawer.

**Composition API** = Organizing **by project** (everything about Project X in one folder). Each folder is self-contained.

### Side-by-Side Comparison

| Aspect | Options API | Composition API |
|--------|-------------|-----------------|
| Organization | By option type | By logical concern |
| Reusability | Mixins (problematic) | Composables (clean) |
| TypeScript | Difficult to type | Full type inference |
| `this` keyword | Required everywhere | Not needed |
| Learning curve | Easier for beginners | Requires understanding reactivity |
| Code sharing | Mixins, HOCs | Composable functions |
| React equivalent | Class components | Hooks (functional components) |

> **Key insight:** Composition API is to Options API what React Hooks are to Class Components — same capabilities, better organization and reusability.

### `<script setup>` — Syntactic Sugar

`<script setup>` is a compile-time sugar that simplifies Composition API syntax:

```vue
<!-- Without <script setup> -->
<script>
import { ref } from 'vue'

export default {
    setup() {
        const count = ref(0)
        function increment() { count.value++ }
        return { count, increment }
    }
}
</script>

<!-- With <script setup> — recommended -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
function increment() { count.value++ }
// No need to return — everything is auto-exposed to template
</script>
```

> **Mental model:** `<script setup>` is like React functional components — the entire body is your "setup". Everything declared is available in the template without explicit return.

---

## Reactivity System — Internal Working

### Core Idea

> Vue's reactivity system automatically tracks which data a component uses during rendering, and re-renders **only the affected components** when that data changes.

### How It Works — Step by Step

```
1. Component renders → template reads `state.count`
2. Vue's Proxy intercepts the `get` on `count`
3. Vue records: "This component depends on `count`"
4. Later: `state.count = 5`
5. Vue's Proxy intercepts the `set` on `count`
6. Vue looks up: "Which components depend on `count`?"
7. Vue re-renders only those components
```

### Mental Model — Spreadsheet

Vue's reactivity is like a **spreadsheet**:
- Cell A1 = 10, Cell A2 = 20
- Cell A3 = `=A1 + A2` → shows 30
- Change A1 to 15 → A3 **automatically** updates to 35

The spreadsheet knows which cells depend on which, and updates only what's needed. Vue does the same with your component state and DOM.

> **React comparison:** React is like manually pressing "recalculate" (`setState`) on a spreadsheet, and it recalculates **everything** in the component (then uses virtual DOM diffing to minimize DOM changes). Vue knows **exactly** which cells changed and only recalculates those.

### Internal Architecture

```
         ┌──────────────┐
         │  Reactive     │
         │  State (Proxy)│
         └──────┬───────┘
                │
         ┌──────┴───────┐
    GET  │              │  SET
    (track)             (trigger)
         │              │
    ┌────▼────┐    ┌────▼────┐
    │  Effect  │    │  Effect  │
    │ (render) │    │ (render) │
    └────┬────┘    └────┬────┘
         │              │
    ┌────▼────┐    ┌────▼────┐
    │   DOM    │    │   DOM    │
    └─────────┘    └─────────┘
```

**Key concepts:**
- **Effect** — a function that runs when reactive data changes (component render, watchers, computed)
- **Track** — when reactive data is read inside an effect, Vue records the dependency
- **Trigger** — when reactive data is written, Vue re-runs all effects that depend on it

### Simplified Reactive Implementation

```js
// Simplified version of how Vue 3 reactivity works
let activeEffect = null

function reactive(obj) {
    return new Proxy(obj, {
        get(target, key) {
            // TRACK: record that activeEffect depends on this key
            if (activeEffect) {
                track(target, key)
            }
            return target[key]
        },
        set(target, key, value) {
            target[key] = value
            // TRIGGER: re-run all effects that depend on this key
            trigger(target, key)
            return true
        }
    })
}

function effect(fn) {
    activeEffect = fn
    fn()                 // run once — this triggers `get` traps, recording deps
    activeEffect = null
}
```

> This is the core of Vue's reactivity. When a component renders, Vue wraps the render function in an `effect`. During render, any reactive data accessed is "tracked". When that data changes later, the render effect is "triggered" again.

---

## `ref` vs `reactive`

### `ref` — Single Value Wrapper

```js
import { ref } from 'vue'

const count = ref(0)           // wraps value in { value: 0 }
console.log(count.value)       // 0
count.value++                  // triggers reactivity
console.log(count.value)       // 1
```

> In templates, `.value` is automatically unwrapped: `{{ count }}` works (not `{{ count.value }}`)

### `reactive` — Object Wrapper

```js
import { reactive } from 'vue'

const state = reactive({
    count: 0,
    name: 'Vue'
})
console.log(state.count)       // 0 — no .value needed
state.count++                  // triggers reactivity
```

### Why Two APIs?

| Aspect | `ref` | `reactive` |
|--------|-------|------------|
| Works with | Any type (primitives + objects) | Objects only |
| Access | `.value` in JS, auto-unwrap in template | Direct property access |
| Reassignment | `myRef.value = newValue` works | `state = newObj` **breaks** reactivity |
| Destructuring | Safe (returns ref object) | **Breaks** reactivity |
| React equivalent | `useState` return value | N/A (React doesn't have this) |

### The Destructuring Trap

```js
// reactive — BROKEN after destructuring
const state = reactive({ count: 0 })
let { count } = state          // count is now a plain number, not reactive!
count++                        // does NOT trigger any update

// ref — SAFE
const count = ref(0)
// There's nothing to destructure — count itself is the reactive wrapper
count.value++                  // triggers update
```

> **Why it breaks:** Destructuring copies the primitive value out of the proxy. The proxy can no longer track access to that copied value.

### Mental Model

- `ref` = a **box** with a reactive label on it. The box holds one thing. You always open the box (`.value`) to read or change what's inside.
- `reactive` = a **reactive object** where every property is tracked. But if you take a property out (destructure), you lose the tracking.

> **React comparison:** `ref(0)` is conceptually similar to `useState(0)` — both wrap a single value. But `ref` gives you a mutable `.value` property instead of a setter function. No re-render scheduling — Vue handles it automatically.

### Best Practice

```js
// Prefer ref for most cases
const count = ref(0)
const user = ref({ name: 'John', age: 25 })

// Use reactive for complex local state with many properties
const form = reactive({
    email: '',
    password: '',
    rememberMe: false,
    errors: {}
})
```

> **Rule of thumb:** Use `ref` by default. Use `reactive` when you have a group of related state that you'll never need to reassign as a whole.

---

## Template Syntax Basics

### Text Interpolation

```vue
<template>
    <span>{{ message }}</span>           <!-- reactive text -->
    <span v-html="rawHtml"></span>       <!-- render HTML (XSS risk!) -->
</template>
```

### Attribute Binding

```vue
<template>
    <!-- v-bind (or shorthand :) binds attributes -->
    <img v-bind:src="imageUrl" />
    <img :src="imageUrl" />              <!-- shorthand -->

    <!-- Dynamic class binding -->
    <div :class="{ active: isActive, 'text-danger': hasError }"></div>
    <div :class="[baseClass, { active: isActive }]"></div>

    <!-- Dynamic style binding -->
    <div :style="{ color: textColor, fontSize: size + 'px' }"></div>
</template>
```

> **React comparison:** `:src="imageUrl"` is like `src={imageUrl}` in JSX. Vue uses directives (`:`, `v-bind`), React uses curly braces `{}`.

### Event Handling

```vue
<template>
    <!-- v-on (or shorthand @) handles events -->
    <button v-on:click="handleClick">Click</button>
    <button @click="handleClick">Click</button>         <!-- shorthand -->
    <button @click="count++">Inline</button>             <!-- inline expression -->
    <button @click="handleClick($event)">With Event</button>

    <!-- Event modifiers -->
    <form @submit.prevent="onSubmit"></form>              <!-- preventDefault -->
    <div @click.stop="onClick"></div>                     <!-- stopPropagation -->
    <input @keyup.enter="submit" />                       <!-- key modifier -->
</template>
```

> **React comparison:** `@click="handler"` = `onClick={handler}`. Vue has built-in event modifiers (`.prevent`, `.stop`), React requires calling `e.preventDefault()` manually.

### Conditional Rendering — `v-if` vs `v-show`

```vue
<template>
    <!-- v-if: creates/destroys DOM elements -->
    <div v-if="type === 'A'">A</div>
    <div v-else-if="type === 'B'">B</div>
    <div v-else>Default</div>

    <!-- v-show: toggles CSS display property -->
    <div v-show="isVisible">Always in DOM</div>
</template>
```

| Aspect | `v-if` | `v-show` |
|--------|--------|----------|
| DOM behavior | Creates/destroys element | Toggles `display: none` |
| Initial render cost | Lazy — skips if false | Always renders |
| Toggle cost | Expensive (rebuild DOM tree) | Cheap (CSS toggle) |
| Component lifecycle | Runs mount/unmount hooks | Only runs once on mount |
| Use when | Condition rarely changes | Condition toggles frequently |
| React equivalent | `{condition && <Component />}` | `style={{ display: condition ? 'block' : 'none' }}` |

> **Mental model:** `v-if` is an **electrician** who connects/disconnects wiring. `v-show` is a **curtain** — the window is always there, you just hide it.

### List Rendering

```vue
<template>
    <!-- v-for: loop rendering -->
    <li v-for="item in items" :key="item.id">
        {{ item.name }}
    </li>

    <!-- With index -->
    <li v-for="(item, index) in items" :key="item.id">
        {{ index }}: {{ item.name }}
    </li>

    <!-- Object iteration -->
    <li v-for="(value, key) in myObject" :key="key">
        {{ key }}: {{ value }}
    </li>
</template>
```

> **Critical:** Always provide `:key` with a **unique, stable** identifier. See [key usage in v-for](#) for why this matters.

---

## Interview Perspective

**Q: What is the difference between Vue 2 and Vue 3?**

Key points to articulate:
1. **Reactivity:** `Object.defineProperty` → `Proxy` (fixes property detection issues)
2. **API:** Options API only → Options API + Composition API
3. **TypeScript:** Poor → First-class support
4. **Performance:** Tree-shaking, faster virtual DOM, smaller bundle
5. **New features:** Teleport, Suspense, Fragments, `<script setup>`

**Q: What are refs and reactive in Composition API?**

- `ref` wraps **any value** in a reactive container, accessed via `.value`
- `reactive` wraps an **object** with a Proxy, accessed directly
- `ref` is safer for reassignment and destructuring
- `reactive` is convenient for complex objects but breaks when destructured

**Q: Difference between Composition API and Options API?**

- Options API organizes by **type** (data/methods/computed) — good for small components
- Composition API organizes by **logical concern** — better for complex components and code reuse
- Composition API's composables replace mixins (which had name conflicts and unclear sources)
- Think of it as the Vue equivalent of React's move from class components to hooks

---

## Key Takeaways

- Vue's reactivity is **automatic** — it tracks dependencies through Proxy. React requires **manual** signaling via `setState`.
- Prefer `ref` over `reactive` as default choice — it's safer with destructuring and reassignment.
- Composition API is Vue's answer to React Hooks — organize by feature, not by option type.
- `<script setup>` eliminates boilerplate — everything declared is available in the template.
- `v-if` adds/removes from DOM; `v-show` toggles CSS display.
- Vue 3's Proxy-based reactivity fixes all the caveats of Vue 2's `Object.defineProperty`.
