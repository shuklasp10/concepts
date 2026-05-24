# Component Design Patterns

## Higher-Order Component Alternatives in Vue

### Problem — HOC Pattern in Vue

In React, HOCs wrap components to add behavior. Vue doesn't need HOCs because it has better alternatives:

| React Pattern | Vue Alternative | Why Vue's Approach is Better |
|--------------|----------------|------------------------------|
| HOC (wrapping component) | Composables | No wrapper nesting, clear data flow |
| HOC for shared logic | Composables | TypeScript-friendly, explicit returns |
| HOC for conditional rendering | Directives or slots | Template-level, no component overhead |
| Render props | Scoped slots | Built-in template syntax |

### React HOC vs Vue Composable

```jsx
// React — HOC pattern
function withAuth(Component) {
    return function AuthWrapper(props) {
        const user = useAuth()
        if (!user) return <Navigate to="/login" />
        return <Component {...props} user={user} />
    }
}

const ProtectedPage = withAuth(Dashboard)
```

```js
// Vue — Composable (simpler, no wrapper)
// composables/useAuth.js
export function useAuth() {
    const user = ref(null)
    const isAuthenticated = computed(() => !!user.value)

    async function login(credentials) { /* ... */ }
    function logout() { user.value = null }

    return { user, isAuthenticated, login, logout }
}
```

```vue
<!-- Dashboard.vue — just use the composable directly -->
<script setup>
import { useAuth } from '@/composables/useAuth'
const { user, isAuthenticated } = useAuth()
</script>

<template>
    <div v-if="isAuthenticated">
        Welcome {{ user.name }}
    </div>
</template>
```

> **Key insight:** HOCs add wrapper layers (wrapper hell). Composables are flat function calls — no nesting, no prop forwarding, no `displayName` issues.

---

## Reusable Form Components

### Problem — Forms Are Complex

Forms need: validation, error display, dirty tracking, submit handling, reset. Building all this per-form leads to massive duplication.

### Pattern 1 — `v-model` on Custom Inputs

```vue
<!-- BaseInput.vue — reusable input wrapper -->
<script setup>
const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    label: String,
    error: String,
    type: { type: String, default: 'text' }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
    <div class="form-group">
        <label>{{ label }}</label>
        <input
            :type="type"
            :value="modelValue"
            @input="emit('update:modelValue', $event.target.value)"
            :class="{ error: error }"
        />
        <span v-if="error" class="error-text">{{ error }}</span>
    </div>
</template>

<!-- Parent usage — v-model works seamlessly -->
<BaseInput v-model="form.email" label="Email" :error="errors.email" />
<BaseInput v-model="form.password" label="Password" type="password" />
```

### Pattern 2 — Form Composable

```js
// composables/useForm.js
import { reactive, computed } from 'vue'

export function useForm(initialValues, validationRules) {
    const values = reactive({ ...initialValues })
    const errors = reactive({})
    const touched = reactive({})

    const isDirty = computed(() =>
        Object.keys(initialValues).some(key => values[key] !== initialValues[key])
    )

    const isValid = computed(() =>
        Object.keys(errors).every(key => !errors[key])
    )

    function validate(field) {
        if (validationRules[field]) {
            errors[field] = validationRules[field](values[field], values)
        }
    }

    function validateAll() {
        Object.keys(validationRules).forEach(validate)
        return isValid.value
    }

    function reset() {
        Object.assign(values, initialValues)
        Object.keys(errors).forEach(k => delete errors[k])
        Object.keys(touched).forEach(k => delete touched[k])
    }

    function touch(field) {
        touched[field] = true
        validate(field)
    }

    return { values, errors, touched, isDirty, isValid, validate, validateAll, reset, touch }
}
```

