# Redux & RTK — Deep Dive

## Core Idea in One Sentence

> Redux Toolkit (RTK) is the official, opinionated toolset for efficient Redux development. It eliminates boilerplate, includes Immer for safe mutations, and provides RTK Query for server-state caching — making Redux practical for real-world applications.

---

## Why This Deep Dive?

The [state management notes](4_state-management.md) cover Redux architecture basics (Store, Actions, Reducers, `createSlice`). This file goes deeper into:
- Async operations (`createAsyncThunk`)
- RTK Query (API caching layer)
- Middleware
- Selectors and performance
- Entity Adapter
- Advanced patterns

---

## Async Operations — `createAsyncThunk`

### The Problem

Redux reducers must be **pure functions** — no side effects, no API calls, no async work. But real apps need to fetch data from servers. Where does async logic live?

### The Solution

`createAsyncThunk` creates an action creator that:
1. Dispatches a **pending** action → `{ type: 'users/fetchAll/pending' }`
2. Runs your async function (API call).
3. Dispatches a **fulfilled** action with the data → `{ type: 'users/fetchAll/fulfilled', payload: [...] }`
4. Or a **rejected** action with the error → `{ type: 'users/fetchAll/rejected', error: {...} }`

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 1. Define the thunk
export const fetchUsers = createAsyncThunk(
  'users/fetchAll', // Action type prefix
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json(); // This becomes action.payload
    } catch (err) {
      return rejectWithValue(err.message); // This becomes action.payload in rejected
    }
  }
);

// 2. Handle the three states in the slice
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Synchronous reducers go here
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // from rejectWithValue
      });
  },
});

export default usersSlice.reducer;
```

```jsx
// 3. Dispatch from a component
function UserList() {
  const dispatch = useDispatch();
  const { items: users, status, error } = useSelector(state => state.users);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <Spinner />;
  if (status === 'failed') return <p>Error: {error}</p>;
  return users.map(u => <UserCard key={u.id} user={u} />);
}
```

### Flow Diagram

```
Component dispatches fetchUsers()
          │
          ▼
  ┌──────────────┐
  │    pending    │ → state.status = 'loading' → UI shows spinner
  └──────┬───────┘
         │
    async API call
         │
    ┌────┴─────┐
    │          │
 Success    Failure
    │          │
    ▼          ▼
fulfilled   rejected → state.error = message → UI shows error
    │
    ▼
