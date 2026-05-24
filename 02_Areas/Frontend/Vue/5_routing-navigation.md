# Routing & Navigation

## Vue Router — Core Idea

> Vue Router is Vue's official client-side router. It maps URL paths to components and handles navigation without full page reloads. It's the equivalent of React Router but is an **official** part of the Vue ecosystem.

## How Vue Router Works Internally

### Mental Model — Switchboard Operator

Vue Router is like a **telephone switchboard operator**:
1. A call comes in (URL changes)
2. The operator looks up the routing table (route config)
3. Connects the caller to the right line (renders the component)
4. Optionally checks authorization (navigation guards)

### Internal Flow

```
URL Change → Router intercepts → Match route config → Run navigation guards
    → Update reactive route object → <router-view> renders matched component
```

**Under the hood:**

1. **History API** — Router uses `window.history.pushState/replaceState` to change URLs without page reload
2. **Reactive route** — Current route is a reactive object. When it changes, components depending on it re-render
3. **Component resolution** — Router resolves the component for the matched route (supports lazy loading)
4. **Navigation guards** — Before/after hooks run to allow/deny/redirect navigation

> **React comparison:** Same concept as React Router's `<BrowserRouter>` + `<Routes>`. Both use the History API. Vue Router has more built-in features: navigation guards, lazy loading, scroll behavior.

---

## Setup

```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') }  // 404
]

const router = createRouter({
    history: createWebHistory(),     // HTML5 History mode (clean URLs)
    routes
})

export default router
```

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

```vue
<!-- App.vue -->
<template>
    <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
    </nav>
    <router-view />   <!-- matched component renders here -->
</template>
```

> **React comparison:**
> - `<router-link to="/">` = `<Link to="/">`
> - `<router-view />` = `<Outlet />` (React Router v6)
> - `createRouter` = `createBrowserRouter`

---

## Route Configuration

### Dynamic Routes

```js
const routes = [
    // Dynamic segment — :id is a parameter
    { path: '/user/:id', component: UserProfile },

    // Multiple params
    { path: '/user/:userId/post/:postId', component: PostDetail },

    // Optional param
    { path: '/user/:id?', component: UserProfile },

    // Regex constraint
    { path: '/user/:id(\\d+)', component: UserProfile },   // id must be numeric
]
```

**Accessing params:**

```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id)        // dynamic segment value
console.log(route.query.search)     // ?search=vue → 'vue'
console.log(route.hash)             // #section → '#section'
</script>
```

> **React comparison:** `useRoute()` = `useParams()` + `useSearchParams()` + `useLocation()` combined.

### Named Routes

```js
const routes = [
    { path: '/user/:id', name: 'user-profile', component: UserProfile }
]

// Navigate by name (preferred — URL changes won't break links)
<router-link :to="{ name: 'user-profile', params: { id: 1 } }">
    User 1
</router-link>
```

### Nested Routes

```js
const routes = [
    {
        path: '/dashboard',
        component: DashboardLayout,
        children: [
            { path: '',        component: DashboardHome },      // /dashboard
            { path: 'profile', component: DashboardProfile },   // /dashboard/profile
            { path: 'settings', component: DashboardSettings }  // /dashboard/settings
        ]
    }
]
```

```vue
<!-- DashboardLayout.vue -->
<template>
    <div class="dashboard">
        <Sidebar />
        <main>
            <router-view />   <!-- child routes render here -->
        </main>
    </div>
</template>
```

> **React comparison:** Same as React Router v6 nested routes with `<Outlet />`. Children render inside parent's `<router-view>`.

### Lazy Loading (Code Splitting)

```js
const routes = [
    {
        path: '/admin',
        // Dynamic import — component loaded only when route is visited
        component: () => import('@/views/Admin.vue')
    }
]
```

> Lazy loading creates a separate JS bundle for the component. The browser downloads it only when the user navigates to that route. Same as React's `React.lazy(() => import(...))`.

---

## Programmatic Navigation

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()     // for navigation
const route = useRoute()       // for reading current route

// Navigate to a route
router.push('/about')
router.push({ name: 'user-profile', params: { id: 1 } })
router.push({ path: '/search', query: { q: 'vue' } })

// Replace current history entry (no back button)
router.replace('/login')

