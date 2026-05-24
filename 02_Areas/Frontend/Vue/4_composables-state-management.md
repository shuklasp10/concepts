# Composables & State Management

## Composables

### Core Idea

> Composables are functions that encapsulate and reuse **stateful logic** using Vue's Composition API. They are Vue 3's answer to React custom hooks.

### Problem — Code Reuse Before Composables

**Vue 2 Mixins (the old way):**

```js
// searchMixin.js
export const searchMixin = {
    data() {
        return { query: '', results: [] }
    },
    methods: {
        search() { /* ... */ }
    },
    watch: {
        query() { this.search() }
    }
}

// Component using mixin
export default {
    mixins: [searchMixin, paginationMixin],
    data() {
        return { /* component's own data */ }
    }
}
```

**Mixin problems:**

| Problem | Description |
|---------|-------------|
| Name collisions | Two mixins define `data()` with same property name — silent override |
| Unclear source | Where does `this.query` come from? Which mixin? |
| Implicit coupling | Mixins can depend on each other or component data |
| Type inference | TypeScript can't infer mixin properties |

> **React comparison:** Mixins had the same problems in React class components. React solved it with custom hooks. Vue solved it with composables. Same solution pattern.

### Solution — Composables

```js
// useSearch.js — composable
import { ref, watch } from 'vue'

export function useSearch(initialQuery = '') {
    const query = ref(initialQuery)
    const results = ref([])
    const loading = ref(false)

    async function search() {
        loading.value = true
        try {
            const res = await fetch(`/api/search?q=${query.value}`)
            results.value = await res.json()
        } finally {
            loading.value = false
        }
    }

    watch(query, () => search())

    return { query, results, loading, search }
}
```

```vue
<!-- Component using composable -->
<script setup>
import { useSearch } from './useSearch'

const { query, results, loading } = useSearch()
// ✅ Clear where everything comes from
// ✅ No name collisions — you control the names
// ✅ Full TypeScript support
// ✅ Can use multiple times with different configs
</script>
```

### Mental Model

Composables are like **electrical adapters** — each composable plugs into Vue's reactivity system and provides a specific capability. You can combine multiple adapters into one component.

> **React comparison:** Composables are almost identical to React custom hooks:
> ```js
> // React custom hook
> function useSearch(initialQuery = '') {
>     const [query, setQuery] = useState(initialQuery)
>     const [results, setResults] = useState([])
>     const [loading, setLoading] = useState(false)
>     useEffect(() => { search() }, [query])
>     return { query, setQuery, results, loading }
> }
> ```
> 
> Key difference: Vue composables return reactive refs — no setter functions needed. Just mutate `.value`.

### Composable Conventions

1. **Naming:** Start with `use` — `useSearch`, `useFetch`, `useAuth`
2. **File location:** `src/composables/useSearch.js`
3. **Return:** Always return reactive refs/computed — keep reactivity alive
4. **Lifecycle:** Can use `onMounted`, `onUnmounted` inside composables
5. **Cleanup:** Handle cleanup in `onUnmounted` (timers, listeners)

### Real-World Composable — `useFetch`

```js
// composables/useFetch.js
import { ref, watchEffect, toValue } from 'vue'

export function useFetch(url) {
    const data = ref(null)
    const error = ref(null)
    const loading = ref(true)

    async function fetchData() {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(toValue(url))   // toValue unwraps ref or returns plain value
            data.value = await res.json()
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    // If url is reactive, re-fetch when it changes
    watchEffect(() => {
        fetchData()
    })

    return { data, error, loading, refetch: fetchData }
}
```

```vue
<script setup>
import { useFetch } from '@/composables/useFetch'

// Static URL
const { data: users, loading, error } = useFetch('/api/users')

// Dynamic URL (re-fetches when userId changes)
const userId = ref(1)
const { data: user } = useFetch(
    computed(() => `/api/users/${userId.value}`)
)
</script>
```

### Composable — `useMouse`

```js
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
    const x = ref(0)
    const y = ref(0)

    function update(event) {
        x.value = event.pageX
        y.value = event.pageY
    }

    onMounted(() => window.addEventListener('mousemove', update))
    onUnmounted(() => window.removeEventListener('mousemove', update))

    return { x, y }
}
```

