# Components & Communication

## Component Basics

### Core Idea

> Vue components are reusable, self-contained units. They are written as **Single File Components (SFCs)** (`.vue` files), which explicitly separate structure, logic, and styling into dedicated blocks.
>
> **React vs Vue Comparison:**
> - In **React**, logic and markup are mixed together via JSX inside a Javascript function. Styling is typically external or relies on third-party libraries (like CSS-in-JS).
> - In **Vue**, a `.vue` file provides dedicated `<template>`, `<script>`, and `<style>` blocks. It keeps HTML, JS, and CSS physically together in one file, but syntactically separated.

### Single File Component (SFC)

```vue
<!-- UserCard.vue -->
<template>
    <div class="user-card">
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
        <button @click="handleClick">Contact</button>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    user: { type: Object, required: true }
})

const emit = defineEmits(['contact'])

function handleClick() {
    emit('contact', props.user.id)
}
</script>

<style scoped>
.user-card {
    padding: 1rem;
    border: 1px solid #ccc;
}
</style>
```

> **React comparison:**
> - `<template>` = JSX return
> - `<script setup>` = component function body
> - `<style scoped>` = CSS Modules or styled-components (scoped to this component only)

---

## Component Communication

### Mental Model — Family Communication

```
Parent → Child:    Props (passing data DOWN)
Child → Parent:    Events/Emits (sending messages UP)
Any → Any:         Provide/Inject (dependency injection)
Global:            Pinia store (shared state)
```

> **React comparison:** React uses props down + callback functions up. Vue uses props down + events (emits) up. The direction is the same, the mechanism differs.

### 1. Props — Parent to Child

```vue
<!-- Parent.vue -->
<template>
    <UserCard :name="userName" :age="userAge" is-active />
</template>

<!-- UserCard.vue (child) -->
<script setup>
// defineProps — declares what props this component accepts
const props = defineProps({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: false
    }
})

// Access: props.name, props.age
</script>
```

**Props are one-way down — READ ONLY**

```js
// ❌ Never mutate props
props.name = 'Jane'  // Vue will warn in dev mode

// ✅ If you need to modify, create a local copy
const localName = ref(props.name)
// or derive with computed
const formattedName = computed(() => props.name.toUpperCase())
```

> **React comparison:** Same concept — props are immutable in both. In React you'd `const [localName, setLocalName] = useState(props.name)`. In Vue you'd `const localName = ref(props.name)`.

### 2. Emits — Child to Parent

```vue
<!-- Child.vue -->
<script setup>
const emit = defineEmits(['update', 'delete'])

function handleSave() {
    emit('update', { id: 1, name: 'New Name' })  // emit event with payload
}

function handleRemove() {
    emit('delete', 1)
}
</script>

<!-- Parent.vue -->
<template>
    <Child @update="onUpdate" @delete="onDelete" />
</template>

<script setup>
function onUpdate(data) {
    console.log('Updated:', data)    // { id: 1, name: 'New Name' }
}
function onDelete(id) {
    console.log('Deleted:', id)      // 1
}
</script>
```

> **React comparison:** In React, parents pass callback functions as props: `<Child onUpdate={handleUpdate} />`. In Vue, child **emits** a named event, parent **listens** with `@eventName`. The mechanism is different but the data flow pattern is identical.

**Event validation (optional but recommended):**

```js
const emit = defineEmits({
    update: (payload) => {
        // validation — return true if valid
        return payload.id && payload.name
    },
    delete: (id) => typeof id === 'number'
})
```

### 3. `v-model` on Components — Two-Way Binding

`v-model` is syntactic sugar for prop + emit combined:

```vue
<!-- Parent.vue -->
<template>
    <!-- These two are equivalent -->
    <CustomInput v-model="searchQuery" />
    <CustomInput :modelValue="searchQuery" @update:modelValue="searchQuery = $event" />
</template>

<!-- CustomInput.vue -->
<script setup>
defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>

<template>
    <input
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
    />
</template>
```

**Named v-model (multiple bindings):**