// Go back/forward
router.go(-1)    // back
router.go(1)     // forward
router.back()    // shorthand for go(-1)
</script>
```

> **React comparison:**
> - `router.push()` = `navigate('/path')`
> - `router.replace()` = `navigate('/path', { replace: true })`
> - `router.go(-1)` = `navigate(-1)`

---

## Navigation Guards

### Mental Model — Security Checkpoints

Navigation guards are **security checkpoints** at different stages of navigation. Each checkpoint can:
- **Allow** — let navigation proceed
- **Deny** — cancel navigation
- **Redirect** — send to a different route

### Types of Guards

```
Global Guards → Per-Route Guards → Component Guards
(beforeEach)    (beforeEnter)      (onBeforeRouteLeave)
```

### Global Guards

```js
// router/index.js
router.beforeEach((to, from) => {
    // to — route being navigated to
    // from — route being navigated away from

    // Check authentication
    if (to.meta.requiresAuth && !isAuthenticated()) {
        return { name: 'login' }     // redirect to login
    }

    // Allow navigation (return nothing or true)
})

router.afterEach((to, from) => {
    // Runs AFTER navigation — for analytics, page title, etc.
    document.title = to.meta.title || 'My App'
})
```

### Per-Route Guards

```js
const routes = [
    {
        path: '/admin',
        component: Admin,
        beforeEnter: (to, from) => {
            if (!isAdmin()) {
                return { name: 'home' }    // redirect
            }
        },
        meta: { requiresAuth: true, title: 'Admin Panel' }
    }
]
```

### Component Guards

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// Confirm before leaving (unsaved changes)
onBeforeRouteLeave((to, from) => {
    if (hasUnsavedChanges.value) {
        const answer = window.confirm('You have unsaved changes. Leave anyway?')
        if (!answer) return false    // cancel navigation
    }
})

// When route params change but component is reused
// e.g., /user/1 → /user/2 (same component, different param)
onBeforeRouteUpdate((to, from) => {
    userId.value = to.params.id
    fetchUser(to.params.id)
})
</script>
```

### Route Meta

```js
const routes = [
    {
        path: '/admin',
        component: Admin,
        meta: {
            requiresAuth: true,
            roles: ['admin'],
            title: 'Admin Panel'
        }
    }
]

// Access in guard
router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        return '/login'
    }
})
```

> **React comparison:** React Router doesn't have built-in guards. You implement protected routes manually with wrapper components or route loaders. Vue Router's guards are a first-class feature.

---

## History Modes

| Mode | URL Format | Requires Server Config | SEO |
|------|-----------|----------------------|-----|
| `createWebHistory()` | `/about` | Yes — all routes serve index.html | ✅ |
| `createWebHashHistory()` | `/#/about` | No | ❌ |
| `createMemoryHistory()` | No URL change | N/A | N/A (SSR) |

```js
// HTML5 History — clean URLs (recommended)
createRouter({ history: createWebHistory() })

// Hash mode — no server config needed
createRouter({ history: createWebHashHistory() })
```

> **React comparison:** `createWebHistory()` = `<BrowserRouter>`, `createWebHashHistory()` = `<HashRouter>`, `createMemoryHistory()` = `<MemoryRouter>`.

---

## Nested Routes — Deep Dive

### Mental Model

Nested routes create a **component tree** that mirrors the **URL path**:

```
URL:        /dashboard/settings/profile
Components: App → DashboardLayout → Settings → Profile
                   ↑ <router-view>    ↑ <router-view>
```

Each `<router-view>` renders the next level of nesting.

### Multi-Level Nesting

```js
const routes = [
    {
        path: '/dashboard',
        component: DashboardLayout,
        children: [
            {
                path: '',                          // /dashboard
                component: DashboardHome
            },
            {
                path: 'settings',                  // /dashboard/settings
                component: SettingsLayout,
                children: [
                    { path: '',       component: SettingsGeneral },    // /dashboard/settings
                    { path: 'profile', component: SettingsProfile },   // /dashboard/settings/profile
                    { path: 'security', component: SettingsSecurity }  // /dashboard/settings/security
                ]
            }
        ]
    }
]
```

```vue
<!-- DashboardLayout.vue -->
<template>
    <div class="dashboard">
        <DashboardSidebar />
        <main>
            <router-view />   <!-- renders SettingsLayout or DashboardHome -->
        </main>
    </div>
</template>

<!-- SettingsLayout.vue -->
<template>
    <div class="settings">
        <SettingsTabs />
        <router-view />       <!-- renders SettingsGeneral/Profile/Security -->
    </div>
</template>
```

### Named Views — Multiple `<router-view>` in Same Level

```js
const routes = [
    {
        path: '/dashboard',
        components: {                        // Note: componentS (plural)
            default: DashboardMain,
            sidebar: DashboardSidebar,
            header: DashboardHeader
        }
    }
]
```

```vue
<template>
    <router-view name="header" />
    <div class="layout">
        <router-view name="sidebar" />
        <router-view />                      <!-- default -->
    </div>
</template>
```

