# React Query (TanStack Query)

## Core Idea in One Sentence

> React Query is a server-state management library that handles fetching, caching, synchronizing, and updating data from external sources — replacing the clunky `useEffect` + `useState` pattern for data fetching with a declarative, cache-first approach.

---

## The Problem: Data Fetching with `useEffect`

### The Naive Approach

Every React developer starts here — fetching data inside `useEffect`:

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; }; // cleanup for race conditions
  }, [userId]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <div>{user.name}</div>;
}
```

### What's Wrong With This?

| Problem | Description |
|---------|-------------|
| **Boilerplate** | 3 state variables (`data`, `loading`, `error`) + `useEffect` + cleanup for EVERY fetch |
| **No caching** | Navigating away and back refetches the same data. Wasted network calls. |
| **No deduplication** | 5 components fetching `/api/user` → 5 identical network requests |
| **No background updates** | Data goes stale. User sees outdated info until they refresh. |
| **Race conditions** | Fast param changes cause out-of-order responses without manual cleanup |
| **No retry logic** | One failure = permanent error state |
| **No pagination/infinite scroll** | You have to build it from scratch |

> **Key Insight:** `useEffect` was designed for synchronizing with external systems, not for data fetching. Data fetching is a solved problem — React Query solves it.

---

## Server State vs Client State

This distinction is **critical** and often missed:

| Aspect | Client State | Server State |
|--------|-------------|-------------|
| **Owned by** | The browser / your app | A remote server / database |
| **Examples** | Theme, sidebar open/closed, form input | User profile, product list, notifications |
| **Persistence** | Gone on refresh | Persists on the server |
| **Shared** | Only this user's browser | Shared among all users |
| **Can go stale** | No (you control it) | **Yes** (another user may change it) |
| **Best managed by** | `useState`, Redux, Zustand | **React Query**, SWR |

> **Mental Model:** Client state is like the position of your desk lamp — only you control it. Server state is like the office whiteboard — anyone can change it, and your view of it might be outdated.

React Query manages **server state**. Don't put server data into Redux — you'll end up re-inventing caching, invalidation, and background refetching yourself.

---

## Setup

```bash
npm install @tanstack/react-query
```

```jsx
// main.jsx / App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // Data is fresh for 60 seconds
      gcTime: 5 * 60 * 1000,      // Unused cache is garbage collected after 5 minutes
      retry: 3,                    // Retry failed requests 3 times
      refetchOnWindowFocus: true,  // Refetch when user tabs back
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} /> {/* Dev tools panel */}
    </QueryClientProvider>
  );
}
```

---

## `useQuery` — Fetching Data

### The Same Component, Rewritten

```jsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', userId],                         // Unique cache key
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()), // Fetcher
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage error={error} />;
  return <div>{user.name}</div>;
}
```

**What you get for free:** Caching, deduplication, automatic retries (3x), background refetching on window focus, race condition handling, garbage collection of stale cache, loading/error states.

### How It Works Internally

```
Component mounts
      │
      ▼
Check cache for queryKey ['user', 42]
      │
      ├─── Cache HIT (and fresh) ──► Return cached data instantly (no fetch)
      │
      ├─── Cache HIT (but stale) ──► Return cached data instantly
      │                               AND trigger background refetch
      │                               When new data arrives → re-render
      │
      └─── Cache MISS ──► Show loading state → fetch → cache result → render
```

> **Mental Model:** React Query is like a **smart assistant** who remembers answers to your questions. Ask the same question again? Instant answer from memory. The assistant also periodically double-checks their answers in the background to make sure they're still correct.

### Query Keys — The Cache Identity

Query keys are the unique identifier for cached data. React Query uses them to:
1. **Cache** — store fetched data.
2. **Deduplicate** — if two components use the same key, only one request fires.
3. **Invalidate** — selectively refresh specific data.

```jsx
// Simple key
useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// Key with parameters — different userId = different cache entry
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });

// Key with filters — different filter = different cache entry
useQuery({ queryKey: ['users', { role: 'admin', page: 2 }], queryFn: fetchFilteredUsers });
```

> **Key Rule:** If any part of the `queryKey` changes, React Query treats it as a different query and fetches fresh data.

---

## `useMutation` — Modifying Data

### Core Concept

Queries are for **reading**. Mutations are for **creating, updating, or deleting** data on the server.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser) => {
      return fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).then(r => r.json());
    },

    // After successful creation, invalidate the users list cache
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // This triggers a refetch of any component using ['users'] query key
    },

    onError: (error) => {
      console.error('Failed to create user:', error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ name: 'John', email: 'john@example.com' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      {mutation.isError && <p>Error: {mutation.error.message}</p>}
      {mutation.isSuccess && <p>User created!</p>}
    </form>
  );
}
```

### The Invalidation Pattern

```
User clicks "Create" 
      │
      ▼
mutationFn fires POST /api/users
      │
      ▼
Server creates user → returns success
      │
      ▼
onSuccess → invalidateQueries(['users'])
      │
      ▼
React Query marks ['users'] cache as stale
      │
      ▼
Any mounted component using ['users'] automatically refetches
      │
      ▼
UI updates with the new user list (no manual state management!)
```

