# Performance, SSR & Architecture

## Performance Optimization

### Why Vue Is Already Fast

Vue's reactivity system gives it a performance advantage over React by default:
- **Granular reactivity** — only components with changed dependencies re-render (no cascade)
- **Compiler optimizations** — static hoisting, patch flags, tree flattening
- **No `React.memo` needed** — Vue tracks dependencies automatically

But large-scale apps still need optimization. Here's the toolkit:

### 1. Lazy Loading Components

```js
// Route-level lazy loading (most common)
const routes = [
    {
        path: '/admin',
        component: () => import('./views/Admin.vue')   // separate chunk
    }
]

// Component-level lazy loading
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() =>
    import('./components/HeavyChart.vue')
)

// With loading/error states
const HeavyChart = defineAsyncComponent({
    loader: () => import('./components/HeavyChart.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorDisplay,
    delay: 200,         // ms before showing loading component
    timeout: 3000       // ms before showing error component
})
```

> **React comparison:** `defineAsyncComponent` = `React.lazy()` + `<Suspense>`. Vue's version has built-in loading/error handling.

### 2. `v-once` — Render Once, Never Update

```vue
<template>
    <!-- Static content rendered once — skipped in all future updates -->
    <div v-once>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
    </div>
</template>
```

Use for content that never changes after initial render (legal text, static headers).

### 3. `v-memo` — Conditional Memoization

```vue
<template>
    <!-- Re-render this block ONLY when specified deps change -->
    <div v-for="item in list" :key="item.id" v-memo="[item.selected]">
        <p>{{ item.name }}</p>
        <p>{{ item.description }}</p>
        <span>{{ item.selected ? '✓' : '' }}</span>
    </div>
</template>
```

> `v-memo` is like `React.memo` but at the template level. Only re-renders the block when `item.selected` changes, even if other properties of `item` change.

### 4. `shallowRef` / `shallowReactive` — Skip Deep Tracking

```js
import { shallowRef } from 'vue'

// Only tracks .value reassignment, NOT nested changes
const largeList = shallowRef([])

// ❌ This won't trigger update
largeList.value[0].name = 'new name'

// ✅ This triggers update (new reference)
largeList.value = [...largeList.value]
```

Use for large datasets where you don't need deep reactivity (charts, tables with hundreds of rows).

### 5. Virtual Scrolling

For rendering thousands of items, render only visible items:

```vue
<!-- Using vue-virtual-scroller library -->
<script setup>
import { RecycleScroller } from 'vue-virtual-scroller'
</script>

<template>
    <RecycleScroller
        :items="hugeList"
        :item-size="50"
        key-field="id"
    >
        <template #default="{ item }">
            <div class="item">{{ item.name }}</div>
        </template>
    </RecycleScroller>
</template>
```

> **React comparison:** Same as `react-window` or `react-virtuoso` — only renders visible items in the viewport.

### 6. `computed` for Expensive Derivations

```js
// ✅ Computed — cached, runs only when deps change
const filteredItems = computed(() =>
    items.value.filter(i => i.name.includes(search.value))
)

// ❌ Method — re-runs on every render
function getFilteredItems() {
    return items.value.filter(i => i.name.includes(search.value))
}
```

### 7. `KeepAlive` — Cache Component Instances

```vue
<template>
    <!-- Cache component instances when switching between them -->
    <KeepAlive>
        <component :is="currentTab" />
    </KeepAlive>

    <!-- With include/exclude -->
    <KeepAlive :include="['TabA', 'TabB']" :max="5">
        <router-view />
    </KeepAlive>
</template>
```

Without `KeepAlive`, switching tabs destroys and recreates the component (losing state). With `KeepAlive`, the component is cached in memory.

> **React comparison:** React has no built-in equivalent. You'd have to hide components with CSS (`display: none`) or manage state externally. Vue's `KeepAlive` is a first-class feature.

### Performance Optimization Summary