> **React comparison:** React Router v6 handles nesting similarly with `<Outlet />`. Named views have no direct React equivalent — you'd use multiple route-based components manually.

---

## Role-Based Route Protection

### Pattern — Route Meta + Global Guard

```js
// router/index.js
const routes = [
    {
        path: '/admin',
        component: AdminDashboard,
        meta: {
            requiresAuth: true,
            roles: ['admin']                     // only admin can access
        }
    },
    {
        path: '/editor',
        component: EditorPanel,
        meta: {
            requiresAuth: true,
            roles: ['admin', 'editor']           // admin and editor
        }
    },
    {
        path: '/profile',
        component: UserProfile,
        meta: { requiresAuth: true }             // any authenticated user
    },
    {
        path: '/login',
        component: Login,
        meta: { guestOnly: true }                // only unauthenticated users
    }
]
```

```js
// router/guards.js
import { useAuthStore } from '@/stores/useAuthStore'

export function setupGuards(router) {
    router.beforeEach((to, from) => {
        const authStore = useAuthStore()

        // Redirect authenticated users away from login
        if (to.meta.guestOnly && authStore.isAuthenticated) {
            return { name: 'dashboard' }
        }

        // Check authentication
        if (to.meta.requiresAuth && !authStore.isAuthenticated) {
            return {
                name: 'login',
                query: { redirect: to.fullPath }  // save intended destination
            }
        }

        // Check role authorization
        if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
            return { name: 'unauthorized' }        // 403 page
        }
    })
}
```

```js
// After login — redirect to intended page
async function login(credentials) {
    await authStore.login(credentials)
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
}
```

### Recursive Meta Check for Nested Routes

`to.matched` contains all matched route records (parent + child). Check meta across the chain:

```js
router.beforeEach((to) => {
    // Check ALL matched routes (parent + child)
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiredRoles = to.matched
        .filter(record => record.meta.roles)
        .flatMap(record => record.meta.roles)

    if (requiresAuth && !authStore.isAuthenticated) {
        return '/login'
    }

    if (requiredRoles.length && !requiredRoles.includes(authStore.userRole)) {
        return '/unauthorized'
    }
})
```

> **React comparison:** React Router has no built-in guards. You'd create a `<ProtectedRoute>` wrapper component. Vue's declarative `meta` + global `beforeEach` is cleaner for large apps.

---

## Navigation Guard Pitfalls

### Common Mistakes

**1. Infinite redirect loop**

```js
// ❌ Infinite loop — /login requires auth check → redirects to /login → checks auth...
router.beforeEach((to) => {
    if (!isAuthenticated()) {
        return '/login'              // redirects to /login, which triggers guard again!
    }
})

// ✅ Fixed — exclude login route from auth check
router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        return '/login'
    }
})
```

**2. Forgetting async/await**

```js
// ❌ Guard returns before async check completes
router.beforeEach((to) => {
    fetchUserRole().then(role => {      // guard already returned by now!
        if (role !== 'admin') return '/unauthorized'
    })
    // Returns undefined = allows navigation
})

// ✅ Use async guard
router.beforeEach(async (to) => {
    const role = await fetchUserRole()
    if (to.meta.roles && !to.meta.roles.includes(role)) {
        return '/unauthorized'
    }
})
```

**3. Not handling the "from" route**

```js
// ❌ User navigating from / to /admin gets redirected to /login,
// but after login, they go to / instead of /admin
router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuth()) return '/login'
})

// ✅ Save destination for post-login redirect
router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuth()) {
        return { path: '/login', query: { redirect: to.fullPath } }
    }
})
```

**4. Guard running on every navigation including hash changes**

```js
// ❌ Heavy guard runs on EVERY navigation
router.beforeEach(async (to) => {
    await validateToken()                // API call on every route change!
    await fetchPermissions()
})

// ✅ Cache results, only check when needed
router.beforeEach(async (to) => {
    if (to.meta.requiresAuth && !authStore.isTokenValidated) {
        await authStore.validateToken()  // only when auth is needed
    }
})
```

---

## Handling API Failures Globally

### Pattern — Axios Interceptor + Router + Notification Store