---

## Caching & Staleness

### The Two Timers

| Timer | Config Key | Default | What It Controls |
|-------|-----------|---------|-----------------|
| **Stale Time** | `staleTime` | `0` (instantly stale) | How long data is considered "fresh". While fresh, no refetch occurs. |
| **GC Time** | `gcTime` | `5 min` | How long **unused** (unmounted) cache stays in memory before garbage collection. |

### Cache Lifecycle

```
Query mounted → Fetch → Data cached (fresh)
                              │
                              ▼ (staleTime elapses)
                        Data marked STALE
                              │
                              ├── Component still mounted → Background refetch on triggers
                              │   (window focus, network reconnect, interval)
                              │
                              └── Component unmounts → Cache entry becomes INACTIVE
                                          │
                                          ▼ (gcTime elapses)
                                    Cache entry GARBAGE COLLECTED (removed from memory)
```

### Configuring Staleness

```jsx
// Data stays fresh for 5 minutes — no refetching during this window
useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Data that rarely changes — cache for 1 hour
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: 60 * 60 * 1000, // 1 hour
});

// Real-time data — always refetch
useQuery({
  queryKey: ['stock-price', symbol],
  queryFn: () => fetchStockPrice(symbol),
  staleTime: 0,              // Always stale
  refetchInterval: 5000,     // Poll every 5 seconds
});
```

> **Common Mistake:** Leaving `staleTime` at `0` (default). This means data is instantly stale, so React Query refetches on every window focus, remount, or reconnect. For most data, set `staleTime` to at least 30-60 seconds.

---

## Optimistic Updates

### Problem It Solves

When a user clicks "Like" on a post, they don't want to wait 500ms for the server round-trip. Optimistic updates make the UI respond **instantly** by assuming the server will succeed, and rolling back if it doesn't.

```jsx
const likeMutation = useMutation({
  mutationFn: (postId) => fetch(`/api/posts/${postId}/like`, { method: 'POST' }),

  onMutate: async (postId) => {
    // 1. Cancel any outgoing refetches (so they don't overwrite optimistic update)
    await queryClient.cancelQueries({ queryKey: ['posts'] });

    // 2. Snapshot the previous value (for rollback)
    const previousPosts = queryClient.getQueryData(['posts']);

    // 3. Optimistically update the cache
    queryClient.setQueryData(['posts'], (old) =>
      old.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );

    // 4. Return the snapshot for rollback
    return { previousPosts };
  },

  onError: (err, postId, context) => {
    // 5. Roll back to the snapshot on error
    queryClient.setQueryData(['posts'], context.previousPosts);
  },

  onSettled: () => {
    // 6. Always refetch to ensure server and cache are in sync
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

### Flow

```
User clicks "Like"
      │
      ▼ (onMutate — BEFORE server call)
Snapshot old data → Update cache instantly → UI shows +1 like
      │
      ▼ (mutationFn — server call)
      ├── Success → onSettled → refetch for server truth
      └── Failure → onError → rollback to snapshot → UI reverts
