# Advanced Reactivity

## `ref` vs `shallowRef`

### Core Idea

> `ref` creates **deep** reactivity — every nested property is tracked. `shallowRef` creates **shallow** reactivity — only `.value` reassignment is tracked, nested changes are ignored.

### Mental Model

- `ref` = a **security-monitored box** — cameras track everything inside, even items within items
- `shallowRef` = a **mailbox** — you're notified when mail arrives (new `.value`), but nobody monitors what's inside the envelope

### Comparison

```js
import { ref, shallowRef } from 'vue'

// ref — deep tracking
const user = ref({ name: 'John', address: { city: 'NYC' } })
user.value.name = 'Jane'              // ✅ Triggers update
user.value.address.city = 'LA'        // ✅ Triggers update (deep tracking)

// shallowRef — shallow tracking
const user = shallowRef({ name: 'John', address: { city: 'NYC' } })
user.value.name = 'Jane'              // ❌ Does NOT trigger update
user.value.address.city = 'LA'        // ❌ Does NOT trigger update

// Only .value reassignment triggers update
user.value = { name: 'Jane', address: { city: 'LA' } }  // ✅ Triggers update
```

| Aspect | `ref` | `shallowRef` |
|--------|-------|--------------|
| Nested tracking | ✅ All levels | ❌ Only `.value` |
| Performance | Slower for large objects | Faster — no deep proxy |
| When to use | Most cases | Large datasets, third-party objects |
| React equivalent | `useState` with spread | `useState` (React is always shallow!) |

> **React comparison:** React's `useState` is actually always "shallow" — `setState(obj)` only triggers re-render on reference change. So `shallowRef` is closer to React's default behavior. Vue's `ref` gives you **more** than React by default.

### When to Use `shallowRef`

```js
// ✅ Large lists where you replace the whole array
const largeList = shallowRef([])
async function refresh() {
    largeList.value = await fetchThousandItems()  // new reference → triggers update
}

// ✅ Third-party objects that shouldn't be proxied
const chart = shallowRef(null)
onMounted(() => {
    chart.value = new Chart(canvas.value, config)  // Chart instance shouldn't be reactive
})

// ✅ Performance-critical data
const tableData = shallowRef(generateHugeDataset())
```

---

## `shallowReactive`

### Core Idea

> `shallowReactive` creates a reactive object where only **top-level** properties are reactive. Nested objects remain plain (not wrapped in Proxy).

```js
import { reactive, shallowReactive } from 'vue'

// reactive — deep
const state = reactive({
    user: { name: 'John', address: { city: 'NYC' } }
})
state.user.address.city = 'LA'        // ✅ Triggers update

// shallowReactive — only root level
const state = shallowReactive({
    user: { name: 'John', address: { city: 'NYC' } }
})
state.user = { name: 'Jane' }         // ✅ Triggers update (root-level property)
state.user.name = 'Jane'              // ❌ Does NOT trigger update (nested)
state.user.address.city = 'LA'        // ❌ Does NOT trigger update (deeply nested)
```

| Aspect | `reactive` | `shallowReactive` |
|--------|------------|-------------------|
| Root-level properties | ✅ Reactive | ✅ Reactive |
| Nested properties | ✅ Reactive | ❌ Not reactive |
| Use case | Most cases | Config objects, integration with non-Vue state |
| Performance | Creates proxies recursively | Only one proxy layer |

### When to Use

```js
// ✅ Integration with external state that has its own change tracking
const externalState = shallowReactive({
    socket: new WebSocket(url),          // don't proxy WebSocket internals
    chartInstance: null,                  // don't proxy Chart.js internals
    connectionStatus: 'connecting'       // only this needs reactivity
})
```

---

## Dependency Tracking — Deep Dive

### How Vue Tracks Dependencies

Every reactive read inside a running **effect** (render function, computed, watcher) is recorded as a dependency.

```js
const count = ref(0)
const name = ref('Vue')

// When this computed runs, Vue records that it depends on `count`
const doubled = computed(() => count.value * 2)
// Vue does NOT record `name` as a dependency because it wasn't read

count.value = 5     // ✅ triggers `doubled` to recalculate
name.value = 'React' // ❌ does NOT trigger `doubled` (not a dependency)
```

