# Routing & Navigation

## Core Idea

> Routing is how a web application maps a specific URL (like `/about`) to a specific screen (Component). In React, this is usually handled completely on the client side without requesting a new HTML page from the server.

## The Problem: Traditional vs Client-Side Routing

### Traditional Server-Side Routing (The Old Way)
Historically, when a user clicked a link (e.g., `<a href="/about">`), the browser made a full network request to the server. The server assembled a brand new HTML page, sent it back, and the browser completely refreshed the screen.
**Limitations:** Slow, jarring page reloads, and state (like an open dropdown or a playing video) was lost on every navigation.

### Client-Side Routing (The React Way)
React handles routing internally using the browser's History API. When a user clicks a link, React intercepts the click, prevents the browser from talking to the server, and simply swaps out the current components for new ones based on the URL.
**Advantages:** Lightning fast, seamless transitions, and application state is preserved.

---

## React Router DOM

React doesn't come with a router built-in. The industry standard library is `react-router-dom`.

### Mental Model

Think of React Router as a **Switchboard Operator**.
- The user dials an extension (`/contact`).
- The operator looks at their directory (`<Routes>`).
- They find the exact match and plug the user into the right department (Component).
- If they dial a wrong number, the operator routes them to the fallback line (404 Error Component).

### Step-by-Step Breakdown

1. **The Provider (`<BrowserRouter>`):** Wraps your entire app, giving it the ability to read the browser's URL history.
2. **The Directory (`<Routes>`):** A container that holds all your route definitions. It looks through its children to find the best match.
3. **The Mappings (`<Route>`):** Connects a specific path to a specific React element.
4. **The Navigation (`<Link>`):** The replacement for traditional `<a>` tags. It updates the URL without causing a page refresh.

```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      {/* Navigation */}
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      {/* The Switchboard */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} /> {/* Fallback 404 */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Nested Routing & `<Outlet />`

### Problem It Solves

Often, you want parts of a UI to remain persistent (like a sidebar) while the main content area changes based on deeper URLs (e.g., `/dashboard/settings` vs `/dashboard/profile`).

### How It Works

You nest `<Route>` components inside one another. The parent component uses an `<Outlet />` to dictate *where* the child component should be injected.

```jsx
// 1. Define nested routes
<Routes>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route path="profile" element={<Profile />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>

// 2. The Parent Component uses <Outlet />
function DashboardLayout() {
  return (
    <div className="layout">
      <Sidebar /> {/* This stays persistent */}
      <main>
        <Outlet /> {/* Child components (Profile/Settings) render here */}
      </main>
    </div>
  );
}
```

> **Mental Model:** `<Outlet />` is a **Placeholder Slot**. It tells React Router, "If there is a child route matching the current URL, plug its component in right here."

---

## Absolute vs Relative Paths

| Aspect | Absolute Path | Relative Path (Recommended) |
|--------|---------------|-----------------------------|
| Syntax | Starts with `/` (e.g., `/users/profile`) | No leading slash (e.g., `profile`) |
| Behavior | Resolves from the root domain (`myapp.com/users/profile`) | Resolves from the current route |
| Maintainability | Poor. If the parent URL changes, all children break. | High. Moving parent routes doesn't break children. |

---

## Protected Routes (Authentication)

### Problem It Solves

You need to prevent unauthenticated users from accessing certain URLs (like `/admin`).

### The Pattern

Create a wrapper component that checks the authentication state. If authenticated, it renders the `<Outlet />` (allowing access to the children). If not, it uses `<Navigate />` to redirect them.

```jsx
function ProtectedRoute({ isAuth }) {
  // If not auth, immediately redirect to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  // If auth, render the protected child components
  return <Outlet />;
}

// Usage in Router
<Routes>
  <Route path="/login" element={<Login />} />
  
  {/* Wrap protected routes in the checker */}
  <Route element={<ProtectedRoute isAuth={userLoggedIn} />}>
    <Route path="/admin" element={<AdminPanel />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

> **Note:** `<Navigate />` is the declarative component version. If you need to redirect programmatically (e.g., inside a button click handler after a successful fetch), use the `useNavigate()` hook instead.

---

## Interview Perspective

**Q: Why use `<Link>` instead of a standard `<a href>` tag in React?**
A standard `<a>` tag causes the browser to make a full HTTP request and reload the page, destroying the React application's state. `<Link>` intercepts the click, updates the URL using the browser's History API, and allows React Router to swap out the components instantly without a refresh.

**Q: What is the purpose of `<Outlet />`?**
It acts as a placeholder in a parent route layout. When a nested child route is matched, the child component is rendered exactly where the `<Outlet />` is placed in the parent.

**Q: Explain the difference between `MemoryRouter`, `HashRouter`, and `BrowserRouter`.**
- `BrowserRouter`: Standard URL format (`/about`). Requires server configuration to handle direct hits to deep URLs (so the server doesn't return a 404).
- `HashRouter`: Uses the hash portion of the URL (`/#/about`). Doesn't require server config, but is terrible for SEO.
- `MemoryRouter`: Keeps URL history in memory, doesn't change the browser URL bar. Useful for testing or non-browser environments like React Native.

---

## Key Takeaways

- **Client-Side Routing** prevents page reloads and preserves application state.
- **`<BrowserRouter>`** gives your app access to the URL history.
- **`<Routes>`** look for the first `<Route>` that matches the URL.
- **`<Outlet />`** is essential for nested layouts, acting as a socket for child routes.
- **Protected Routes** are built by creating wrapper components that conditionally return an `<Outlet />` or a `<Navigate />` redirect.