```

---

## Pagination & Infinite Scroll

### Paginated Queries

```jsx
function UserList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),
    placeholderData: keepPreviousData, // Keep showing old page while new page loads
  });

  return (
    <div>
      {data?.users.map(user => <UserCard key={user.id} user={user} />)}

      <button
        onClick={() => setPage(p => p - 1)}
        disabled={page === 1}
      >
        Previous
      </button>

      <button
        onClick={() => setPage(p => p + 1)}
        disabled={!data?.hasMore}
        style={{ opacity: isPlaceholderData ? 0.5 : 1 }}
      >
        Next
      </button>
    </div>
  );
}
```

### Infinite Scroll with `useInfiniteQuery`

```jsx
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users'],
    queryFn: ({ pageParam }) => fetchUsers(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Return the next page number, or undefined if no more pages
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
  });

  return (
    <div>
      {data?.pages.map(page =>
        page.users.map(user => <UserCard key={user.id} user={user} />)
      )}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'No more users'}
      </button>
    </div>
  );
}
```

---

## Dependent Queries

When one query depends on the result of another:

```jsx
function UserPosts({ userId }) {
  // First query — fetch user
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Second query — only runs when user is available
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPostsByUser(user.id),
    enabled: !!user, // ← Only run when user exists
  });

  return <PostList posts={posts} />;
}
```

> The `enabled` option is the key. When `false`, the query won't execute. It won't even show as loading — it stays in an `idle` state until enabled.

---

## Parallel Queries

Fetch multiple independent resources simultaneously:

```jsx
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  const results = useQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['posts'], queryFn: fetchPosts },
      { queryKey: ['stats'], queryFn: fetchStats },
    ],
  });

  const isLoading = results.some(r => r.isLoading);
  const [users, posts, stats] = results.map(r => r.data);

  if (isLoading) return <Spinner />;
  return <DashboardLayout users={users} posts={posts} stats={stats} />;
}
```

---

## Common Patterns

### Custom Query Hook (Recommended Pattern)

```jsx
// hooks/useUser.js
export function useUser(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

// hooks/useUpdateUser.js
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }) =>
      fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),

    onSuccess: (data, { userId }) => {
      // Update specific user cache
      queryClient.setQueryData(['user', userId], data);
      // Invalidate the users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Usage in component — clean and reusable
function UserProfile({ userId }) {
  const { data: user, isLoading } = useUser(userId);
  const updateUser = useUpdateUser();

  // ...
}
```

### Prefetching

```jsx
// Prefetch data BEFORE the user navigates
function UserListItem({ user }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // When user hovers over a list item, prefetch their profile
    queryClient.prefetchQuery({
      queryKey: ['user', user.id],
      queryFn: () => fetchUser(user.id),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <Link to={`/users/${user.id}`} onMouseEnter={handleMouseEnter}>
      {user.name}
    </Link>
  );
}
```

---

## React Query vs Alternatives

| Feature | React Query | SWR | Redux + RTK Query |
|---------|------------|-----|-------------------|
| **Focus** | Server state | Server state | Client + Server state |
| **Caching** | Excellent (staleTime + gcTime) | Good | Good |
| **DevTools** | Excellent | Basic | Excellent (Redux DevTools) |
| **Mutations** | First-class (`useMutation`) | Manual | First-class |
| **Infinite Scroll** | Built-in (`useInfiniteQuery`) | Manual | Built-in |
| **Optimistic Updates** | Built-in pattern | Manual | Built-in |
| **Bundle Size** | ~13KB gzipped | ~4KB gzipped | ~20KB+ gzipped |
| **Learning Curve** | Medium | Low | High |
| **Best When** | Standalone data fetching | Simple fetching | Already using Redux |

---

## Interview Perspective

**Q: What is React Query and what problem does it solve?**

React Query is a server-state management library. It replaces the `useEffect` + `useState` pattern for data fetching by providing built-in caching, automatic background refetching, request deduplication, retry logic, pagination, and optimistic updates. It separates server state (remote, async, shared, can go stale) from client state (local, synchronous, owned by the browser).

**Q: What is the difference between `staleTime` and `gcTime`?**

`staleTime` controls how long fetched data is considered "fresh" — while fresh, no refetch occurs even on mount or window focus. `gcTime` (previously `cacheTime`) controls how long **unused** cache (no mounted component using that query key) stays in memory before being garbage collected. Default: `staleTime = 0` (instantly stale), `gcTime = 5 minutes`.

**Q: How do query keys work in React Query?**

Query keys are arrays that uniquely identify a cache entry. If any element changes, React Query treats it as a new query. They enable automatic deduplication (same key = same request), targeted invalidation (`invalidateQueries({ queryKey: ['users'] })`), and hierarchical matching (invalidating `['users']` also invalidates `['users', 42]`).

**Q: How would you handle cache invalidation after a mutation?**

Call `queryClient.invalidateQueries({ queryKey: ['resource'] })` in the `onSuccess` callback of `useMutation`. This marks matching cache entries as stale and triggers a refetch for any mounted component using those keys. For instant UI updates, combine with optimistic updates using `onMutate` to update the cache before the server responds.

**Q: What are optimistic updates and how do you implement them?**

Optimistic updates immediately update the UI before the server confirms the change, then roll back if the server fails. In `onMutate`: cancel outgoing queries, snapshot current data, update cache optimistically, return snapshot. In `onError`: restore snapshot. In `onSettled`: invalidate queries to sync with server truth. This makes the UI feel instant.

**Q: Why shouldn't you use Redux for server state?**

Redux is designed for synchronous client state. Managing server state in Redux means manually implementing caching, background refetching, stale data handling, retry logic, request deduplication, and garbage collection — all of which React Query provides out of the box. Mixing server and client state in Redux leads to complex, duplicated logic.

**Q: How does React Query prevent race conditions?**

React Query automatically cancels or ignores stale responses. If a query key changes rapidly (e.g., userId changes from 1 to 2 to 3), only the response matching the current key is used. Previous in-flight requests are either cancelled (via AbortController) or their results are discarded when they resolve.

---

## Key Takeaways

- **Server state ≠ Client state.** React Query for server data, `useState`/Redux for UI state.
- **`useQuery` = read, `useMutation` = write.** Invalidate queries after mutations.
- **Query keys are the cache identity.** Different key = different cache entry.
- **Set `staleTime` intentionally.** Default `0` means constant refetching. Most data can be fresh for 30-60 seconds.
- **Wrap queries in custom hooks** (`useUser`, `usePosts`) for reusability and consistency.
- **Optimistic updates** make the UI feel instant — snapshot, update, rollback on error.
- **React Query replaces `useEffect` for data fetching** — less boilerplate, more features, fewer bugs.
- **Use `enabled` for dependent queries.** Use `useQueries` for parallel independent queries.