### Internal Mechanism — Step by Step

```
1. An effect starts running (e.g., component render)
2. Vue sets `activeEffect = currentRenderEffect`
3. Effect reads `count.value`
4. Proxy's `get` trap fires → records: "activeEffect depends on count"
5. Effect reads `name.value`
6. Proxy's `get` trap fires → records: "activeEffect depends on name"
7. Effect finishes → `activeEffect = null`

Later:
8. `count.value = 5` → Proxy's `set` trap fires
9. Vue looks up: "Which effects depend on count?"
10. Vue re-runs those effects
```

### Mental Model — Attendance Sheet

Vue keeps an **attendance sheet** for each reactive property. When an effect reads a property, it signs the sheet. When the property changes, Vue notifies everyone on the sheet.

```
count's attendance sheet: [renderEffect_ComponentA, computedEffect_doubled]
name's attendance sheet:  [renderEffect_ComponentA, renderEffect_ComponentB]
```

> **React comparison:** React has NO dependency tracking. You manually tell React what to watch:
> ```js
> useMemo(() => count * 2, [count])  // YOU specify [count]
> ```
> Vue auto-detects it:
> ```js
> computed(() => count.value * 2)    // Vue KNOWS it reads count
> ```

### Conditional Dependencies

Dependencies are tracked **per execution**, not statically:

```js
const showName = ref(true)
const name = ref('Vue')
const count = ref(0)

const display = computed(() => {
    if (showName.value) {
        return name.value       // depends on showName + name
    }
    return count.value          // depends on showName + count
})
```

When `showName` is `true`: dependencies = `[showName, name]`
When `showName` is `false`: dependencies = `[showName, count]`

Vue re-calculates dependencies each time the effect runs. Old dependencies that aren't read anymore are removed.

---

## What Happens When a Reactive Value Changes

### Internal Flow — Complete Picture

```
state.count = 5
    │
    ▼
Proxy set trap fires
    │
    ▼
Vue checks: is the new value different from old? (Object.is comparison)
    │ No → do nothing (skip)
    │ Yes ↓
    ▼
Trigger phase: collect all effects that depend on `count`
    │
    ▼
Schedule effects (don't run immediately — batch them)
    │
    ▼
Microtask queue (Promise.then / queueMicrotask)
    │
    ▼
Effects run in order:
    1. Computed properties recalculate
    2. Watchers fire
    3. Component render functions re-run
    │
    ▼
Virtual DOM diff → Patch real DOM
```

### Key Insight — Batching

```js
const count = ref(0)

count.value = 1
count.value = 2
count.value = 3
// Only ONE re-render happens — with count = 3
// Vue batches all three changes into a single update
```

> **React comparison:** React 18 also batches `setState` calls. Before React 18, batching only worked inside event handlers. Vue has always batched.

---

## Why Destructuring Breaks Reactivity

### The Root Cause

Destructuring extracts the **value** from the Proxy wrapper. The extracted value is a plain JavaScript primitive or object — no longer tracked.

```js
const state = reactive({ count: 0, name: 'Vue' })

// What destructuring actually does internally:
let { count } = state
// Equivalent to:
let count = state.count    // reads 0 from proxy, assigns plain number 0 to variable
count++                    // mutates a local variable — Vue's proxy never knows
```

### Mental Model

Reactive objects are like **fish in an aquarium** (Proxy). Destructuring is like **scooping a fish out** — once out of the aquarium, you can't track it anymore.

### The Fix — `toRef` and `toRefs`

```js
// ❌ Broken
const { count, name } = reactive({ count: 0, name: 'Vue' })

// ✅ Fixed with toRef — creates a ref linked to the reactive property
const state = reactive({ count: 0, name: 'Vue' })
const countRef = toRef(state, 'count')
countRef.value++      // ✅ Updates state.count AND triggers reactivity

// ✅ Fixed with toRefs — converts ALL properties to refs
const { count, name } = toRefs(state)
count.value++         // ✅ Updates state.count AND triggers reactivity
name.value = 'React'  // ✅ Updates state.name AND triggers reactivity
```

---

## `toRef` and `toRefs`

### `toRef` — Single Property Link

Creates a ref that stays **connected** to a source reactive object's property:

```js
import { reactive, toRef } from 'vue'

const state = reactive({ count: 0, name: 'Vue' })

const countRef = toRef(state, 'count')

countRef.value++        // ✅ state.count is also 1
state.count++           // ✅ countRef.value is also 2
// They're LINKED — changes flow both ways
```

### `toRefs` — All Properties

Converts all properties of a reactive object into refs:

```js
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0, name: 'Vue' })
const { count, name } = toRefs(state)

// Both are now refs linked to state
count.value++         // state.count = 1
name.value = 'React'  // state.name = 'React'
```

### Real-World Use — Composable Return Values

```js
// ✅ Composable returning reactive state — use toRefs
function useCounter() {
    const state = reactive({ count: 0, doubled: computed(() => state.count * 2) })

    function increment() { state.count++ }

    // toRefs lets consumers destructure without breaking reactivity
    return { ...toRefs(state), increment }
}

// Consumer can safely destructure
const { count, doubled, increment } = useCounter()
```

### `toRef` with Default Values

```js
// Create a ref from a potentially undefined prop
const props = defineProps({ name: String })
const nameRef = toRef(props, 'name', 'Default Name')   // third arg = default
```

> **React comparison:** React doesn't have this problem because `useState` returns a setter function, not a mutable reference. Vue needs `toRef`/`toRefs` specifically because of the Proxy-based reactivity model.

---

## Effect Scope

### Problem — Cleanup of Multiple Effects

When a component unmounts, Vue automatically stops all its effects (computed, watchers, watchEffects). But composables used outside components (in libraries, tests) don't have automatic cleanup.

```js
// Inside a component — automatic cleanup ✅
const count = ref(0)
watch(count, () => { /* auto-stopped on unmount */ })

// Outside a component — NO automatic cleanup ❌
// In a library or test file
const count = ref(0)
watch(count, () => { /* leaks! Never stops! */ })
```

### Solution — `effectScope`

`effectScope` creates a container that collects all effects created inside it, so they can be stopped together:

```js
import { effectScope, ref, computed, watch } from 'vue'

const scope = effectScope()

scope.run(() => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)      // collected
    watch(count, () => console.log('changed'))           // collected
    watchEffect(() => console.log(count.value))          // collected
})

// Later — stop ALL effects at once
scope.stop()    // computed, watch, and watchEffect all stopped
```

### Mental Model

Effect scope is like a **power strip**. You plug in multiple devices (effects). When you flip the switch (stop), all devices power off at once.

### Real-World Use — Composable Libraries

```js
// A composable that manages its own lifecycle
export function useFeature() {
    const scope = effectScope()

    function start() {
        scope.run(() => {
            // Set up watchers, computed, intervals, etc.
        })
    }

    function stop() {
        scope.stop()    // Clean up everything
    }

    return { start, stop }
}
```

> **React comparison:** No direct equivalent. React relies on `useEffect` cleanup functions for individual effects. `effectScope` batches cleanup of multiple effects — useful for library authors.

---

## `markRaw`

### Problem — Objects That Shouldn't Be Reactive

Some objects should **never** be wrapped in Proxy:
- Third-party class instances (Chart.js, Map instances, Web Workers)
- Immutable data that never changes
- Objects with internal state that Proxy would break

```js
import { reactive } from 'vue'

const state = reactive({
    chart: new Chart(canvas, config)    // ⚠️ Chart.js instance gets proxied
})
// Proxy wrapping can break Chart.js internal methods!
```

### Solution — `markRaw`

`markRaw` marks an object so Vue's reactivity system **never** wraps it in a Proxy:

```js
import { markRaw, reactive } from 'vue'

const chartInstance = markRaw(new Chart(canvas, config))

const state = reactive({
    chart: chartInstance       // ✅ NOT proxied — Chart.js works correctly
})

// Even if you assign a markRaw'd object to a reactive property,
// the object itself stays plain
```

### When to Use

```js
// ✅ Third-party class instances
import { markRaw } from 'vue'
const map = markRaw(new google.maps.Map(element, options))

// ✅ Large immutable datasets
const countries = markRaw(HUGE_COUNTRY_LIST)    // 200+ items, never changes

// ✅ Component references (for dynamic components)
import MyComponent from './MyComponent.vue'
const currentComponent = shallowRef(markRaw(MyComponent))
```

