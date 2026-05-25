# Computed, Watch & Lifecycle

## Computed Properties

### Core Idea

> Computed properties are **derived values** that automatically recalculate when their dependencies change. They are cached and only re-evaluate when a dependency changes.

### Mental Model — Spreadsheet Formula

A computed property is a **spreadsheet cell with a formula**. Cell C1 = `=A1 + B1`. You never manually update C1 — it updates itself when A1 or B1 changes. If nothing changes, the spreadsheet returns the cached result instantly.

> **React comparison:** `computed` = `useMemo` with automatic dependency tracking. In React, you manually specify dependencies: `useMemo(() => a + b, [a, b])`. In Vue, dependencies are **automatically** detected.

### Syntax

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Computed: auto-tracks firstName and lastName
const fullName = computed(() => {
    return `${firstName.value} ${lastName.value}`
})

// Writable computed (rare but useful)
const fullNameWritable = computed({
    get() {
        return `${firstName.value} ${lastName.value}`
    },
    set(newValue) {
        const [first, last] = newValue.split(' ')
        firstName.value = first
        lastName.value = last
    }
})
</script>

<template>
    <p>{{ fullName }}</p>  <!-- "John Doe" — no .value in template -->
</template>
```

### Computed vs Methods

> **💡 Quick Definition: Side Effect**
> A **side effect** is any operation that modifies state outside its local environment or interacts with the outside world.
> - **Pure (No side effects):** Takes inputs, returns output. Changes nothing else. (e.g., math calculations, string formatting).
> - **Side Effects:** API calls, changing the DOM, writing to `localStorage`, setting timers (`setTimeout`), or mutating external variables.
> 
> *Computed properties must be pure. Methods and Watchers exist to handle side effects.*

| Aspect | Computed | Method |
|--------|----------|--------|
| Caching | Yes — returns cached result if deps unchanged | No — re-runs every time it's called |
| Usage in template | Access like property: `{{ fullName }}` | Call like function: `{{ getFullName() }}` |
| Side effects | Should **not** have side effects | Can have side effects |
| Performance | Better for expensive calculations | Use for event handlers or actions |

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

// ✅ Computed — cached, recalculates only when items change
const expensiveTotal = computed(() => {
    console.log('computed recalculated')    // logs only when items change
    return items.value.reduce((sum, i) => sum + i, 0)
})

// ❌ Method — recalculates on EVERY re-render
function getTotal() {
    console.log('method recalculated')      // logs on every render
    return items.value.reduce((sum, i) => sum + i, 0)
}
</script>

<template>
    <p>{{ expensiveTotal }}</p>  <!-- computed: cached -->
    <p>{{ getTotal() }}</p>      <!-- method: recalculated every render -->
</template>
```

> **Rule:** If it derives a value from reactive state without side effects → use `computed`. If it performs an action or has side effects → use a method.

---

## Watch and WatchEffect

### Problem — When Computed Isn't Enough

Computed is for **deriving values**. But sometimes you need to **perform side effects** when data changes — API calls, logging, DOM manipulation, localStorage sync.

### `watch` — Explicit Dependencies

```js
import { ref, watch } from 'vue'

const searchQuery = ref('')

// Watch a single ref
watch(searchQuery, (newValue, oldValue) => {
    console.log(`Changed from "${oldValue}" to "${newValue}"`)
    fetchResults(newValue)    // side effect: API call
})

// Watch a reactive object's property
const user = reactive({ name: 'John', age: 25 })
watch(
    () => user.name,          // getter function for reactive property
    (newName, oldName) => {
        console.log(`Name changed: ${oldName} → ${newName}`)
    }
)

// Watch multiple sources
watch(
    [searchQuery, () => user.name],
    ([newQuery, newName], [oldQuery, oldName]) => {
        console.log('Either changed')
    }
)
```

### `watchEffect` — Automatic Dependencies

```js
import { ref, watchEffect } from 'vue'

const searchQuery = ref('')
const category = ref('all')

// Runs immediately, auto-tracks dependencies
watchEffect(() => {
    console.log(`Searching "${searchQuery.value}" in "${category.value}"`)
    fetchResults(searchQuery.value, category.value)
})
// No dependency array needed — Vue detects which refs are read
```

### `watch` vs `watchEffect`