| Technique | What it does | When to use |
|-----------|-------------|-------------|
| Lazy loading | Code split, load on demand | Heavy components, route-level |
| `v-once` | Render once, skip updates | Static content |
| `v-memo` | Skip re-render unless deps change | Large lists with selective updates |
| `shallowRef` | Skip deep reactivity tracking | Large datasets |
| Virtual scrolling | Render only visible items | 1000+ item lists |
| `computed` | Cache derived values | Expensive calculations |
| `KeepAlive` | Cache component instances | Tab switching, preserve state |
| `defineAsyncComponent` | Lazy load with loading/error | Heavy components |

---

## SSR and Hydration (Vue / Nuxt)

### Problem — Why SSR?

**Client-Side Rendering (CSR) — how SPAs work:**

```
Browser request → Server sends empty HTML + JS bundle
→ Browser downloads JS → JS executes → Renders page
→ User sees content (slow First Contentful Paint)
```

**Problems with CSR:**
1. **Slow initial load** — user sees blank page until JS downloads and executes
2. **Bad SEO** — search engine crawlers see empty HTML
3. **Poor performance on slow devices** — JS heavy

### Solution — Server-Side Rendering

```
Browser request → Server renders HTML with content
→ Browser receives full HTML → User sees content immediately (fast FCP)
→ Browser downloads JS → Hydration (attach interactivity)
→ Page is now fully interactive
```

### What is Hydration?

> Hydration is the process of attaching Vue's reactivity and event listeners to the server-rendered HTML. The server sends **static HTML**. The client-side Vue app "hydrates" it — making it interactive without re-rendering from scratch.

### Mental Model — Statue Coming to Life

SSR sends a **painted statue** (static HTML that looks right). Hydration is the magic spell that **brings the statue to life** (adds interactivity). Without hydration, the page looks correct but buttons don't work.

> **React comparison:** Identical concept. React calls it hydration too — `ReactDOM.hydrateRoot()`. The server renders to HTML string, client hydrates with event listeners and state.

### SSR Flow in Vue

```
Server:
1. Create Vue app instance
2. Run component setup (data fetching, computed, etc.)
3. Render to HTML string: renderToString(app)
4. Send HTML to browser

Client:
1. Browser displays HTML immediately (fast FCP)
2. Vue bundle downloads
3. Vue creates app instance
4. Hydration: Vue walks existing DOM, attaches reactivity
5. Page is now fully interactive (TTI)
```

### Hydration Mismatch

If the server-rendered HTML doesn't match what the client would render, Vue logs a **hydration mismatch** warning:

```js
// ❌ Will cause hydration mismatch
<template>
    <p>{{ new Date().toLocaleString() }}</p>  <!-- different time on server vs client -->
</template>

// ✅ Fix: use onMounted (runs only on client)
<script setup>
import { ref, onMounted } from 'vue'
const time = ref('')
onMounted(() => {
    time.value = new Date().toLocaleString()
})
</script>
```

### Nuxt.js — Vue's SSR Framework

Nuxt is to Vue what **Next.js** is to React — a meta-framework with:

| Feature | Nuxt (Vue) | Next.js (React) |
|---------|-----------|----------------|
| SSR | Built-in | Built-in |
| File-based routing | `pages/` directory | `app/` or `pages/` directory |
| API routes | `server/api/` | `api/` or Route Handlers |
| Auto imports | Components & composables | Needs configuration |
| Data fetching | `useFetch`, `useAsyncData` | `getServerSideProps`, Server Components |
| Static generation | `nuxt generate` | `next export` |
| Middleware | File-based | Middleware file |

### Rendering Modes

```js
// nuxt.config.ts
export default defineNuxtConfig({
    // SSR — server renders on every request (default)
    ssr: true,

    // SPA — client-side only rendering
    ssr: false,

    // Static Site Generation — pre-render at build time
    // Run: npx nuxt generate
})
```

| Mode | When HTML is generated | Use case |
|------|----------------------|----------|
| SSR | Every request (server) | Dynamic content, personalized pages |
| SSG | Build time (once) | Blogs, documentation, marketing |
| SPA | Client-side (browser) | Dashboards, internal tools |
| ISR | Build time + revalidate | E-commerce (periodic refresh) |