```vue
<!-- LoginForm.vue -->
<script setup>
import { useForm } from '@/composables/useForm'

const { values, errors, isDirty, isValid, validateAll, touch, reset } = useForm(
    { email: '', password: '' },
    {
        email: (v) => !v ? 'Required' : !v.includes('@') ? 'Invalid email' : '',
        password: (v) => !v ? 'Required' : v.length < 8 ? 'Min 8 characters' : ''
    }
)

async function onSubmit() {
    if (!validateAll()) return
    await loginApi(values)
}
</script>

<template>
    <form @submit.prevent="onSubmit">
        <BaseInput v-model="values.email" label="Email" :error="errors.email" @blur="touch('email')" />
        <BaseInput v-model="values.password" label="Password" type="password"
            :error="errors.password" @blur="touch('password')" />
        <button :disabled="!isValid">Submit</button>
    </form>
</template>
```

> **React comparison:** Same pattern as React Hook Form or Formik. Vue's `v-model` makes the input binding cleaner — no `register()` or `Controller` needed.

---

## Controlled vs Uncontrolled Components

### Mental Model

| Aspect | Controlled | Uncontrolled |
|--------|-----------|-------------|
| State owner | Parent (via `v-model` / props) | Component itself (internal ref) |
| Data flow | Parent → Child → Parent | Component manages internally |
| Use case | Forms, shared state | Isolated widgets, third-party |
| React parallel | `<input value={val} onChange={...} />` | `<input ref={inputRef} />` |

### Controlled Pattern (Recommended)

```vue
<!-- Parent controls the value -->
<CustomInput v-model="parentValue" />

<!-- CustomInput.vue — value comes from parent, changes emit to parent -->
<script setup>
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>

<template>
    <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
</template>
```

### Uncontrolled Pattern

```vue
<!-- Component manages its own state -->
<script setup>
const internalValue = ref('')

// Expose value for parent to read (if needed)
defineExpose({ value: internalValue })
</script>

<template>
    <input v-model="internalValue" />
</template>

<!-- Parent reads via template ref -->
<script setup>
const inputRef = ref(null)
function readValue() {
    console.log(inputRef.value.value)    // access exposed value
}
</script>
<template>
    <CustomInput ref="inputRef" />
</template>
```

> **Best practice:** Prefer controlled (v-model). Use uncontrolled only when the parent doesn't need to know the value, or when integrating third-party widgets that manage their own state.

---

## Avoiding Prop Drilling

### The Problem

```
App → Layout → Sidebar → Menu → MenuItem → Icon
                                    ↑
                            needs theme from App
```

Passing `theme` through Layout → Sidebar → Menu → MenuItem just to reach Icon is prop drilling.

### Solutions (Ordered by Scope)

| Solution | Scope | When to Use |
|----------|-------|-------------|
| Provide/Inject | Subtree | Theme, locale, config within a feature |
| Pinia store | Global | Auth state, user preferences, app settings |
| Composables | Shared logic | Data fetching, form validation |
| Slots | Parent → Child content | Layout components |

### Solution 1 — Provide/Inject

```vue
<!-- App.vue -->
<script setup>
import { provide, ref } from 'vue'
const theme = ref('dark')
provide('theme', theme)
provide('toggleTheme', () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
})
</script>

<!-- Icon.vue (deeply nested) — no intermediate components involved -->
<script setup>
import { inject } from 'vue'
const theme = inject('theme')
const toggleTheme = inject('toggleTheme')
</script>
```

### Solution 2 — Pinia Store (for Global State)

```js
// stores/useThemeStore.js
export const useThemeStore = defineStore('theme', () => {
    const current = ref('dark')
    function toggle() {
        current.value = current.value === 'dark' ? 'light' : 'dark'
    }
    return { current, toggle }
})

// ANY component at any depth
const themeStore = useThemeStore()
```

> **React comparison:** React solves prop drilling with Context API or state libraries (Redux, Zustand). Vue's provide/inject is more targeted (subtree-scoped), while Pinia is for global state.

---

## Render Functions