```js
// services/api.js
import axios from 'axios'
import router from '@/router'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useAuthStore } from '@/stores/useAuthStore'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 15000
})

// Response interceptor for global error handling
api.interceptors.response.use(
    response => response,
    async error => {
        const notificationStore = useNotificationStore()

        // 401 — Unauthorized (token expired)
        if (error.response?.status === 401) {
            const authStore = useAuthStore()
            authStore.clearSession()
            router.push({
                path: '/login',
                query: { redirect: router.currentRoute.value.fullPath, expired: 'true' }
            })
            return Promise.reject(error)
        }

        // 403 — Forbidden
        if (error.response?.status === 403) {
            notificationStore.error('You do not have permission for this action')
            return Promise.reject(error)
        }

        // 404 — Not Found
        if (error.response?.status === 404) {
            router.push('/not-found')
            return Promise.reject(error)
        }

        // 422 — Validation Error (return to caller for form handling)
        if (error.response?.status === 422) {
            return Promise.reject(error)    // let the component handle validation errors
        }

        // 500+ — Server Error
        if (error.response?.status >= 500) {
            notificationStore.error('Server error. Please try again later.')
        }

        // Network Error
        if (!error.response) {
            notificationStore.error('Network error. Check your connection.')
        }

        return Promise.reject(error)
    }
)

export default api
```

### Token Refresh Pattern

```js
// Intercept 401 and try to refresh token before failing
let isRefreshing = false
let failedRequests = []

api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401 && !error.config._retry) {
            if (isRefreshing) {
                // Queue request and wait for token refresh
                return new Promise((resolve, reject) => {
                    failedRequests.push({ resolve, reject })
                }).then(token => {
                    error.config.headers.Authorization = `Bearer ${token}`
                    return api(error.config)
                })
            }

            error.config._retry = true
            isRefreshing = true

            try {
                const newToken = await authStore.refreshToken()
                failedRequests.forEach(req => req.resolve(newToken))
                failedRequests = []
                error.config.headers.Authorization = `Bearer ${newToken}`
                return api(error.config)    // retry original request
            } catch {
                failedRequests.forEach(req => req.reject(error))
                failedRequests = []
                authStore.clearSession()
                router.push('/login')
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)
```

> **React comparison:** Same pattern with Axios interceptors. The interceptor itself is framework-agnostic. The difference is how you access the router (Vue: import directly, React: can't use hooks outside components, often use a router ref).

---

## Interview Perspective

**Q: How does Vue Router work internally?**

- Uses History API (`pushState`/`replaceState`) to change URLs without page reload
- Maintains a reactive route object — components that use route data re-render on navigation
- Matches URL against route config, resolves component (supports lazy loading)
- Runs navigation guards pipeline before rendering
- `<router-view>` reactively renders the matched component

Key differences from React Router:
- Built-in navigation guards (before/after hooks) — React requires manual implementation
- Route meta fields for declarative route metadata
- Built-in transition support
- `<router-link>` with active class handling

**Q: Explain nested routes in Vue Router.**

- `children` array in route config creates nested routing
- Each level needs `<router-view>` in parent component to render child
- URL path mirrors component tree: `/dashboard/settings/profile`
- Named views allow multiple `<router-view>` at same level
- `to.matched` array contains all route records in the nesting chain

**Q: How would you implement role-based route protection?**

- Define `meta.roles` on routes requiring specific roles
- Use `router.beforeEach` global guard to check auth + role
- Guard checks `to.matched.some(r => r.meta.requiresAuth)` for nested routes
- Save intended destination in query params for post-login redirect
- Separate concerns: `meta` declares requirements, guard enforces them

**Q: What are navigation guards and common pitfalls?**

- Guards: beforeEach (global), beforeEnter (per-route), onBeforeRouteLeave (component)
- Pitfall 1: Infinite redirect loops (guard redirects to guarded route)
- Pitfall 2: Async operations without await (guard returns before check completes)
- Pitfall 3: Not saving intended destination for post-login redirect
- Pitfall 4: Heavy guards running on every navigation (cache auth checks)

**Q: How would you handle API failures globally?**

- Axios response interceptor catches all errors in one place
- 401 → clear session, redirect to login (with redirect query param)
- 403 → notification "permission denied"
- 500+ → notification "server error"
- Network error → notification "check connection"
- 422 → let component handle (form validation errors)
- Token refresh: queue failed requests, refresh token, retry all queued requests

---

## Key Takeaways

- Vue Router is the official router — maps URLs to components with History API
- `<router-link>` for declarative navigation, `useRouter().push()` for programmatic
- `<router-view>` renders matched components (like React Router's `<Outlet />`)
- Navigation guards provide before/after hooks at global, route, and component levels
- Lazy loading with dynamic `import()` creates per-route code splitting
- `useRoute()` gives reactive access to current route (params, query, hash, meta)
- Route meta fields carry declarative data (auth requirements, page titles)
- Role-based protection: `meta.roles` + `beforeEach` guard — cleaner than wrapper components
- Avoid guard pitfalls: infinite loops, missing await, unsaved redirect destinations
- Global API error handling belongs in Axios interceptors — not in every component