---

## Enterprise Project Structure

### Problem — Scaling a Vue App

Small apps work with any structure. Enterprise apps need:
- Clear module boundaries
- Team ownership of features
- Independent testing
- Scalable architecture

### Recommended Structure

```
src/
├── assets/                    # Static assets (images, fonts)
├── components/                # Shared/generic components
│   ├── ui/                    # Base UI components (Button, Modal, Input)
│   ├── layout/                # Layout components (Sidebar, Header)
│   └── common/                # Shared business components
├── composables/               # Shared composables
│   ├── useFetch.js
│   ├── useAuth.js
│   └── useDebounce.js
├── stores/                    # Pinia stores
│   ├── useAuthStore.js
│   └── useNotificationStore.js
├── router/                    # Router config
│   ├── index.js
│   └── guards.js
├── views/                     # Page-level components (route targets)
│   ├── Home.vue
│   └── Login.vue
├── features/                  # Feature modules (domain-driven)
│   ├── users/
│   │   ├── components/        # Feature-specific components
│   │   ├── composables/       # Feature-specific composables
│   │   ├── stores/            # Feature-specific stores
│   │   ├── types/             # Feature-specific types
│   │   └── views/             # Feature-specific pages
│   ├── products/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   └── views/
│   └── orders/
├── services/                  # API layer
│   ├── api.js                 # Axios/fetch configuration
│   ├── userService.js
│   └── productService.js
├── types/                     # Shared TypeScript types
├── utils/                     # Pure utility functions
├── plugins/                   # Vue plugins
├── directives/                # Custom directives
├── App.vue
└── main.js
```

### Key Architecture Principles

**1. Feature-based organization** — group by domain, not by type

```
# ❌ Organized by type (doesn't scale)
components/UserCard.vue
components/UserForm.vue
stores/userStore.js
composables/useUser.js

# ✅ Organized by feature (scales well)
features/users/components/UserCard.vue
features/users/components/UserForm.vue
features/users/stores/useUserStore.js
features/users/composables/useUser.js
```

**2. API service layer** — isolate API calls

```js
// services/api.js
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000
})

// Request interceptor — attach auth token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Response interceptor — handle errors globally
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // redirect to login
        }
        return Promise.reject(error)
    }
)

export default api
```

```js
// services/userService.js
import api from './api'

export const userService = {
    getAll:  ()     => api.get('/users'),
    getById: (id)   => api.get(`/users/${id}`),
    create:  (data) => api.post('/users', data),
    update:  (id, data) => api.put(`/users/${id}`, data),
    delete:  (id)   => api.delete(`/users/${id}`)
}
```

**3. Environment configuration**

```
# .env
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=My App

# .env.production
VITE_API_URL=https://api.production.com
VITE_APP_TITLE=My App (Production)
```

```js
// Access in code
const apiUrl = import.meta.env.VITE_API_URL
```

> All env variables must start with `VITE_` to be exposed to client code.

---

## Debugging Memory Leaks

### Common Sources of Memory Leaks in Vue

**1. Uncleared timers and intervals**

```js
// ❌ Leak — interval continues after component unmounts
onMounted(() => {
    setInterval(() => fetchData(), 5000)
})

// ✅ Fixed — clear on unmount
let timer
onMounted(() => {
    timer = setInterval(() => fetchData(), 5000)
})
onUnmounted(() => {
    clearInterval(timer)
})
```

**2. Unremoved event listeners**

```js
// ❌ Leak — listener persists after unmount
onMounted(() => {
    window.addEventListener('resize', handleResize)
})

// ✅ Fixed — remove on unmount
onMounted(() => {
    window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
```

**3. Third-party library instances not destroyed**

```js
// ❌ Leak — chart instance stays in memory
onMounted(() => {
    const chart = new Chart(canvas.value, config)
})

// ✅ Fixed — destroy on unmount
let chart
onMounted(() => {
    chart = new Chart(canvas.value, config)
})
onUnmounted(() => {
    chart.destroy()
})
```