### What Are They

Templates are compiled into render functions. You can write render functions directly for maximum flexibility:

```js
import { h } from 'vue'

// Template
<template>
    <div class="wrapper">
        <h1>{{ title }}</h1>
    </div>
</template>

// Equivalent render function
export default {
    setup(props) {
        return () => h('div', { class: 'wrapper' }, [
            h('h1', {}, props.title)
        ])
    }
}
```

### `h()` Function

`h` stands for "hyperscript" — creates virtual DOM nodes:

```js
h(tag, props, children)

// Examples
h('div', { class: 'box', id: 'main' }, 'Hello')
h('button', { onClick: handleClick }, 'Click me')
h(MyComponent, { name: 'Vue' })
h('ul', {}, items.map(item => h('li', { key: item.id }, item.name)))
```

### When to Use Render Functions

| Use Case | Why Templates Can't Do It |
|----------|--------------------------|
| Programmatic component selection | Need runtime logic to decide tag/component |
| Dynamic tag names | `h(level === 1 ? 'h1' : 'h2', ...)` |
| Library/framework development | Need full JS power, no template limitations |
| Highly dynamic rendering | Complex conditional trees |

```js
// Dynamic heading level — awkward in templates, clean in render function
function HeadingComponent(props) {
    return () => h(`h${props.level}`, {}, props.children)
}

// Template equivalent requires v-if chains:
// <h1 v-if="level === 1">...</h1>
// <h2 v-else-if="level === 2">...</h2>
// etc.
```

> **React comparison:** React's JSX IS a render function. `<div>Hello</div>` compiles to `React.createElement('div', null, 'Hello')`. Vue templates compile to `h('div', null, 'Hello')`. Same concept, different syntax.

---

## JSX in Vue

### When Would You Use JSX

Vue supports JSX as an alternative to templates and `h()`:

```jsx
// JSX in Vue — feels like React
export default defineComponent({
    setup() {
        const count = ref(0)
        return () => (
            <div class="counter">
                <h1>Count: {count.value}</h1>
                <button onClick={() => count.value++}>+</button>
            </div>
        )
    }
})
```

### JSX vs Template vs Render Function

| Aspect | Template | JSX | `h()` Render |
|--------|----------|-----|-------------|
| Readability | Best for HTML-heavy | Good for logic-heavy | Verbose |
| Compiler optimization | ✅ Static hoisting, patch flags | ❌ No compile-time optimization | ❌ No |
| TypeScript | Good with `<script setup>` | Excellent | Excellent |
| Vue directives | ✅ All directives | ❌ No v-if, v-for, v-model | ❌ No |
| Use case | 95% of components | Complex render logic | Library internals |

> **Key insight:** Vue templates get **compiler optimizations** (static hoisting, patch flags) that JSX and render functions miss. Use templates by default — JSX only when you need JS expressiveness.

### JSX Setup

```bash
npm install @vitejs/plugin-vue-jsx
```

```js
// vite.config.js
import vueJsx from '@vitejs/plugin-vue-jsx'
export default { plugins: [vue(), vueJsx()] }
```

---

## Mixins vs Composables

### Side-by-Side Comparison

```js
// ❌ Mixin (Vue 2 pattern — avoid)
export const counterMixin = {
    data() { return { count: 0 } },
    methods: {
        increment() { this.count++ }
    }
}

// Component
export default {
    mixins: [counterMixin, loggerMixin],   // Where does 'count' come from?
    data() { return { count: 10 } }         // Silent name collision!
}
```

```js
// ✅ Composable (Vue 3 pattern — preferred)
export function useCounter(initial = 0) {
    const count = ref(initial)
    function increment() { count.value++ }
    return { count, increment }
}

// Component
const { count, increment } = useCounter()
const { count: logCount } = useLogger()     // No collision — you name them
```