state.items = data → UI renders user list
```

### Thunk Arguments

```javascript
export const updateUser = createAsyncThunk(
  'users/update',
  async (userData, thunkAPI) => {
    // userData = whatever you passed to dispatch(updateUser(userData))
    // thunkAPI provides:
    //   - thunkAPI.dispatch     → dispatch other actions
    //   - thunkAPI.getState     → read current Redux state
    //   - thunkAPI.rejectWithValue(value) → custom error payload
    //   - thunkAPI.signal       → AbortController signal for cancellation

    const currentUser = thunkAPI.getState().auth.user;
    const response = await fetch(`/api/users/${currentUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
      signal: thunkAPI.signal, // Supports cancellation
    });
    return response.json();
  }
);

// Cancelling a thunk
const promise = dispatch(updateUser(data));
promise.abort(); // Cancels the request
```

---

## RTK Query — API Caching Layer

### Problem It Solves

Even with `createAsyncThunk`, you still manually manage loading/error states, caching, invalidation, and deduplication for every API endpoint. RTK Query eliminates ALL of this.

### Mental Model

RTK Query is to Redux what React Query is to React — a declarative, cache-first data fetching layer. The key difference: RTK Query is **built into Redux**, so your server state lives in the Redux store alongside client state.

### Defining an API

```javascript
// services/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Post'], // For cache invalidation

  endpoints: (builder) => ({
    // GET /api/users
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'], // This data is tagged as 'User'
    }),

    // GET /api/users/:id
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // POST /api/users
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'], // After creation, refetch all 'User' tagged queries
    }),

    // PATCH /api/users/:id
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),

    // DELETE /api/users/:id
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Auto-generated hooks!
export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = apiSlice;
```

### Using in Components

```jsx
function UserList() {
  // Fetches data, caches it, handles loading/error — one line
  const { data: users, isLoading, isError, error } = useGetUsersQuery();

  if (isLoading) return <Spinner />;
  if (isError) return <p>Error: {error.message}</p>;
  return users.map(u => <UserCard key={u.id} user={u} />);
}

function CreateUserButton() {
  const [createUser, { isLoading }] = useCreateUserMutation();

  const handleCreate = async () => {
    try {
      await createUser({ name: 'John', email: 'john@test.com' }).unwrap();
      // After success, RTK Query automatically refetches all queries tagged with 'User'
    } catch (err) {
      console.error('Creation failed:', err);
    }
  };

  return <button onClick={handleCreate} disabled={isLoading}>Create User</button>;
}
```

### Tag-Based Cache Invalidation

```
┌────────────────────┐          ┌────────────────────┐
│  getUsers query     │          │  createUser mutation│
│  providesTags:      │◄─────── │  invalidatesTags:   │
│  ['User']           │  refetch │  ['User']           │
└────────────────────┘          └────────────────────┘

When createUser succeeds → invalidatesTags: ['User']
→ RTK Query finds all queries that providesTags: ['User']
→ Automatically refetches them
→ UI updates with fresh data
```

### Store Setup with RTK Query

```javascript
// store.js
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './services/api';
import counterReducer from './features/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,         // Client state
    [apiSlice.reducerPath]: apiSlice.reducer, // Server state (RTK Query)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware), // Required for caching, polling, etc.
});
```

---

## React Query vs RTK Query

| Feature | React Query | RTK Query |
|---------|------------|-----------|
| **Standalone** | ✅ No Redux needed | ❌ Requires Redux store |
| **Bundle Size** | ~13KB (standalone) | Included with RTK (~11KB additional) |
| **State Location** | Own internal cache | Redux store (visible in DevTools) |
| **DevTools** | React Query DevTools | Redux DevTools (time-travel) |
| **Best When** | Not using Redux | Already using Redux for client state |
| **Code Generation** | Manual hooks | Auto-generated hooks from endpoint definitions |
| **Cache Invalidation** | Manual `invalidateQueries` | Tag-based (automatic) |

> **Decision Rule:** If your app already uses Redux for client state, use RTK Query for server state — everything lives in one store with one set of DevTools. If you don't need Redux, use React Query (lighter, standalone).

---

## Selectors & Performance

### The Problem

`useSelector` runs on every Redux state change. If your selector creates new objects or arrays, the component re-renders even when the underlying data hasn't changed.

### `createSelector` (Memoized Selectors)

```javascript
import { createSelector } from '@reduxjs/toolkit';

// Input selectors — simple, return raw slices
const selectUsers = (state) => state.users.items;
const selectFilter = (state) => state.users.filter;

// Memoized selector — only recalculates when inputs change
export const selectFilteredUsers = createSelector(
  [selectUsers, selectFilter],
  (users, filter) => {
    // This filtering only runs when users or filter actually change
    return users.filter(user => user.role === filter);
  }
);

// Usage — component only re-renders when the filtered result changes
function FilteredUserList() {
  const filteredUsers = useSelector(selectFilteredUsers);
  return filteredUsers.map(u => <UserCard key={u.id} user={u} />);
}
```

### Why Memoized Selectors Matter

```javascript
// ❌ BAD — creates a new array on EVERY state change, causing re-render
const admins = useSelector(state => state.users.items.filter(u => u.role === 'admin'));

// ✅ GOOD — returns cached result if inputs haven't changed
const admins = useSelector(selectAdmins); // using createSelector
```

---

## Entity Adapter

### Problem It Solves

Managing normalized collections (arrays of objects with IDs) involves repetitive CRUD boilerplate — finding items by ID, adding, updating, removing, sorting.

```javascript
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const usersAdapter = createEntityAdapter({
  // Customize the unique ID field (default: 'id')
  selectId: (user) => user.id,
  // Sort by name
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState({
    // Additional state beyond the entity data
    status: 'idle',
  }),
  // initialState looks like: { ids: [], entities: {}, status: 'idle' }

  reducers: {
    userAdded: usersAdapter.addOne,      // Add single entity
    usersReceived: usersAdapter.setAll,  // Replace all entities
    userUpdated: usersAdapter.updateOne, // Update one entity
    userRemoved: usersAdapter.removeOne, // Remove one entity
  },
});

// Auto-generated selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors(state => state.users);
```

> **Why Normalized State?** Instead of `[{id:1, name:'John'}, {id:2, name:'Jane'}]`, entities are stored as `{ ids: [1,2], entities: { 1: {id:1, name:'John'}, 2: {id:2, name:'Jane'} } }`. This makes lookups O(1) instead of O(n) and prevents duplicates.

---

## Redux Middleware

### What Middleware Does

Middleware intercepts every dispatched action **before it reaches the reducer**. Think of it as airport security between the dispatch gate and the destination (reducer).

```
dispatch(action) → middleware 1 → middleware 2 → middleware 3 → reducer → store
```

### Custom Middleware

```javascript
// Logger middleware
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action.type);
  const result = next(action); // Pass to next middleware (or reducer)
  console.log('Next state:', store.getState());
  return result;
};

// Add to store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
});
```

### Built-in Middleware (from `configureStore`)

| Middleware | Purpose |
|-----------|---------|
| `redux-thunk` | Allows dispatching functions (async operations) |
| `serializableCheck` | Warns if non-serializable values (Dates, functions) are in state |
| `immutableCheck` | Detects accidental state mutations |

> **Note:** `configureStore` includes `thunk`, `serializableCheck`, and `immutableCheck` by default. You don't need to add them.

---

## Redux vs Zustand vs Context

| Feature | Redux (RTK) | Zustand | Context API |
|---------|------------|---------|-------------|
| **Boilerplate** | Medium (reduced by RTK) | Minimal | Minimal |
| **Bundle Size** | ~11KB | ~1KB | Built-in (0KB) |
| **DevTools** | Excellent (time-travel) | Good | Basic |
| **Performance** | Excellent (selectors) | Excellent | Poor (all consumers re-render) |
| **Learning Curve** | Steep | Easy | Easy |
| **Best For** | Large apps, complex state, team standards | Small-medium apps | Static/low-frequency data |
| **Server State** | RTK Query built-in | Need React Query/SWR | Manual |

---

## Interview Perspective

**Q: How does `createAsyncThunk` work in Redux Toolkit?**

It's a function that creates an action creator for async operations. You define the async logic (API calls). It automatically dispatches three action types: `pending` (before the call), `fulfilled` (on success with data as payload), and `rejected` (on failure with error). You handle these in `extraReducers` using `builder.addCase()` to update loading states, data, and errors.

**Q: What is RTK Query and how does it differ from React Query?**

RTK Query is Redux Toolkit's built-in data fetching and caching solution. You define API endpoints (queries for reads, mutations for writes) in one place, and it auto-generates React hooks. The key difference: RTK Query stores everything in the Redux store (visible in Redux DevTools), while React Query has its own internal cache. Use RTK Query when you're already using Redux; use React Query as a standalone solution.

**Q: How does tag-based cache invalidation work in RTK Query?**

Queries declare what data they provide via `providesTags` (e.g., `['User']`). Mutations declare what data they invalidate via `invalidatesTags` (e.g., `['User']`). When a mutation with `invalidatesTags: ['User']` succeeds, RTK Query automatically refetches all mounted queries with `providesTags: ['User']`.

**Q: What are memoized selectors and why are they important?**

Created with `createSelector`, they cache their output based on input values. If the inputs haven't changed, the cached result is returned without recalculation. This prevents unnecessary re-renders because `useSelector` won't see a new reference. Without memoization, `.filter()` or `.map()` in selectors creates new arrays on every state change, causing all consuming components to re-render.

**Q: What is the Entity Adapter in Redux Toolkit?**

A utility that generates a set of reducer functions and selectors for managing normalized state (data stored as `{ ids: [], entities: {} }`). It provides built-in CRUD operations (addOne, updateOne, removeOne, setAll) and pre-built selectors (selectAll, selectById). Normalized state enables O(1) lookups by ID.

**Q: Explain Redux middleware. How does it work?**

Middleware is a chain of functions that intercept dispatched actions before they reach the reducer. Each middleware receives `store`, `next` (the next middleware), and `action`. It can log actions, modify them, delay them, or dispatch additional actions. RTK includes `redux-thunk` (for async), `serializableCheck`, and `immutableCheck` by default.

---

## Key Takeaways

- **`createAsyncThunk`** handles async operations with automatic pending/fulfilled/rejected actions.
- **RTK Query** eliminates manual data fetching boilerplate — define endpoints, get auto-generated hooks.
- **Tag-based invalidation** automatically refetches related queries when mutations succeed.
- **Memoized selectors** (`createSelector`) prevent unnecessary re-renders from derived state.
- **Entity Adapter** normalizes collections for O(1) lookups and provides CRUD reducer helpers.
- **Middleware** intercepts actions before they reach reducers — used for logging, async, analytics.
- **Use RTK Query if already on Redux.** Use React Query if not.