**4. Closures holding references**

```js
// ❌ Leak — closure holds reference to large data
const processData = () => {
    const largeData = fetchHugeDataset()
    return () => {
        console.log(largeData.length)    // largeData can't be GC'd
    }
}
```

**5. Reactive references to removed DOM**

```js
// ❌ Leak — storing DOM references in reactive state
const elements = ref([])
onMounted(() => {
    document.querySelectorAll('.item').forEach(el => {
        elements.value.push(el)    // DOM elements held in reactive state
    })
})
```

### Debugging Process

```
Step 1: Reproduce
    → Navigate to suspected page, perform actions, navigate away, repeat

Step 2: Measure
    → Chrome DevTools → Memory tab → Take heap snapshots
    → Compare snapshots — look for increasing retained size

Step 3: Identify
    → Filter for "Detached" elements — these are DOM nodes no longer in tree
    → Look for Vue component instances that should have been destroyed
    → Check retainers path to find what's holding the reference

Step 4: Fix
    → Add cleanup in onUnmounted
    → Remove event listeners, clear timers, destroy third-party instances
    → Use weak references where appropriate

Step 5: Verify
    → Take new heap snapshots after fix
    → Confirm memory stabilizes on repeated navigation
```

### Chrome DevTools Memory Panel

```
1. Performance Monitor → Watch JS Heap Size over time
   → Should stabilize, not continuously grow

2. Memory → Heap Snapshot
   → Take snapshot before navigation
   → Navigate to page, interact, navigate away
   → Take another snapshot
   → Compare: Objects allocated between snapshots that weren't freed = leak

3. Memory → Allocation Timeline
   → Records allocation over time
   → Blue bars = allocated, gray bars = freed
   → Blue bars that never turn gray = potential leak
```

> **React comparison:** Same debugging approach. React has similar leak sources (uncleared effects, subscriptions, closures). The difference is Vue's `onUnmounted` replaces React's `useEffect` cleanup return function.

---

## Microfrontend Architecture

### Core Idea

> Microfrontends split a large frontend application into independently deployable units, each owned by different teams. Each unit can use different frameworks, deploy independently, and communicate through well-defined contracts.

### Mental Model

Microfrontends are like a **shopping mall** — each store (microfrontend) operates independently with its own staff and inventory, but they share common infrastructure (mall building, corridors, parking).

### Approaches for Vue

| Approach | Isolation | Complexity | Use Case |
|----------|-----------|------------|----------|
| Module Federation (Webpack/Vite) | Medium | Medium | Shared runtime, split bundles |
| Single-SPA | High | High | Multi-framework apps |
| iframes | Complete | Low | Legacy integration, full isolation |
| Web Components | High | Medium | Framework-agnostic widgets |
| Monorepo with lazy routes | Low | Low | Same-team, same-framework |

### Module Federation (Most Common)

```js
// vite.config.js — Host app
import federation from '@originjs/vite-plugin-federation'

export default {
    plugins: [
        federation({
            name: 'host',
            remotes: {
                userApp: 'http://localhost:3001/assets/remoteEntry.js',
                productApp: 'http://localhost:3002/assets/remoteEntry.js'
            },
            shared: ['vue', 'pinia']    // shared dependencies — loaded once
        })
    ]
}
```

```js
// vite.config.js — Remote app (user micro-frontend)
export default {
    plugins: [
        federation({
            name: 'userApp',
            filename: 'remoteEntry.js',
            exposes: {
                './UserProfile': './src/components/UserProfile.vue',
                './UserList': './src/views/UserList.vue'
            },
            shared: ['vue', 'pinia']
        })
    ]
}
```

```vue
<!-- Host app — consuming remote component -->
<script setup>
import { defineAsyncComponent } from 'vue'

const RemoteUserProfile = defineAsyncComponent(() =>
    import('userApp/UserProfile')
)
</script>

<template>
    <Suspense>
        <RemoteUserProfile :userId="123" />
        <template #fallback>Loading...</template>
    </Suspense>
</template>
```