> **Key insight:** Composables can use lifecycle hooks, watchers, computed — the full Composition API. They're not just utility functions. They're **stateful, reactive modules** that hook into Vue's lifecycle.

---

## Pinia — State Management

### Core Idea

> Pinia is Vue 3's official state management library. It replaces Vuex and provides a simpler, type-safe, modular approach to global state.

### Mental Model — Pinia vs Vuex vs Redux

| Concept | Redux (React) | Vuex (Vue 2) | Pinia (Vue 3) |
|---------|---------------|--------------|---------------|
| Store | Single store | Single store | Multiple stores |
| State mutation | Immutable (return new state) | Mutations (commit) | Direct mutation (like reactive) |
| Async actions | Middleware (thunk/saga) | Actions → Mutations | Direct async in actions |
| Boilerplate | High | Medium | Low |
| TypeScript | Manual typing | Poor | Excellent |
| DevTools | Redux DevTools | Vue DevTools | Vue DevTools |
| Modules | Slices | Namespaced modules | Independent stores |

### Why Pinia Over Vuex

| Vuex Problem | Pinia Solution |
|-------------|----------------|
| Mutations + Actions (why both?) | Only actions (mutations removed) |
| Namespaced modules are complex | Independent stores, no nesting |
| TypeScript support is painful | Full type inference automatically |
| `this.$store.commit('module/mutation')` | `store.action()` — simple function call |
| Single store with nested modules | Multiple composable stores |

### Pinia Setup

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### Defining a Store

```js
// stores/useCounterStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ✅ Composition API style (recommended — consistent with components)
export const useCounterStore = defineStore('counter', () => {
    // State
    const count = ref(0)
    const name = ref('Counter')

    // Getters (computed)
    const doubleCount = computed(() => count.value * 2)

    // Actions (functions)
    function increment() {
        count.value++
    }

    async function fetchCount() {
        const res = await fetch('/api/count')
        count.value = await res.json()
    }

    return { count, name, doubleCount, increment, fetchCount }
})
```

```js
// Alternative: Options API style
export const useCounterStore = defineStore('counter', {
    state: () => ({
        count: 0,
        name: 'Counter'
    }),
    getters: {
        doubleCount: (state) => state.count * 2
    },
    actions: {
        increment() {
            this.count++
        },
        async fetchCount() {
            this.count = await fetch('/api/count').then(r => r.json())
        }
    }
})
```

### Using a Store in Components

```vue
<script setup>
import { useCounterStore } from '@/stores/useCounterStore'
import { storeToRefs } from 'pinia'

const counterStore = useCounterStore()

// ✅ For state & getters — use storeToRefs to maintain reactivity
const { count, doubleCount } = storeToRefs(counterStore)

// ✅ For actions — destructure directly (they're plain functions)
const { increment, fetchCount } = counterStore
</script>

<template>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+</button>
</template>
```

### Why `storeToRefs`?

```js
// ❌ Direct destructuring BREAKS reactivity (same as reactive() problem)
const { count } = counterStore    // count is now a plain number — not reactive!

// ✅ storeToRefs converts state/getters to refs
const { count } = storeToRefs(counterStore)    // count is a ref — reactive!

// Actions are plain functions — no storeToRefs needed
const { increment } = counterStore    // works fine
```

> **React comparison:** In Redux, you use `useSelector` to read state and `useDispatch` to call actions. In Pinia, you get the store, destructure with `storeToRefs` for state, and call actions directly.

### Store-to-Store Communication

```js
// stores/useUserStore.js
import { defineStore } from 'pinia'
import { useAuthStore } from './useAuthStore'

export const useUserStore = defineStore('user', () => {
    const authStore = useAuthStore()    // use another store inside a store

    async function fetchProfile() {
        if (!authStore.isLoggedIn) return
        // fetch user profile using auth token
        const res = await fetch('/api/profile', {
            headers: { Authorization: authStore.token }
        })
        // ...
    }

    return { fetchProfile }
})
```

### Pinia vs React State Management Comparison