| Problem | Mixin | Composable |
|---------|-------|-----------|
| Name collision | Silent override | Explicit naming at destructure |
| Source clarity | `this.count` — which mixin? | `const { count } = useCounter()` — obvious |
| TypeScript | Can't infer mixed-in properties | Full type inference |
| Reuse with different config | Awkward (factory mixin) | `useCounter(10)` — just pass args |
| Testing | Needs component mount | Pure function — test directly |
| Mixin-to-mixin deps | Implicit `this` coupling | Explicit imports |

---

## Async Components

### Core Idea

> Async components are loaded on-demand (lazy-loaded). They create a separate JS bundle and download it only when the component is actually rendered.

```js
import { defineAsyncComponent } from 'vue'

// Simple — just dynamic import
const AsyncModal = defineAsyncComponent(() =>
    import('./components/Modal.vue')
)

// Advanced — with loading, error, delay, timeout
const AsyncDashboard = defineAsyncComponent({
    loader: () => import('./views/Dashboard.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorFallback,
    delay: 200,       // show loading after 200ms
    timeout: 10000    // show error after 10s
})
```

```vue
<template>
    <!-- Component loads only when rendered -->
    <AsyncModal v-if="showModal" />
</template>
```

> **React comparison:** `defineAsyncComponent` = `React.lazy()`. But Vue's version has built-in loading/error/delay handling. React requires wrapping in `<Suspense>` and using `ErrorBoundary` separately.

---

## Teleport

### Problem — DOM Hierarchy vs Visual Hierarchy

Sometimes a component needs to render its output **outside** its parent DOM tree:
- Modals that need to be above everything (z-index issues)
- Tooltips that should attach to `<body>`
- Notifications that render at the top of the page

```vue
<!-- The modal is INSIDE a deeply nested component -->
<div class="card">
    <div class="card-body" style="overflow: hidden;">
        <!-- Modal renders here — clipped by overflow: hidden! -->
        <Modal v-if="showModal" />
    </div>
</div>
```

### Solution — `<Teleport>`

```vue
<template>
    <div class="card">
        <button @click="showModal = true">Open</button>

        <Teleport to="body">
            <!-- Renders at <body> level, even though component is nested -->
            <div v-if="showModal" class="modal-overlay">
                <div class="modal">
                    <h2>I'm teleported to body!</h2>
                    <button @click="showModal = false">Close</button>
                </div>
            </div>
        </Teleport>
    </div>
</template>
```

**Key behavior:**
- Component logic stays where it is (same `<script setup>`, same reactive state)
- Only the **DOM output** moves to the target
- Events still bubble within Vue's component tree (not the DOM tree)

### `to` Target Options

```vue
<Teleport to="body">...</Teleport>              <!-- CSS selector -->
<Teleport to="#modal-container">...</Teleport>   <!-- By ID -->
<Teleport to=".notifications">...</Teleport>     <!-- By class -->
```

### Conditional Teleport

```vue
<!-- Teleport on desktop, inline on mobile -->
<Teleport to="body" :disabled="isMobile">
    <Modal />
</Teleport>
```

> **React comparison:** `<Teleport>` = `ReactDOM.createPortal()`. Same concept. Difference: Vue's Teleport is a component in the template. React's portal is called inside the render function.

### Real-World Use Cases

1. **Modals** — render above all content, avoid z-index/overflow issues
2. **Tooltips** — attach to body so they aren't clipped
3. **Notifications/Toasts** — render in a fixed container
4. **Dropdowns** — avoid overflow hidden in parent containers

---

## Error Boundaries (Error Handling)

### How Errors Work in Vue

Vue provides component-level error handling through the `onErrorCaptured` hook and the global `app.config.errorHandler`:

```js
// Global error handler — catches ALL unhandled component errors
app.config.errorHandler = (err, instance, info) => {
    console.error('Global error:', err)
    console.error('Component:', instance)
    console.error('Info:', info)      // e.g., "render function", "watcher callback"
    reportToErrorTracking(err)
}
```