```vue
<UserForm v-model:firstName="first" v-model:lastName="last" />

<!-- UserForm.vue internally has -->
defineProps(['firstName', 'lastName'])
defineEmits(['update:firstName', 'update:lastName'])
```

> **React comparison:** React doesn't have `v-model`. You manually wire `value` + `onChange`. Vue's `v-model` automates this two-way binding pattern.

### 4. Provide / Inject — Dependency Injection

For deeply nested components where prop drilling is painful.

```vue
<!-- GrandParent.vue -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('dark')
provide('theme', theme)               // provide reactive ref
provide('changeTheme', (t) => {       // provide a function
    theme.value = t
})
</script>

<!-- DeepChild.vue (any level deep) -->
<script setup>
import { inject } from 'vue'

const theme = inject('theme')                       // inject the ref
const changeTheme = inject('changeTheme')            // inject the function
const fontSize = inject('fontSize', '16px')          // with default value
</script>
```

> **React comparison:** `provide/inject` = `React.createContext` + `useContext`. Same concept, different API:
> - `provide` = `<Context.Provider value={...}>`
> - `inject` = `useContext(Context)`

**Key difference from React:** In Vue, provided refs maintain reactivity — changes in the provider automatically update all injectors. In React, context changes trigger re-renders of all consumers.

### Communication Pattern Summary

| Pattern | Direction | Use Case | React Equivalent |
|---------|-----------|----------|-----------------|
| Props | Parent → Child | Pass data down | `props` |
| Emits | Child → Parent | Notify parent of events | Callback props |
| `v-model` | Two-way | Form inputs, custom components | `value` + `onChange` |
| Provide/Inject | Ancestor → Descendant | Avoid prop drilling | Context API |
| Pinia Store | Any → Any | Global/shared state | Redux/Zustand |
| Template Refs | Parent → Child | Direct child access | `useRef` + `forwardRef` |

---

## Slots

### Core Idea

> Slots let a parent component inject content **into** a child component's template. Think of it as "holes" in a component that the parent can fill.

### Mental Model — USB Ports

A component with slots is like a **laptop with USB ports**. The laptop (child) defines where the ports are. The user (parent) plugs in whatever device they want. The laptop doesn't know or care what's plugged in.

> **React comparison:** Slots = `props.children` (default slot) and render props / named children (named slots).

### Default Slot

```vue
<!-- Card.vue (child) -->
<template>
    <div class="card">
        <slot></slot>   <!-- "hole" that parent fills -->
    </div>
</template>

<!-- Parent.vue -->
<template>
    <Card>
        <h2>Title</h2>           <!-- this content fills the slot -->
        <p>Description</p>
    </Card>
</template>
```

> **React equivalent:** `function Card({ children }) { return <div className="card">{children}</div> }`

### Named Slots

When a component needs **multiple** content areas:

```vue
<!-- Layout.vue (child) -->
<template>
    <header>
        <slot name="header"></slot>
    </header>
    <main>
        <slot></slot>              <!-- default slot (unnamed) -->
    </main>
    <footer>
        <slot name="footer"></slot>
    </footer>
</template>

<!-- Parent.vue -->
<template>
    <Layout>
        <template #header>         <!-- #header is shorthand for v-slot:header -->
            <h1>My App</h1>
        </template>

        <p>Main content goes here</p>   <!-- goes into default slot -->

        <template #footer>
            <p>© 2024</p>
        </template>
    </Layout>
</template>
```

> **React comparison:** Named slots are like passing multiple render props or using an object of components:
> ```jsx
> <Layout header={<h1>My App</h1>} footer={<p>© 2024</p>}>
>     <p>Main content</p>
> </Layout>
> ```

### Scoped Slots — Child Data to Parent Template

The most powerful slot pattern. The **child** exposes data to the **parent's** slot content.

```vue
<!-- ItemList.vue (child) — exposes each item to parent -->
<template>
    <ul>
        <li v-for="item in items" :key="item.id">
            <slot :item="item" :index="index"></slot>
        </li>
    </ul>
</template>

<!-- Parent.vue — decides HOW to render each item -->
<template>
    <ItemList :items="products">
        <template #default="{ item, index }">
            <span>{{ index + 1 }}. {{ item.name }} — ${{ item.price }}</span>
        </template>
    </ItemList>
</template>
```