```
React + Redux:
    1. Create slice (state + reducers)
    2. Add slice to configureStore
    3. Wrap app with <Provider store={store}>
    4. useSelector to read state
    5. useDispatch to call actions
    6. Dispatch(actionCreator(payload))

Vue + Pinia:
    1. defineStore (state + getters + actions)
    2. createPinia() + app.use(pinia)
    3. const store = useCounterStore()
    4. storeToRefs(store) for state
    5. store.action() directly
```

> **Key insight:** Pinia removes the indirection. No action creators, no dispatch, no commit, no mutations. Just call functions and modify state. The reactivity system handles everything.

---

## Structuring Pinia Stores in a Large Application

### Problem — Where Do Stores Go?

Small apps: one `stores/` folder. Large apps: stores scattered across features with unclear boundaries.

### Recommended Pattern — Domain-Driven Stores

```
src/
├── stores/                          # Global/shared stores
│   ├── useAuthStore.js              # Authentication state
│   ├── useNotificationStore.js      # App-wide notifications
│   └── useAppConfigStore.js         # App settings, theme
├── features/
│   ├── users/
│   │   └── stores/
│   │       └── useUserStore.js      # User domain state
│   ├── products/
│   │   └── stores/
│   │       └── useProductStore.js   # Product domain state
│   └── cart/
│       └── stores/
│           └── useCartStore.js      # Cart domain state
```

### Store Design Principles

**1. One store per domain, not per component**

```js
// ❌ Too granular — one store per component
useUserListStore()
useUserDetailStore()
useUserFormStore()

// ✅ One store per domain
useUserStore()  // manages all user-related state
```

**2. Keep stores focused**

```js
// ❌ God store — does everything
const useAppStore = defineStore('app', () => {
    const users = ref([])
    const products = ref([])
    const cart = ref([])
    const theme = ref('dark')
    const notifications = ref([])
    // 50+ state properties, 30+ actions...
})

// ✅ Focused stores
const useUserStore = defineStore('users', () => { /* user logic */ })
const useCartStore = defineStore('cart', () => { /* cart logic */ })
const useThemeStore = defineStore('theme', () => { /* theme logic */ })
```

**3. Stores can compose other stores**

```js
export const useCheckoutStore = defineStore('checkout', () => {
    const cartStore = useCartStore()
    const userStore = useUserStore()

    const canCheckout = computed(() =>
        cartStore.items.length > 0 && userStore.isAuthenticated
    )

    async function processCheckout() {
        const order = await api.createOrder({
            items: cartStore.items,
            userId: userStore.currentUser.id
        })
        cartStore.clear()
        return order
    }

    return { canCheckout, processCheckout }
})
```

---

## Problems With Global State

### What Goes Wrong

| Problem | Description | Symptom |
|---------|-------------|---------|
| God store | Everything in one store | Impossible to understand, test, or maintain |
| Over-globalization | Local state put in global store | Components tightly coupled to store |
| Stale state | Cached data never invalidated | User sees outdated information |
| Memory bloat | Data never cleaned up | App slows down over time |
| Hidden dependencies | Components depend on store shape | Refactoring breaks things silently |

### Rules — What Should Be Global vs Local

| State Type | Where | Example |
|-----------|-------|---------|
| User auth/session | Global (Pinia) | `useAuthStore` |
| App config/theme | Global (Pinia) | `useThemeStore` |
| Cross-feature shared data | Global (Pinia) | `useNotificationStore` |
| Form input values | Local (ref in component) | `const email = ref('')` |
| UI toggles | Local (ref in component) | `const isOpen = ref(false)` |
| Feature-specific data | Feature store | `useProductStore` |
| Server cache | Data fetching layer | Composable or TanStack Query |

> **Rule of thumb:** If only one component uses it → local ref. If siblings need it → lift to parent or provide/inject. If unrelated components need it → Pinia store.

---

## Optimistic UI Updates

### Core Idea

> Update the UI **immediately** assuming the API call will succeed, then rollback if it fails. Makes the app feel instant.

### Mental Model

Optimistic updates are like a **credit card transaction** — you get the item immediately (UI updates), and the bank (server) processes payment later. If payment fails (API error), the purchase is reversed (rollback).