| Aspect | `watch` | `watchEffect` |
|--------|---------|---------------|
| Dependencies | Explicitly specified | Automatically tracked |
| Initial run | Does **not** run immediately (unless `{ immediate: true }`) | Runs **immediately** |
| Old value access | Yes — `(newVal, oldVal)` | No |
| Lazy | Yes — runs only on change | No — runs once, then on change |
| React equivalent | `useEffect` with explicit deps | `useEffect` with auto deps (doesn't exist in React) |

> **React comparison:** `watch` is like `useEffect(() => { ... }, [dep1, dep2])` — you specify what to watch. `watchEffect` is like if `useEffect` could auto-detect dependencies — Vue tracks reactive reads inside the callback.

### Computed vs Watch — When to Use Which

| Scenario | Use `computed` | Use `watch` |
|----------|---------------|-------------|
| Derive a value | ✅ `fullName` from first + last | ❌ |
| Filter/sort a list | ✅ `filteredItems` | ❌ |
| API call on change | ❌ | ✅ `watch(query, fetchResults)` |
| Update localStorage | ❌ | ✅ `watch(theme, saveToStorage)` |
| Complex async operations | ❌ | ✅ |
| No side effects | ✅ | ❌ (overkill) |
| Need old value | ❌ | ✅ |

> **Key rule:** If you can express it as "value Y is derived from value X" → computed. If you need to "do something when X changes" → watch.

### Watch Options

```js
// Run immediately on creation
watch(source, callback, { immediate: true })

// Deep watch — track nested object changes
watch(source, callback, { deep: true })

// Only trigger once
watch(source, callback, { once: true })

// Flush timing — when the callback runs relative to DOM updates
watch(source, callback, { flush: 'post' })    // after DOM update (default: 'pre')
```

> **Deep watch warning:** Deep watching large objects is expensive — Vue recursively traverses every nested property. Prefer watching specific properties with getter functions: `watch(() => state.user.address.city, callback)`.

---

## Lifecycle Hooks

### Mental Model — Component Birth to Death

Think of a Vue component's lifecycle as a **human life**:

```
Birth → Childhood → Active Life → Death
Setup → Mounted → Updated (many times) → Unmounted
```

### Lifecycle Flow

```
┌─────────────────────────────────────────┐
│              <script setup>             │
│       (Composition API setup runs)      │
│                                         │
│  Reactive state created                 │
│  Computed/watchers initialized          │
│                                         │
│  onBeforeMount() ←── DOM not ready yet  │
└───────────────┬─────────────────────────┘
                │
        ┌───────▼───────┐
        │  DOM Mounted   │
        │  onMounted()   │←── DOM is ready, can access elements
        └───────┬───────┘
                │
        ┌───────▼───────────────┐
        │  Reactive Data Change  │◄─── loop
        │  onBeforeUpdate()      │
        │  DOM re-rendered       │
        │  onUpdated()           │
        └───────┬───────────────┘
                │
        ┌───────▼───────┐
        │  Component     │
        │  Removed       │
        │  onBeforeUnmount() │
        │  onUnmounted()     │←── cleanup: timers, listeners, subs
        └───────────────┘
```

### Options API vs Composition API Hooks

| Options API | Composition API | When it runs |
|------------|-----------------|--------------|
| `beforeCreate` | — (use `setup()` itself) | Before reactive data initialized |
| `created` | — (use `setup()` itself) | After reactive data initialized |
| `beforeMount` | `onBeforeMount` | Before initial DOM render |
| `mounted` | `onMounted` | After DOM is mounted |
| `beforeUpdate` | `onBeforeUpdate` | Before DOM re-render |
| `updated` | `onUpdated` | After DOM re-render |
| `beforeUnmount` | `onBeforeUnmount` | Before component destroyed |
| `unmounted` | `onUnmounted` | After component destroyed |

> In `<script setup>`, the code itself replaces `beforeCreate` and `created`. It runs during component initialization.

### Real-World Use Cases

```vue
<script setup>
import { ref, onMounted, onUnmounted, onUpdated } from 'vue'

// onMounted — DOM is ready
// Use for: API calls, DOM manipulation, third-party library init
onMounted(() => {
    console.log('Component mounted — DOM is accessible')
    fetchData()
    initChart()
})

// onUnmounted — Cleanup
// Use for: Remove event listeners, clear timers, cancel API requests
// React equivalent: useEffect cleanup function
const timer = ref(null)
onMounted(() => {
    timer.value = setInterval(() => { /* ... */ }, 1000)
})
onUnmounted(() => {
    clearInterval(timer.value)           // prevent memory leak
    window.removeEventListener('resize', handleResize)
})

// onUpdated — DOM just re-rendered
// Use for: Read updated DOM (rare)
onUpdated(() => {
    console.log('DOM updated — new content rendered')
})
</script>
```

> **React comparison:**
> - `onMounted` ≈ `useEffect(() => { ... }, [])` (empty deps)
> - `onUnmounted` ≈ `useEffect` cleanup function: `useEffect(() => { return () => cleanup() }, [])`
> - `onUpdated` ≈ `useEffect(() => { ... })` (no deps — runs after every render)

### Common Mistake — API Calls

```js
// ❌ Wrong — can't use await at top level of setup to block rendering
const data = await fetchData()  // blocks component render

// ✅ Correct — fetch in onMounted, store in ref
const data = ref(null)
const loading = ref(true)

onMounted(async () => {
    try {
        data.value = await fetchData()
    } finally {
        loading.value = false
    }
})
```

---

## `nextTick`

### Problem

Vue batches DOM updates. When you change reactive data, the DOM doesn't update **immediately** — it updates asynchronously in the next "tick" (microtask).

```js
const count = ref(0)
count.value = 1

// DOM still shows 0 here!
console.log(document.getElementById('counter').textContent) // "0"
```

### Solution — `nextTick`

`nextTick` returns a promise that resolves after Vue has updated the DOM.

```js
import { nextTick, ref } from 'vue'

const count = ref(0)
count.value = 1

await nextTick()
// NOW the DOM is updated
console.log(document.getElementById('counter').textContent) // "1"
```

### Mental Model

Vue collects all state changes in a "batch" and applies them to the DOM in one go (like React's batching). `nextTick` is saying: "Tell me when you're done with the batch."

> **React comparison:** React batches `setState` calls similarly. React 18's automatic batching is equivalent. `nextTick` is like `flushSync` in reverse — instead of forcing immediate update, it waits for the batch to complete.

### Real-World Use Cases

```js
// 1. Reading DOM after state change
const showModal = ref(false)
async function openModal() {
    showModal.value = true
    await nextTick()
    // Modal is now in DOM — safe to focus input inside it
    document.querySelector('#modal-input').focus()
}

// 2. Measuring element after content change
const items = ref([])
async function addItem(item) {
    items.value.push(item)
    await nextTick()
    // List is now updated in DOM — safe to scroll to bottom
    const list = document.querySelector('.list')
    list.scrollTop = list.scrollHeight
}
```

---

## Interview Perspective

**Q: When would you use computed vs watch?**

- `computed` = deriving a value (pure function, cached, no side effects)
- `watch` = reacting to changes (side effects: API calls, storage, logging)
- Use computed when the answer is "what should Y be based on X?"
- Use watch when the answer is "what should I **do** when X changes?"

**Q: Explain Vue lifecycle hooks with real use cases.**

- `onMounted` → API calls, DOM manipulation, third-party library init
- `onUnmounted` → Cleanup (timers, event listeners, subscriptions) — prevents memory leaks
- `onUpdated` → Read updated DOM (rare, usually better to use watch)
- `setup()` body → Initialize reactive state, computed, watchers

**Q: What is nextTick and when is it needed?**

- Vue batches DOM updates asynchronously (like React's batching)
- `nextTick` returns a promise that resolves after DOM is updated
- Use when you need to read/interact with DOM after changing reactive state
- Common uses: focus an input after showing a modal, scroll after adding items, measure elements

---

## Key Takeaways

- `computed` is cached and auto-tracks dependencies — use for derived values without side effects
- `watch` is for side effects — API calls, storage, DOM manipulation
- `watchEffect` auto-tracks dependencies and runs immediately — simpler than `watch` when you don't need old values
- Lifecycle hooks in Composition API are `onMounted`, `onUnmounted`, etc. — called inside `setup`
- `nextTick` waits for Vue's DOM update batch to complete — needed when reading DOM after state change
- Vue automatically detects dependencies in `computed` and `watchEffect` — no manual dependency array like React