### Component-Level Error Boundary

```vue
<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
    error.value = err
    // Return false to STOP propagation (don't bubble to parent)
    // Return true or nothing to let it propagate
    return false
})
</script>

<template>
    <div v-if="error" class="error-fallback">
        <h2>Something went wrong</h2>
        <p>{{ error.message }}</p>
        <button @click="error = null">Try Again</button>
    </div>
    <slot v-else />
</template>

<!-- Usage -->
<ErrorBoundary>
    <DangerousComponent />
</ErrorBoundary>
```

### What `onErrorCaptured` Catches

- Render function errors
- Watcher callback errors
- Lifecycle hook errors
- Component event handler errors

### What It Does NOT Catch

- Async errors (need `try/catch` in async functions)
- Errors in `setTimeout`/`setInterval` callbacks
- Errors in third-party event listeners

```js
// ❌ Not caught by error boundary
onMounted(async () => {
    const data = await fetchData()    // If this throws, NOT caught
})

// ✅ Catch async errors manually
onMounted(async () => {
    try {
        const data = await fetchData()
    } catch (err) {
        error.value = err             // Handle manually
    }
})
```

> **React comparison:** Vue's `onErrorCaptured` = React's `componentDidCatch` / `getDerivedStateFromError`. React has `<ErrorBoundary>` as a class component pattern. Vue uses a hook-based approach. Neither catches async errors automatically.

---

## Interview Perspective

**Q: What are higher-order component alternatives in Vue?**

- Vue doesn't use HOCs — composables are the primary reuse mechanism
- Composables are flat (no wrapper nesting), TypeScript-friendly, and explicit
- Scoped slots replace render props pattern
- Directives handle DOM-level reuse

**Q: How would you build reusable form components in Vue?**

- Base input components with `v-model` support (defineProps/defineEmits)
- Form composable (useForm) for validation, dirty tracking, reset
- Separation: base components handle UI, composable handles logic

**Q: Explain controlled vs uncontrolled components in Vue context.**

- Controlled: parent owns state via v-model (recommended)
- Uncontrolled: component owns state internally, parent reads via template ref + defineExpose
- Vue's v-model makes controlled pattern simpler than React's value+onChange

**Q: What are render functions in Vue?**

- Direct virtual DOM creation with `h()` function — bypass template compiler
- Use when templates are limiting (dynamic tags, complex conditional trees)
- Templates get compiler optimizations that render functions miss — prefer templates

**Q: When would you use JSX in Vue?**

- When you need JS expressiveness that templates can't provide
- Trade-off: lose compiler optimizations (static hoisting, patch flags)
- Use for: complex render logic, library development. 95% of components should use templates.

**Q: Explain teleport and its real-world use cases.**

- Teleport renders DOM output at a different location (e.g., body)
- Component logic/state stays in place — only DOM output moves
- Use for: modals, tooltips, notifications — avoid z-index/overflow issues
- React equivalent: `ReactDOM.createPortal()`

**Q: How do error boundaries work in Vue?**

- `onErrorCaptured` hook catches errors from descendant components
- Return `false` to stop propagation, `true` to bubble up
- Global handler: `app.config.errorHandler` for unhandled errors
- Catches: render, watcher, lifecycle, event handler errors
- Does NOT catch: async errors, setTimeout, third-party listeners

---

## Key Takeaways

- Vue uses composables over HOCs — simpler, type-safe, no wrapper hell
- Reusable forms combine `v-model` base components with validation composables
- Prefer controlled components (v-model) over uncontrolled (internal state + expose)
- Provide/inject for subtree state, Pinia for global — both avoid prop drilling
- Templates should be default; render functions and JSX for exceptional cases only
- Teleport moves DOM output without moving component logic — essential for modals
- Error handling uses `onErrorCaptured` (component level) + `app.config.errorHandler` (global)