### What Happens Without `markRaw`

```js
// Without markRaw — Vue creates Proxy around the class instance
// Proxy intercepts ALL property access and mutation
// This can break:
//   - Internal property checks (hasOwnProperty, instanceof)
//   - Getters/setters that rely on 'this' being the real object
//   - Methods that store 'this' reference internally
//   - Freeze/seal checks
```

> **React comparison:** React doesn't have this problem because React never automatically wraps objects in proxies. `markRaw` is needed only because Vue's reactivity is automatic — sometimes TOO automatic.

---

## Custom Directives

### Core Idea

> Custom directives provide reusable **low-level DOM access** — when you need to interact with DOM elements directly. Think of them as lifecycle hooks attached to individual DOM elements.

### Mental Model

Directives are like **React refs + useEffect** attached to a specific DOM element. They give you direct access to the element and hooks for when it enters/leaves the DOM.

### Syntax

```js
// Directive definition
const vFocus = {
    mounted(el) {
        el.focus()
    }
}

// Registration — global
app.directive('focus', {
    mounted(el) { el.focus() }
})

// Registration — local (in <script setup>)
// Any variable starting with 'v' + PascalCase is auto-registered
const vFocus = {
    mounted(el) { el.focus() }
}
```

```vue
<template>
    <input v-focus />
</template>
```

### Directive Lifecycle Hooks

```js
const vMyDirective = {
    created(el, binding, vnode) {},      // before element's attributes applied
    beforeMount(el, binding, vnode) {},  // before element inserted into DOM
    mounted(el, binding, vnode) {},      // element inserted into DOM
    beforeUpdate(el, binding, vnode) {}, // before parent component updates
    updated(el, binding, vnode) {},      // after parent component updates
    beforeUnmount(el, binding, vnode) {},
    unmounted(el, binding, vnode) {}     // element removed from DOM
}
```

**`binding` object contains:**

```js
{
    value: /* current value */,          // v-my-dir="value"
    oldValue: /* previous value */,
    arg: /* argument */,                 // v-my-dir:arg
    modifiers: /* modifiers object */,   // v-my-dir.mod1.mod2
    instance: /* component instance */,
    dir: /* directive definition */
}
```

### Real-World Examples

```js
// v-click-outside — detect clicks outside element
const vClickOutside = {
    mounted(el, binding) {
        el._clickOutside = (event) => {
            if (!el.contains(event.target)) {
                binding.value(event)    // call the handler
            }
        }
        document.addEventListener('click', el._clickOutside)
    },
    unmounted(el) {
        document.removeEventListener('click', el._clickOutside)
    }
}

// Usage
<div v-click-outside="closeDropdown">
    <DropdownMenu />
</div>
```

```js
// v-permission — show/hide based on user role
const vPermission = {
    mounted(el, binding) {
        const requiredRole = binding.value
        const userRole = getCurrentUserRole()
        if (!requiredRole.includes(userRole)) {
            el.style.display = 'none'
        }
    }
}

// Usage
<button v-permission="['admin', 'editor']">Delete</button>
```

### When to Use Directives vs Composables

| Use Case | Use Directive | Use Composable |
|----------|--------------|----------------|
| Direct DOM manipulation | ✅ | ❌ |
| Reusable DOM behavior | ✅ | ❌ |
| Stateful logic without DOM | ❌ | ✅ |
| Complex business logic | ❌ | ✅ |
| Third-party DOM integration | ✅ | ❌ |

> **Rule:** If you need to **touch the DOM element directly**, use a directive. If you need **reactive state and logic**, use a composable.

---

## Dynamic Components & KeepAlive

### Dynamic Components

`<component :is="...">` dynamically switches which component renders:

```vue
<script setup>
import TabA from './TabA.vue'
import TabB from './TabB.vue'
import TabC from './TabC.vue'

const tabs = { TabA, TabB, TabC }
const currentTab = ref('TabA')
</script>

<template>
    <button v-for="(_, name) in tabs" :key="name" @click="currentTab = name">
        {{ name }}
    </button>

    <component :is="tabs[currentTab]" />
</template>
```