```js
// stores/useTodoStore.js
export const useTodoStore = defineStore('todos', () => {
    const todos = ref([])

    async function deleteTodo(id) {
        // 1. Save current state for rollback
        const previousTodos = [...todos.value]

        // 2. Optimistic update — remove immediately
        todos.value = todos.value.filter(t => t.id !== id)

        try {
            // 3. Send to server
            await api.delete(`/todos/${id}`)
        } catch (error) {
            // 4. Rollback on failure
            todos.value = previousTodos
            notificationStore.error('Failed to delete todo')
        }
    }

    async function toggleTodo(id) {
        const todo = todos.value.find(t => t.id === id)
        const previousState = todo.completed

        // Optimistic
        todo.completed = !todo.completed

        try {
            await api.patch(`/todos/${id}`, { completed: todo.completed })
        } catch {
            // Rollback
            todo.completed = previousState
        }
    }

    return { todos, deleteTodo, toggleTodo }
})
```

> **React comparison:** Same pattern used with React Query's `onMutate` / `onError` / `onSettled`. Vue's direct mutability makes rollback simpler — just reassign.

---

## Persisting State

### Problem — State Lost on Refresh

Pinia stores live in memory. Page refresh = all state gone.

### Solution 1 — Manual Persistence

```js
export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('auth_token') || null)
    const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

    watch(token, (newToken) => {
        if (newToken) localStorage.setItem('auth_token', newToken)
        else localStorage.removeItem('auth_token')
    })

    watch(user, (newUser) => {
        if (newUser) localStorage.setItem('auth_user', JSON.stringify(newUser))
        else localStorage.removeItem('auth_user')
    }, { deep: true })

    return { token, user }
})
```

### Solution 2 — Pinia Plugin (Recommended)

```js
// plugins/piniaPersistedState.js
import { watch } from 'vue'

export function piniaPersistedState({ store }) {
    // Load from localStorage on store creation
    const savedState = localStorage.getItem(`pinia-${store.$id}`)
    if (savedState) {
        store.$patch(JSON.parse(savedState))
    }

    // Save to localStorage on every change
    store.$subscribe((mutation, state) => {
        localStorage.setItem(`pinia-${store.$id}`, JSON.stringify(state))
    })
}

// main.js
const pinia = createPinia()
pinia.use(piniaPersistedState)
```

### Solution 3 — `pinia-plugin-persistedstate` library

```bash
npm install pinia-plugin-persistedstate
```

```js
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
pinia.use(piniaPluginPersistedstate)

// In store definition
export const useAuthStore = defineStore('auth', () => {
    // ...state, getters, actions
}, {
    persist: true                    // persist entire store
    // persist: { pick: ['token'] }  // persist only specific fields
})
```

### Storage Options

| Storage | Persistence | Size | Use Case |
|---------|------------|------|----------|
| `localStorage` | Until cleared | ~5MB | Auth tokens, preferences |
| `sessionStorage` | Until tab closes | ~5MB | Session-specific state |
| IndexedDB | Until cleared | Large | Offline data, large datasets |
| Cookies | Configurable | ~4KB | Server-readable state |

---

## Preventing Unnecessary Store Updates

### Problem — Reactive Overkill

```js
// ❌ Every property deeply tracked — expensive for large objects
const products = ref(largeProductList)    // 10,000 items, deep proxy

// Every mutation to any nested property triggers Vue's reactivity system
products.value[5000].price = 29.99       // triggers tracking overhead
```

### Solutions

**1. Use `shallowRef` for large data**

```js
const products = shallowRef([])

// Only triggers on .value reassignment
products.value = await fetchProducts()     // ✅ triggers
products.value[0].price = 99              // ❌ doesn't trigger (intentional)

// Force trigger when needed
function updateProduct(id, changes) {
    const product = products.value.find(p => p.id === id)
    Object.assign(product, changes)
    triggerRef(products)                   // manually trigger reactivity
}
```

**2. Use computed getters to limit reactivity surface**