**What's happening:**
1. Child iterates over data and passes each `item` to the slot via slot props
2. Parent receives slot props and decides the rendering
3. Child owns the **data**, parent owns the **presentation**

> **React comparison:** Scoped slots = render props pattern:
> ```jsx
> <ItemList items={products} renderItem={(item, index) => (
>     <span>{index + 1}. {item.name} — ${item.price}</span>
> )} />
> ```

### Fallback Content

```vue
<!-- Button.vue -->
<template>
    <button>
        <slot>Default Text</slot>   <!-- shown if parent doesn't provide content -->
    </button>
</template>

<!-- Uses fallback -->
<Button />                          <!-- renders: "Default Text" -->

<!-- Overrides fallback -->
<Button>Click Me</Button>           <!-- renders: "Click Me" -->
```

---

## Virtual DOM

### How Vue's Virtual DOM Works

```
Template compiled → Render function → VNode tree → DOM
                                         ↓
State change → New VNode tree → Diff → Patch minimal changes
```

**Step-by-step:**

1. Vue compiles `<template>` into a **render function** at build time (or runtime)
2. Render function creates a **virtual DOM tree** (lightweight JS objects)
3. On state change, render function creates a **new** virtual DOM tree
4. Vue **diffs** old tree vs new tree (reconciliation)
5. Vue applies **only the differences** to the real DOM (patching)

> **React comparison:** Same concept. React creates JSX → virtual DOM → diff → patch. The difference is Vue's compiler can do **static analysis** at compile time to optimize.

### Vue 3 Compiler Optimizations (What Makes Vue Faster)

Vue 3's template compiler performs optimizations that React's JSX cannot:

**1. Static Hoisting** — static nodes are created once and reused

```vue
<template>
    <div>
        <h1>This Never Changes</h1>        <!-- static — hoisted -->
        <p>{{ dynamicContent }}</p>          <!-- dynamic — re-rendered -->
    </div>
</template>
```

The compiler hoists `<h1>` creation outside the render function — it's created once, never re-diffed.

**2. Patch Flags** — marks exactly what can change

```js
// Compiler output marks which parts are dynamic
createVNode("p", null, dynamicContent, 1 /* TEXT */)
// Patch flag 1 = only text content can change
// Vue skips checking attributes, children, etc.
```

**3. Tree Flattening** — skips entire static subtrees during diffing

> **Key insight:** React re-runs the entire component function on every render and diffs the full virtual DOM. Vue's compiler marks static vs dynamic parts, so the runtime only diffs what **can** change.

---

## `key` in `v-for`

### Problem — Without Key

```vue
<!-- ❌ Without key -->
<li v-for="item in items">{{ item.name }}</li>
```

Vue uses an "in-place patch" strategy: if items reorder, Vue doesn't move DOM elements — it patches each element in place. This is efficient for simple lists but **breaks** when:
- Components have local state
- DOM elements have focus, animations, or transitions
- You insert/remove items in the middle

### Why Key Matters

```vue
<!-- ✅ With key -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>
```

**Without key — item reorder example:**

```
Before: [A, B, C]  → DOM: [div-A, div-B, div-C]
After:  [C, A, B]  → Vue patches: div-A→C, div-B→A, div-C→B (3 patches)
```
Vue reuses existing DOM elements and patches their content. If these are components with local state, the state stays with the wrong element.

**With key — Vue matches by key:**

```
Before: [A:1, B:2, C:3]  → DOM: [div-1, div-2, div-3]
After:  [C:3, A:1, B:2]  → Vue moves: div-3, div-1, div-2 (DOM reorder, 0 patches)
```
Vue moves actual DOM elements to match the new order. Component state travels with the correct element.

> **React comparison:** Exact same concept. React's `key` prop serves the same purpose — matching elements across renders for efficient reconciliation.

### Common Mistakes

```vue
<!-- ❌ Using index as key — breaks on reorder/insert/delete -->
<li v-for="(item, index) in items" :key="index">
    <input v-model="item.name" />
</li>

<!-- ❌ Non-unique keys — causes rendering bugs -->
<li v-for="item in items" :key="item.category">

<!-- ✅ Unique, stable identifier -->
<li v-for="item in items" :key="item.id">
```