> **React comparison:** This is like conditional rendering with a map:
> ```jsx
> const tabs = { TabA, TabB, TabC }
> const Component = tabs[currentTab]
> return <Component />
> ```

### The Problem — Component State Lost

```
Tab A (user types in a form) → Switch to Tab B → Switch back to Tab A
→ Form is EMPTY — component was destroyed and recreated
```

### Solution — `<KeepAlive>`

```vue
<template>
    <KeepAlive>
        <component :is="tabs[currentTab]" />
    </KeepAlive>
</template>
```

Now Tab A's state is **cached in memory** when you switch away. Switching back restores it instantly.

### KeepAlive Options

```vue
<!-- Include specific components -->
<KeepAlive :include="['TabA', 'TabB']">
    <component :is="currentTab" />
</KeepAlive>

<!-- Exclude specific components -->
<KeepAlive :exclude="['HeavyChart']">
    <router-view />
</KeepAlive>

<!-- Limit cache size (LRU eviction) -->
<KeepAlive :max="5">
    <router-view />
</KeepAlive>
```

### KeepAlive Lifecycle Hooks

Components inside `KeepAlive` get two special hooks:

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

// Called when component is RE-INSERTED from cache
onActivated(() => {
    console.log('Tab became visible again')
    refreshData()    // re-fetch data on re-activation
})

// Called when component is CACHED (removed from DOM but kept in memory)
onDeactivated(() => {
    console.log('Tab hidden — cached in memory')
    pauseUpdates()   // stop polling while inactive
})
</script>
```

> **React comparison:** React has no `KeepAlive`. Options to preserve state across tab switches:
> - Hide with CSS (`display: none`) — DOM stays, not truly unmounted
> - Lift state up or use global store (Redux)
> - Vue's `KeepAlive` is more elegant — component unmounts from DOM but stays cached

---

## Interview Perspective

**Q: What is the difference between ref and shallowRef?**

- `ref` tracks nested changes (deep Proxy). `shallowRef` only tracks `.value` reassignment.
- Use `shallowRef` for large datasets, third-party instances, performance optimization.
- React's `useState` is inherently shallow — `shallowRef` is closer to React's default.

**Q: What is toRef and toRefs?**

- `toRef` creates a ref linked to a single reactive property — changes sync both ways.
- `toRefs` converts all properties of a reactive object to linked refs.
- Solves destructuring problem — lets you destructure reactive objects without losing reactivity.
- Essential in composables that return reactive state.

**Q: Explain effect scope in Vue.**

- `effectScope()` groups multiple effects (watchers, computed) for batch cleanup.
- Calling `scope.stop()` stops all collected effects at once.
- Useful for composable libraries and testing where there's no component lifecycle.

**Q: What is markRaw and when should it be used?**

- `markRaw` prevents Vue from wrapping an object in Proxy.
- Use for third-party class instances (Chart.js, Maps), large immutable data, component references.
- Needed because Vue's automatic deep reactivity can break objects with complex internal state.

**Q: What are custom directives in Vue?**

- Reusable hooks attached to DOM elements — for low-level DOM manipulation.
- Have lifecycle hooks: `mounted`, `updated`, `unmounted`.
- Use for: click-outside detection, permission-based visibility, auto-focus, intersection observer.
- If logic is about DOM → directive. If logic is about state → composable.

**Q: Explain dynamic components and keep-alive.**

- `<component :is="...">` dynamically renders different components.
- Without `KeepAlive`, switching destroys components (state lost).
- `KeepAlive` caches component instances in memory.
- Special hooks: `onActivated` (re-shown), `onDeactivated` (cached).
- Use `:max` to limit cache, `:include`/`:exclude` to control which components are cached.

---

## Key Takeaways

- `shallowRef`/`shallowReactive` skip deep tracking — use for performance or non-Vue objects
- Vue tracks dependencies **dynamically** during effect execution — not statically declared
- Destructuring reactive objects extracts plain values — use `toRef`/`toRefs` to maintain link
- `effectScope` groups effects for batch cleanup — essential for libraries and testing
- `markRaw` prevents unwanted Proxy wrapping — protects third-party objects
- Custom directives = reusable DOM hooks; composables = reusable logic hooks
- `KeepAlive` caches component instances — unique to Vue, no React equivalent