```js
export const useProductStore = defineStore('products', () => {
    const allProducts = shallowRef([])

    // Only components using filtered products re-render when filter changes
    const activeProducts = computed(() =>
        allProducts.value.filter(p => p.active)
    )

    const productCount = computed(() => allProducts.value.length)

    return { allProducts, activeProducts, productCount }
})
```

**3. Use `$patch` for batch updates**

```js
// ❌ Multiple reactive triggers
store.count++
store.name = 'new'
store.items.push(item)
// Three separate reactive updates!

// ✅ Single reactive trigger
store.$patch({
    count: store.count + 1,
    name: 'new',
    items: [...store.items, item]
})

// ✅ Or with function form for complex mutations
store.$patch((state) => {
    state.count++
    state.name = 'new'
    state.items.push(item)
})
```

---

## Interview Perspective

**Q: What are composables in Vue 3?**

- Functions that encapsulate stateful, reactive logic using Composition API
- Vue's equivalent of React custom hooks
- Replace mixins (which had name collisions, unclear sources, poor TypeScript)
- Convention: `use` prefix, return reactive refs
- Can use lifecycle hooks, watchers, computed inside composables

**Q: Explain Pinia and how it differs from Vuex.**

- Pinia is Vue 3's official state management (replaces Vuex)
- Key differences from Vuex:
  - No mutations — directly mutate state in actions
  - No nested modules — independent, composable stores
  - Full TypeScript inference automatically
  - Composition API support in store definitions
  - Simpler API — no `commit`, no `dispatch`, just call functions
- Pinia stores are basically composables with DevTools integration

**Q: Explain mixins and why composables are preferred now.**

- Mixins merge options into components — share data, methods, lifecycle hooks
- Problems: name collisions (silent), unclear source, TypeScript can't infer, implicit coupling
- Composables fix all these — explicit imports, controlled naming, full type inference
- Same evolution as React: class mixins → HOCs → hooks

**Q: How would you structure Pinia stores in a large application?**

- Domain-driven: one store per business domain (users, products, cart)
- Global stores for cross-cutting concerns (auth, notifications, theme)
- Feature-local stores inside feature directories
- Stores compose each other — useCheckoutStore uses useCartStore + useUserStore

**Q: What problems occur if everything is stored globally?**

- God store becomes unmaintainable, untestable
- Local UI state (form values, toggles) creates unnecessary coupling
- Stale data from never-invalidated cache
- Memory bloat from data never cleaned up
- Rule: local ref for single component, provide/inject for subtree, Pinia for global

**Q: Explain optimistic UI updates with Pinia.**

- Save current state → update UI immediately → send API call → rollback on failure
- Mental model: credit card transaction (get item now, pay later, reverse if declined)
- Vue's mutability makes rollback simple — just reassign previous state

**Q: How would you persist state in Vue apps?**

- Manual: initialize from localStorage, watch and save on changes
- Pinia plugin: `$subscribe` to save state, `$patch` to restore on load
- Library: `pinia-plugin-persistedstate` — add `persist: true` to store options
- Choose storage: localStorage (permanent), sessionStorage (per tab), IndexedDB (large data)

**Q: How do you prevent unnecessary reactive store updates?**

- `shallowRef` for large datasets — skip deep proxy overhead
- Computed getters to limit reactivity surface — components only track what they use
- `$patch` for batch updates — one trigger instead of multiple
- `triggerRef` to manually trigger shallowRef when needed

---

## Key Takeaways

- Composables = stateful, reactive functions (Vue's custom hooks)
- Composables solve mixins' problems: name collisions, unclear sources, no TypeScript
- Composables can use the full Composition API (lifecycle, watch, computed)
- Pinia replaces Vuex with simpler, type-safe, modular state management
- Pinia removes mutations — just modify state directly (reactivity handles updates)
- Use `storeToRefs()` when destructuring store state to maintain reactivity
- Pinia stores can communicate by importing and using each other
- Structure stores by domain — one store per business domain, not per component
- Keep local state local — not everything belongs in a global store
- Optimistic updates: mutate UI first, API second, rollback on failure
- Persist with `pinia-plugin-persistedstate` or manual `watch` + `localStorage`
- Use `shallowRef` and `$patch` to minimize unnecessary reactive overhead