### Key Challenges

| Challenge | Solution |
|-----------|----------|
| Shared state | Shared Pinia instance or event bus |
| Routing | Host owns primary router, remotes use sub-routes |
| Styling conflicts | CSS Modules, Shadow DOM, or BEM namespacing |
| Version conflicts | `shared` config ensures single instance of Vue |
| Communication | Custom events, shared store, or postMessage (iframes) |
| Deployment | Independent CI/CD pipelines, CDN-hosted remote entries |

### When NOT to Use Microfrontends

- Small/medium teams (under ~4 teams)
- Single-framework app with shared deployment
- Tight coupling between features
- Overhead not justified by team independence

> **React comparison:** Same patterns exist — Module Federation, Single-SPA, and iframes work identically. The Vue-specific part is sharing Vue/Pinia instances across remotes.

---

## Interview Perspective

**Q: How would you optimize performance in a large Vue app?**

1. **Route-level code splitting** — lazy load routes with dynamic `import()`
2. **Component lazy loading** — `defineAsyncComponent` for heavy components
3. **Computed properties** — cache expensive derivations
4. **`v-once`** — render static content once
5. **`v-memo`** — memoize template blocks
6. **`shallowRef`** — skip deep reactivity for large datasets
7. **Virtual scrolling** — render only visible items in long lists
8. **`KeepAlive`** — cache component instances for tab-like UIs
9. **Pinia over prop drilling** — avoid unnecessary re-renders from prop cascading
10. **Tree shaking** — import only what you use from libraries

**Q: Explain SSR and hydration in Vue/Nuxt.**

- SSR renders Vue components to HTML on the server → fast initial load, good SEO
- Browser receives full HTML → user sees content immediately
- Hydration: client-side Vue attaches reactivity and listeners to existing HTML
- Hydration mismatches occur when server/client render differently (avoid dynamic data in initial render)
- Nuxt is Vue's SSR framework (like Next.js for React)
- Rendering modes: SSR (per-request), SSG (build-time), SPA (client-only), ISR (build + revalidate)

**Q: How would you structure a scalable enterprise Vue project?**

- Feature-based organization (group by domain: users/, products/, orders/)
- Shared composables, components, and stores at root level
- API service layer with interceptors (auth, error handling)
- Pinia stores per feature domain
- TypeScript for type safety
- Environment-based configuration
- Clear boundaries between features (no cross-imports between features)

**Q: How would you debug a memory leak in a Vue application?**

1. Reproduce the leak (navigate to/from suspected page)
2. Use Chrome DevTools Memory panel — heap snapshots, allocation timeline
3. Look for detached DOM elements and unreleased component instances
4. Common sources: uncleared timers, event listeners, third-party libraries
5. Fix: add cleanup in `onUnmounted` for all external resources
6. Verify with new heap snapshots — memory should stabilize

**Q: How would you architect a microfrontend Vue application?**

- Module Federation (Vite/Webpack) is the most common approach
- Host app owns the shell (layout, router, shared state)
- Remote apps expose components/views via `exposes` config
- Share Vue and Pinia via `shared` to avoid duplicate instances
- Each remote has independent CI/CD and deployment
- Only worth the complexity for large teams (4+) with independent deployment needs

---

## Key Takeaways

- Vue is already faster than React for most use cases due to granular reactivity and compiler optimizations
- Lazy loading (routes + components) is the highest-impact optimization
- `KeepAlive` is a unique Vue feature — caches component instances (React has no equivalent)
- `v-memo` and `shallowRef` are escape hatches for extreme performance scenarios
- SSR solves SEO and initial load — Nuxt makes it easy (like Next.js for React)
- Hydration attaches interactivity to server-rendered HTML — avoid mismatches
- Enterprise projects should use feature-based structure with clear domain boundaries
- Memory leaks come from uncleared resources — always clean up in `onUnmounted`
- Microfrontends: use Module Federation for independent deployment, share Vue/Pinia instances