> **Rule:** Use a unique, stable ID (database ID, UUID). Never use array index if items can be reordered, inserted, or deleted.

---

## Causes of Unnecessary Re-renders

### How Vue Avoids React's Re-render Problem

In React, when parent re-renders, **all children** re-render by default (unless wrapped in `React.memo`). This is React's biggest performance footprint.

In Vue, components only re-render when their **own reactive dependencies** change. Parent re-render does **not** cascade to children unless the child's props actually changed.

```
React:  Parent re-renders → ALL children re-render → need React.memo to prevent
Vue:    Parent re-renders → ONLY children with changed deps re-render → automatic
```

### What DOES Cause Re-renders in Vue

1. **Reactive state changes** — any `ref` or `reactive` property used in template
2. **Props changes** — when parent passes new values
3. **Force update** — `$forceUpdate()` (avoid this)

### Common Performance Pitfalls

```js
// ❌ Creating objects in template — new reference every render
<template>
    <Child :style="{ color: 'red' }" />     <!-- new object every render -->
</template>

// ✅ Use computed or static ref
<script setup>
const childStyle = computed(() => ({ color: theme.value }))
</script>
<template>
    <Child :style="childStyle" />
</template>

// ❌ Inline functions in template
<template>
    <Child @click="() => handleClick(item)" />   <!-- new function every render -->
</template>

// ❌ Mutating reactive data excessively
watchEffect(() => {
    items.value = items.value.map(...)   // triggers re-render every time
})
```

> **Key insight:** Vue's granular reactivity means you rarely need performance optimization compared to React. But when you do, the tools are `computed` (caching), `shallowRef` (skip deep tracking), and `v-memo` (memoize template blocks).

---

## Interview Perspective

**Q: How does component communication work in Vue?**

- Props: Parent → Child (one-way, read-only)
- Emits: Child → Parent (event-based, child emits, parent listens with `@event`)
- v-model: Two-way binding sugar (prop + emit combined)
- Provide/Inject: Ancestor → any descendant (skip intermediate components)
- Pinia: Global state management for any-to-any communication

**Q: What are slots? Explain named and scoped slots.**

- Default slot: `<slot>` = React's `children` — parent injects content into child
- Named slots: Multiple content areas in a component — `<slot name="header">`
- Scoped slots: Child exposes data to parent's slot template — like React render props
- Scoped slots enable "child owns data, parent owns presentation" pattern

**Q: How does Vue virtual DOM work?**

- Template → Render function → VNode tree → Diff → Patch
- Vue 3 compiler optimizes with static hoisting, patch flags, and tree flattening
- Unlike React, Vue marks static vs dynamic parts at compile time — skips diffing static content
- Result: smaller diffing surface, faster updates

**Q: Explain key usage in v-for and why it matters.**

- Keys help Vue identify which items changed/moved/were added/removed
- Without key: Vue patches elements in-place — breaks component state on reorder
- With key: Vue moves DOM elements to match new order — preserves state correctly
- Use unique stable IDs, never array indices (same rule as React)

**Q: What causes unnecessary re-renders in Vue?**

- Vue has granular reactivity — only components with changed dependencies re-render
- Unlike React, parent re-render does NOT cascade to all children
- Common pitfalls: inline objects/functions in templates, excessive reactive mutations
- Vue rarely needs `React.memo` equivalent — reactivity handles it automatically

---

## Key Takeaways

- Vue uses props down + emits up — similar to React's props + callbacks, but event-based
- `v-model` is syntactic sugar for `:modelValue` + `@update:modelValue`
- Provide/inject = Vue's Context API — use for deeply nested component trees
- Slots = flexible content injection — default (children), named, and scoped (render props)
- Vue's virtual DOM has compile-time optimizations React can't do (static hoisting, patch flags)
- Always use unique `:key` in `v-for` — prevents state bugs on list mutation
- Vue components only re-render when their own reactive dependencies change — more efficient than React's default behavior
