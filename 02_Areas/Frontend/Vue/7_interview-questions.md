# Vue.js Interview Questions — Quick Reference

> 50 questions covering mid-level to senior concepts. Each answer references the detailed notes for deep understanding. Every concept is mapped to React equivalents for faster learning.

---

## 1. What is the difference between Vue 2 and Vue 3?

**One-liner:** Vue 3 replaced `Object.defineProperty` with `Proxy` for reactivity, added Composition API, and introduced compiler optimizations.

| Vue 2 | Vue 3 |
|-------|-------|
| `Object.defineProperty` — can't detect new properties | `Proxy` — tracks everything |
| Options API only | Options + Composition API |
| Vuex | Pinia |
| Single root element required | Fragments |
| Poor TypeScript | First-class TypeScript |

**Key interview point:** The Proxy-based reactivity is the single most important change — it fixes Vue 2's biggest bugs (object property detection, array mutation).

📖 [Detailed notes](1_core-fundamentals.md#vue-2-vs-vue-3)

---

## 2. Explain Vue reactivity system internally.

**One-liner:** Vue wraps state in `Proxy` objects. Reading a property **tracks** the dependency. Writing a property **triggers** re-renders of dependent components.

```
Component renders → reads state.count (Proxy get → TRACK)
state.count = 5 (Proxy set → TRIGGER → re-render dependent components)
```

**React contrast:**
- React: You manually tell React "something changed" via `setState`. React re-renders the whole component.
- Vue: Vue **knows** what changed because Proxy intercepted the mutation. Only affected components re-render.

**Mental model:** Spreadsheet formulas — cells auto-update when dependencies change.

📖 [Detailed notes](1_core-fundamentals.md#reactivity-system--internal-working)

---

## 3. What are refs and reactive in Composition API?

| | `ref` | `reactive` |
|-|-------|------------|
| Types | Any (primitives + objects) | Objects only |
| Access | `.value` in JS, auto-unwrap in template | Direct access |
| Reassignment | ✅ `myRef.value = newObj` | ❌ Breaks reactivity |
| Destructuring | ✅ Safe | ❌ Breaks reactivity |
| React equivalent | `useState` | No equivalent |

**Rule:** Use `ref` by default. Use `reactive` for groups of related state you'll never reassign.

📖 [Detailed notes](1_core-fundamentals.md#ref-vs-reactive)

---

## 4. Difference between Composition API and Options API?

**Options API** = organize by type (data → methods → computed → watch)
**Composition API** = organize by feature (all search logic together, all auth logic together)

**React mapping:**
- Options API ≈ React class components
- Composition API ≈ React hooks + functional components

**Why Composition API wins:**
1. Better code organization at scale
2. Composables replace mixins (no name collisions)
3. Full TypeScript support
4. No `this` keyword confusion

📖 [Detailed notes](1_core-fundamentals.md#options-api-vs-composition-api)

---

## 5. When would you use computed vs watch?

| Use `computed` | Use `watch` |
|---------------|-------------|
| Derive a value | Perform side effects |
| `fullName = first + last` | API call on search change |
| Pure, cached, no side effects | localStorage sync, logging |
| React: `useMemo` | React: `useEffect` |

**Rule:** "What should Y **be** based on X?" → computed. "What should I **do** when X changes?" → watch.

📖 [Detailed notes](2_computed-watch-lifecycle.md#computed-vs-watch--when-to-use-which)

---

## 6. How does Vue virtual DOM work?

```
Template → Render function → VNode tree → Diff → Patch minimal DOM changes
```

**Vue 3 compiler advantages over React:**
1. **Static hoisting** — static elements created once, never re-diffed
2. **Patch flags** — marks exactly what can change (text, class, style)
3. **Tree flattening** — skips entire static subtrees

React diffs the full tree. Vue only diffs parts that **can** change.

📖 [Detailed notes](3_components-communication.md#virtual-dom)

---

## 7. Explain Vue lifecycle hooks with real use cases.

| Hook | Use Case | React Equivalent |
|------|----------|-----------------|
| `setup()` body | Init state, computed, watchers | Component function body |
| `onMounted` | API calls, DOM access, library init | `useEffect(() => {}, [])` |
| `onUnmounted` | Cleanup (timers, listeners) | `useEffect` cleanup |
| `onUpdated` | Read updated DOM (rare) | `useEffect` (no deps) |

**Most important:** `onMounted` for init, `onUnmounted` for cleanup. Same pattern as React's `useEffect`.

📖 [Detailed notes](2_computed-watch-lifecycle.md#lifecycle-hooks)

---

## 8. What is nextTick and when is it needed?

Vue batches DOM updates. `nextTick` waits for the batch to complete.

```js
count.value = 1
// DOM still shows 0 here!
await nextTick()
// DOM is now updated to 1
```

**Use cases:** Focus input after showing modal, scroll after adding items, measure elements after update.

**React comparison:** Similar to React 18's automatic batching. `nextTick` ≈ waiting for React's batch to flush.

📖 [Detailed notes](2_computed-watch-lifecycle.md#nexttick)

---

## 9. Difference between v-if and v-show?

| | `v-if` | `v-show` |
|-|--------|----------|
| DOM | Creates/destroys element | Toggles `display: none` |
| Initial cost | Lazy (skips if false) | Always renders |
| Toggle cost | Expensive (rebuild DOM) | Cheap (CSS toggle) |
| Use when | Condition rarely changes | Toggles frequently |
| React | `{cond && <C />}` | `style={{ display: cond ? 'block' : 'none' }}` |

📖 [Detailed notes](1_core-fundamentals.md#conditional-rendering--v-if-vs-v-show)

---

## 10. How does component communication work in Vue?

| Pattern | Direction | React Equivalent |
|---------|-----------|-----------------|
| Props | Parent → Child | `props` |
| Emits | Child → Parent | Callback props |
| `v-model` | Two-way | `value` + `onChange` |
| Provide/Inject | Ancestor → Descendant | Context API |
| Pinia | Any → Any | Redux/Zustand |

📖 [Detailed notes](3_components-communication.md#component-communication)

---

## 11. What are slots? Explain named and scoped slots.

- **Default slot** = React's `props.children`
- **Named slots** = multiple content areas (header, footer, default)
- **Scoped slots** = child exposes data to parent template (React render props)

```vue
<!-- Scoped slot: child has data, parent decides presentation -->
<ItemList :items="products">
    <template #default="{ item }">
        <span>{{ item.name }} — ${{ item.price }}</span>
    </template>
</ItemList>
```

📖 [Detailed notes](3_components-communication.md#slots)

---

## 12. What are composables in Vue 3?

Composables = Vue's custom hooks. Functions that encapsulate **stateful, reactive logic**.

```js
// useSearch.js
export function useSearch() {
    const query = ref('')
    const results = ref([])
    watch(query, () => fetchResults())
    return { query, results }
}
```

**Why they replaced mixins:** No name collisions, clear source, full TypeScript, composable.

📖 [Detailed notes](4_composables-state-management.md#composables)

---

## 13. Explain Pinia and how it differs from Vuex.

| Vuex | Pinia |
|------|-------|
| Mutations + Actions (why both?) | Only actions |
| Single store with nested modules | Independent stores |
| `this.$store.commit('mutation')` | `store.action()` |
| Poor TypeScript | Full type inference |
| Complex boilerplate | Minimal setup |

**Pinia = composables + DevTools.** Stores are basically composables with state persistence and Vue DevTools integration.

📖 [Detailed notes](4_composables-state-management.md#pinia--state-management)

---

## 14. How does Vue Router work internally?

1. Uses History API (`pushState/replaceState`) — no page reload
2. Matches URL to route config → resolves component
3. Runs navigation guard pipeline (before/after hooks)
4. Updates reactive route object → `<router-view>` renders matched component

**Unique features vs React Router:** Built-in navigation guards, route meta, transition support.

📖 [Detailed notes](5_routing-navigation.md)

---

## 15. What causes unnecessary re-renders in Vue?

**Key insight:** Vue has **granular reactivity** — parent re-render does NOT cascade to children (unlike React).

Components re-render only when their **own** reactive dependencies change. Common pitfalls:
- Inline objects/functions in templates (new reference every render)
- Excessive reactive mutations in watchers
- Not using computed for expensive derivations

📖 [Detailed notes](3_components-communication.md#causes-of-unnecessary-re-renders)

---

## 16. Explain key usage in v-for and why it matters.

Without `:key` — Vue patches elements in-place (breaks component state on reorder).
With `:key` — Vue moves DOM elements to match new order (preserves state).

```vue
<!-- ✅ Always use unique, stable ID -->
<li v-for="item in items" :key="item.id">

<!-- ❌ Never use index for dynamic lists -->
<li v-for="(item, i) in items" :key="i">
```

Same concept as React's `key` prop — exact same rules apply.

📖 [Detailed notes](3_components-communication.md#key-in-v-for)

---

## 17. How would you optimize performance in a large Vue app?

| Priority | Technique |
|----------|-----------|
| High | Route-level code splitting (lazy load) |
| High | Computed properties for expensive calculations |
| Medium | `defineAsyncComponent` for heavy components |
| Medium | Virtual scrolling for long lists |
| Medium | `KeepAlive` for tab-like UIs |
| Low | `v-once` for static content |
| Low | `shallowRef` for large datasets |
| Low | `v-memo` for selective memoization |

📖 [Detailed notes](6_performance-ssr-architecture.md#performance-optimization)

---

## 18. Explain SSR and hydration in Vue/Nuxt.

- **SSR:** Server renders HTML → browser shows content immediately → better SEO + FCP
- **Hydration:** Client-side Vue attaches reactivity to server HTML (statue comes to life)
- **Nuxt** = Vue's Next.js (SSR framework)
- **Modes:** SSR (per-request), SSG (build-time), SPA (client-only)

Avoid hydration mismatches — don't use dynamic data (dates, random) in initial render.

📖 [Detailed notes](6_performance-ssr-architecture.md#ssr-and-hydration-vue--nuxt)

---

## 19. How would you structure a scalable enterprise Vue project?

**Feature-based structure:**

```
src/
├── features/           # Domain-driven modules
│   ├── users/         # All user-related code
│   ├── products/      # All product-related code
│   └── orders/
├── components/         # Shared UI components
├── composables/        # Shared composables
├── stores/             # Shared Pinia stores
├── services/           # API service layer
├── router/
└── types/
```

**Key principles:** Feature-based organization, API service layer with interceptors, Pinia per domain, TypeScript everywhere.

📖 [Detailed notes](6_performance-ssr-architecture.md#enterprise-project-structure)

---

## 20. Explain how you would debug a memory leak in a Vue application.

**Common leak sources:**
1. Uncleared `setInterval`/`setTimeout`
2. Unremoved `addEventListener`
3. Third-party libraries not destroyed (charts, maps)
4. Closures holding large data references

**Debugging process:**
1. Chrome DevTools → Memory → Heap snapshots (before/after navigation)
2. Compare snapshots — look for increasing retained size
3. Filter for "Detached" DOM elements
4. Fix: add cleanup in `onUnmounted`
5. Verify: memory stabilizes on repeated navigation

📖 [Detailed notes](6_performance-ssr-architecture.md#debugging-memory-leaks)

---

# Additional Interview Questions (30)

> Organized by category. These cover deeper knowledge expected at senior level. Each references detailed notes.

---

## Core Vue Concepts

### 21. What is the difference between ref and shallowRef?

- `ref`: deep reactivity — tracks nested property changes via recursive Proxy
- `shallowRef`: only tracks `.value` reassignment — nested mutations are invisible
- Use `shallowRef` for large datasets, third-party class instances, performance
- React's `useState` is inherently shallow — `shallowRef` is closer to React's default

📖 [Detailed notes](8_advanced-reactivity.md#ref-vs-shallowref)

---

### 22. What is shallowReactive and when would you use it?

- `shallowReactive`: only root-level properties are reactive, nested objects are plain
- Use for: config objects, integration with external libraries that manage their own state
- `reactive`: deep, all levels tracked. `shallowReactive`: one proxy layer only

📖 [Detailed notes](8_advanced-reactivity.md#shallowreactive)

---

### 23. Explain how dependency tracking works in Vue 3.

- Every reactive read inside an effect (render, computed, watcher) is recorded
- Proxy `get` trap fires → Vue records "this effect depends on this property"
- Proxy `set` trap fires → Vue re-runs all effects that depend on that property
- Dependencies are dynamic — recalculated each time an effect runs
- React requires manual dependency arrays; Vue auto-detects

📖 [Detailed notes](8_advanced-reactivity.md#dependency-tracking--deep-dive)

---

### 24. What happens internally when a reactive value changes?

1. Proxy `set` trap fires → check if value actually changed (`Object.is`)
2. Collect all effects depending on this property
3. Schedule effects in microtask queue (batch — don't run immediately)
4. Computed recalculates → watchers fire → render functions re-run
5. Virtual DOM diff → patch real DOM

Multiple changes in the same tick are batched into **one** update.

📖 [Detailed notes](8_advanced-reactivity.md#what-happens-when-a-reactive-value-changes)

---

### 25. Why does destructuring reactive objects sometimes break reactivity?

- Destructuring extracts the primitive **value** from the Proxy wrapper
- The extracted value is plain JS — no longer tracked by Vue
- Fix: use `toRef(state, 'prop')` or `toRefs(state)` to maintain the link
- Mental model: scooping a fish out of the aquarium — you lose tracking

📖 [Detailed notes](8_advanced-reactivity.md#why-destructuring-breaks-reactivity)

---

### 26. What is toRef and toRefs?

- `toRef(state, 'key')`: creates a ref **linked** to a reactive property — changes sync both ways
- `toRefs(state)`: converts all properties to linked refs — safe destructuring
- Essential for composables returning reactive state: `return { ...toRefs(state) }`

📖 [Detailed notes](8_advanced-reactivity.md#toref-and-torefs)

---

### 27. Explain effect scope in Vue.

- `effectScope()` groups watchers, computed, watchEffects for batch cleanup
- `scope.stop()` stops all collected effects at once
- Useful for: composable libraries, testing, code outside component lifecycle
- Mental model: power strip — flip one switch, all devices power off

📖 [Detailed notes](8_advanced-reactivity.md#effect-scope)

---

### 28. What is markRaw and when should it be used?

- `markRaw(obj)` prevents Vue from wrapping an object in Proxy
- Use for: Chart.js instances, Google Maps, Web Workers, immutable datasets
- Needed because Vue's automatic deep Proxy can break complex class internals

📖 [Detailed notes](8_advanced-reactivity.md#markraw)

---

### 29. What are custom directives in Vue?

- Reusable hooks attached to DOM elements — `v-focus`, `v-click-outside`, `v-permission`
- Lifecycle hooks: `mounted`, `updated`, `unmounted` (mirror component lifecycle)
- Rule: DOM manipulation → directive. Reactive logic → composable
- In `<script setup>`, any `v`-prefixed variable auto-registers as directive

📖 [Detailed notes](8_advanced-reactivity.md#custom-directives)

---

### 30. Explain dynamic components and keep-alive.

- `<component :is="currentComponent">` switches rendered component dynamically
- Without `KeepAlive`: switching destroys component (state lost)
- With `KeepAlive`: component cached in memory, `onActivated`/`onDeactivated` hooks
- Options: `:max` (LRU cache), `:include`/`:exclude` (control what's cached)

📖 [Detailed notes](8_advanced-reactivity.md#dynamic-components--keepalive)

---

## Component Design & Patterns

### 31. What are higher-order component alternatives in Vue?

- Vue doesn't need HOCs — composables are the primary reuse pattern
- HOCs add wrapper nesting (wrapper hell). Composables are flat function calls
- Scoped slots replace render props. Directives handle DOM-level reuse

📖 [Detailed notes](9_component-patterns.md#higher-order-component-alternatives-in-vue)

---

### 32. How would you build reusable form components in Vue?

- Base input components with `v-model` (defineProps `modelValue` + defineEmits `update:modelValue`)
- Form composable (`useForm`) for validation, dirty tracking, reset, touch
- Separation: UI components handle rendering, composable handles logic

📖 [Detailed notes](9_component-patterns.md#reusable-form-components)

---

### 33. Explain controlled vs uncontrolled components in Vue context.

- **Controlled:** parent owns state via `v-model` (recommended)
- **Uncontrolled:** component manages internal state, parent reads via `defineExpose` + template ref
- Vue's `v-model` makes controlled pattern simpler than React's `value`+`onChange`

📖 [Detailed notes](9_component-patterns.md#controlled-vs-uncontrolled-components)

---

### 34. How would you avoid prop drilling in deeply nested components?

1. **Provide/Inject** — subtree-scoped (theme, locale within a feature)
2. **Pinia store** — global (auth, user preferences)
3. **Composables** — shared logic without hierarchy concerns
4. **Slots** — let parent inject content directly

📖 [Detailed notes](9_component-patterns.md#avoiding-prop-drilling)

---

### 35. What are render functions in Vue?

- Direct virtual DOM creation with `h()` — bypass template compiler
- `h(tag, props, children)` creates VNodes
- Use when: dynamic tag names, programmatic component selection, library development
- Templates get compiler optimizations (static hoisting, patch flags) that `h()` misses

📖 [Detailed notes](9_component-patterns.md#render-functions)

---

### 36. When would you use JSX in Vue?

- When templates can't express complex render logic elegantly
- Trade-off: lose Vue's compile-time optimizations
- Requires `@vitejs/plugin-vue-jsx`
- 95% of components should use templates — JSX for exceptional cases

📖 [Detailed notes](9_component-patterns.md#jsx-in-vue)

---

### 37. Explain mixins and why composables are preferred now.

| Mixin Problem | Composable Solution |
|---------------|-------------------|
| Silent name collision | Explicit naming at destructure |
| Unclear data source | `const { x } = useX()` — obvious |
| No TypeScript inference | Full type inference |
| Implicit coupling | Explicit imports |

Same evolution as React: class mixins → HOCs → hooks.

📖 [Detailed notes](9_component-patterns.md#mixins-vs-composables)

---

### 38. What are async components?

- `defineAsyncComponent(() => import('./Component.vue'))` — lazy loaded
- Creates separate JS chunk, downloads on demand
- Built-in loading/error/delay/timeout handling (React needs `Suspense` + `ErrorBoundary`)

📖 [Detailed notes](9_component-patterns.md#async-components)

---

### 39. Explain teleport and its real-world use cases.

- `<Teleport to="body">` renders DOM at target, component logic stays in place
- Events bubble in Vue's component tree, not the DOM tree
- Use for: modals (z-index), tooltips (overflow), notifications (fixed position)
- `:disabled` prop for conditional teleporting (mobile vs desktop)

📖 [Detailed notes](9_component-patterns.md#teleport)

---

### 40. How do error boundaries work in Vue?

- `onErrorCaptured` hook catches descendant component errors
- Return `false` to stop propagation, `true` to bubble
- Global fallback: `app.config.errorHandler`
- Catches: render, watcher, lifecycle, event handler errors
- Does NOT catch: async errors (`try/catch` needed), setTimeout, third-party listeners

📖 [Detailed notes](9_component-patterns.md#error-boundaries-error-handling)

---

## State Management

### 41. How would you structure Pinia stores in a large application?

- Domain-driven: one store per business domain (users, products, cart)
- Global stores: auth, notifications, theme at root `stores/`
- Feature stores: inside `features/users/stores/`
- Stores compose each other — `useCheckoutStore` uses `useCartStore`

📖 [Detailed notes](4_composables-state-management.md#structuring-pinia-stores-in-a-large-application)

---

### 42. What problems occur if everything is stored globally?

| Problem | Result |
|---------|--------|
| God store | Unmaintainable, untestable |
| Over-globalization | Components tightly coupled |
| Stale state | User sees outdated data |
| Memory bloat | App slows over time |

Rule: local ref → provide/inject → Pinia (escalate only when needed)

📖 [Detailed notes](4_composables-state-management.md#problems-with-global-state)

---

### 43. Explain optimistic UI updates with Pinia.

1. Save current state for rollback
2. Update UI immediately (optimistic)
3. Send API call
4. On failure → restore saved state (rollback)

Mental model: credit card (get item now, bank processes later, reverse if declined).

📖 [Detailed notes](4_composables-state-management.md#optimistic-ui-updates)

---

### 44. How would you persist state in Vue apps?

- Manual: init from `localStorage`, `watch` and save on change
- Plugin: `$subscribe` to save, `$patch` to restore
- Library: `pinia-plugin-persistedstate` — `persist: true` option
- Storage choice: localStorage (permanent), sessionStorage (tab), IndexedDB (large)

📖 [Detailed notes](4_composables-state-management.md#persisting-state)

---

### 45. How do you prevent unnecessary reactive store updates?

- `shallowRef` for large datasets — skip deep proxy
- Computed getters — components only track derived values
- `$patch` for batch mutations — one trigger instead of many
- `triggerRef` for manual triggering with `shallowRef`

📖 [Detailed notes](4_composables-state-management.md#preventing-unnecessary-store-updates)

---

## Routing & Architecture

### 46. Explain nested routes in Vue Router.

- `children` array creates nested routes, each level needs `<router-view>`
- URL mirrors component tree: `/dashboard/settings/profile`
- Named views: multiple `<router-view>` at same level with `components` (plural)
- `to.matched` array contains all route records in the chain

📖 [Detailed notes](5_routing-navigation.md#nested-routes--deep-dive)

---

### 47. How would you implement role-based route protection?

- Route `meta: { requiresAuth: true, roles: ['admin'] }`
- `router.beforeEach` checks auth + role against `to.meta`
- `to.matched.some(r => r.meta.requiresAuth)` checks nested chain
- Save redirect in query: `{ path: '/login', query: { redirect: to.fullPath } }`

📖 [Detailed notes](5_routing-navigation.md#role-based-route-protection)

---

### 48. What are navigation guards and common pitfalls?

| Pitfall | Cause | Fix |
|---------|-------|-----|
| Infinite redirect | Guard redirects to guarded route | Check `to.meta` before redirecting |
| Async not awaited | `.then()` without `async/await` | Use `async` guard |
| Lost redirect | No saved destination | Store `to.fullPath` in query param |
| Heavy guards | API call on every navigation | Cache results, check only when needed |

📖 [Detailed notes](5_routing-navigation.md#navigation-guard-pitfalls)

---

### 49. How would you handle API failures globally?

- Axios response interceptor — single error handler for all API calls
- 401 → clear session + redirect to login. 403 → permission notification
- 500+ → server error notification. No response → network error
- 422 → pass through (let component handle validation)
- Token refresh: queue failed requests, refresh, retry all

📖 [Detailed notes](5_routing-navigation.md#handling-api-failures-globally)

---

### 50. How would you architect a microfrontend Vue application?

- Module Federation (Vite): host imports remote components dynamically
- Share Vue/Pinia via `shared` config — single instance
- Host owns router shell, remotes expose components
- Independent CI/CD per microfrontend
- Only worthwhile for 4+ teams with independent deployment needs

📖 [Detailed notes](6_performance-ssr-architecture.md#microfrontend-architecture)

---

## Vue ↔ React Mental Model Cheat Sheet

| Vue | React | Notes |
|-----|-------|-------|
| `ref()` | `useState()` | Vue: mutable `.value`. React: setter function |
| `shallowRef()` | `useState()` | React is always shallow! |
| `reactive()` | — | No direct React equivalent |
| `computed()` | `useMemo()` | Vue auto-tracks deps |
| `watch()` | `useEffect()` | Vue: explicit source. React: dep array |
| `watchEffect()` | — | Auto-tracking `useEffect` |
| `onMounted()` | `useEffect(fn, [])` | |
| `onUnmounted()` | `useEffect` cleanup | |
| `toRef` / `toRefs` | — | React doesn't need (no Proxy) |
| `effectScope` | — | React uses individual useEffect cleanup |
| `markRaw` | — | React doesn't auto-Proxy |
| `provide/inject` | `Context API` | |
| `v-model` | `value` + `onChange` | |
| `<slot>` | `props.children` | |
| Scoped slots | Render props | |
| Composables | Custom hooks | |
| Pinia | Redux/Zustand | |
| `<KeepAlive>` | — | No React equivalent |
| `v-if` | `{cond && <C />}` | |
| `v-show` | `style.display` | |
| `v-for` | `.map()` | |
| `<Teleport>` | `createPortal()` | |
| `<Suspense>` | `<Suspense>` | |
| `onErrorCaptured` | `componentDidCatch` | |
| Custom directives | — (useRef+useEffect) | |
| Navigation guards | Protected routes (manual) | Vue has built-in |
| `nextTick` | `flushSync` (inverse) | |
| `h()` render function | `React.createElement()` | |
| `defineAsyncComponent` | `React.lazy()` | Vue has built-in loading/error |
