# TypeScript with Vue (Composition API)

## Core Idea

> Vue 3 was rewritten from the ground up in TypeScript. Using `<script setup lang="ts">` gives you world-class type inference out of the box. It replaces Vue's old runtime prop validation with zero-cost, compile-time TypeScript interfaces.

---

## 1. Enabling TypeScript in Vue

To use TypeScript in a Single File Component (SFC), simply add the `lang="ts"` attribute to your script tag.

```vue
<script setup lang="ts">
// You can now write raw TypeScript here!
</script>
```

---

## 2. Typing Props (`defineProps`)

### The Old Way (Runtime Validation)
Before TypeScript, Vue developers relied on runtime validation objects to ensure parents passed the correct data. This added weight to the bundle and only caught errors when the app was actually running in the browser.

### The TypeScript Way (Compile-Time)
You pass a TypeScript interface (or type alias) directly as a generic to `defineProps`. 

```vue
<script setup lang="ts">
// Define the strict shape of the props
interface UserCardProps {
  name: string;
  age: number;
  isOnline?: boolean; // Optional prop
}

// Pass the interface as a generic <T>
const props = defineProps<UserCardProps>();
</script>

<template>
  <div>{{ props.name }} is {{ props.age }} years old.</div>
</template>
```

### Handling Default Values (`withDefaults`)
Because TypeScript interfaces only exist at compile time, you cannot specify default runtime values inside the interface itself. Vue provides a compiler macro called `withDefaults` to bridge this gap.

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

// Set default values for optional props safely
const props = withDefaults(defineProps<Props>(), {
  count: 0 // If 'count' is omitted by the parent, it becomes 0
});
</script>
```

---

## 3. Typing Emits (`defineEmits`)

### Problem It Solves
When a child component fires an event to a parent (`emit('update')`), the parent needs to know exactly what payload data to expect.

### The Syntax
You pass an interface where the **keys** are the event names, and the **values** are tuple types representing the arguments the emit function will send.

```vue
<script setup lang="ts">
// This component emits two specific events:
// 1. 'change' -> sends a number
// 2. 'update:name' -> sends a string
const emit = defineEmits<{
  (e: 'change', id: number): void;
  (e: 'update:name', newName: string): void;
}>();

function triggerUpdate() {
  emit('change', 42); // TS enforces that the second arg MUST be a number
}
</script>
```

---

## 4. Typing Reactivity (`ref` and `reactive`)

Most of the time, Vue's type inference is incredibly smart and you don't need to do anything.

```ts
const count = ref(0); // TS automatically infers Ref<number>
const name = ref('Alice'); // TS automatically infers Ref<string>
```

### When Inference Fails (`null` or empty arrays)
Just like in React, if you initialize state with `null` or an empty array `[]`, TypeScript doesn't know what the variable is *supposed* to hold in the future. You must provide a generic.

```ts
interface User { id: string; name: string; }

// TS needs help: It's currently null, but later it will be a User.
const currentUser = ref<User | null>(null);

// TS needs help: It's an array, but an array of what?
const userList = ref<User[]>([]);
```

### Typing `reactive`
Similarly, inference works for simple objects, but you can explicitly type complex objects.

```ts
const config = reactive<Config>({
  theme: 'dark',
  retries: 3
});
```

---

## 5. Typing Template Refs (DOM Elements)

When you need to grab a raw DOM element using `ref="myInput"`, you type it exactly like you would in React: provide the specific HTML element interface and initialize with `null`.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 1. Type it specifically as an HTMLInputElement, starting as null
const myInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // 2. Optional chaining is required because it is null before the component mounts!
  myInput.value?.focus()
})
</script>

<template>
  <input ref="myInput" />
</template>
```

---

## 6. Typing Provide / Inject

### Problem It Solves
When you `provide` data high up in the component tree, and `inject` it deeply, TypeScript loses the connection. The injected component has no idea what type the data is.

### The Solution: `InjectionKey`
Vue provides a special utility type called `InjectionKey<T>`. It acts as a bridge.

```ts
// --- keys.ts (Shared File) ---
import type { InjectionKey, Ref } from 'vue'

// We create a strictly typed "key"
export const themeKey = Symbol() as InjectionKey<Ref<string>>;

// --- Parent.vue ---
import { provide, ref } from 'vue'
import { themeKey } from './keys'

const theme = ref('dark')
provide(themeKey, theme) // TS ensures 'theme' is a Ref<string>

// --- DeepChild.vue ---
import { inject } from 'vue'
import { themeKey } from './keys'

// TS automatically knows `theme` is Ref<string> | undefined
const theme = inject(themeKey) 
```

---

## Interview Perspective

**Q: How do you type Props in Vue 3 `<script setup>`?**
By defining a TypeScript interface and passing it as a generic argument to `defineProps<MyPropsInterface>()`. This provides zero-cost compile-time validation instead of relying on runtime validation objects.

**Q: How do you provide default values for TypeScript-based props?**
Since interfaces don't exist at runtime to hold default values, you must wrap `defineProps` inside the `withDefaults` compiler macro, passing an object containing the default values as the second argument.

**Q: When should you explicitly pass a generic to `ref()`?**
When type inference is insufficient, which most commonly happens when initializing state with `null` (e.g., `ref<User | null>(null)`) or an empty array (e.g., `ref<Product[]>([])`).

**Q: How do you type a Template Ref referencing a DOM element?**
You create a `ref` explicitly typed to the target HTML element unioned with `null` (e.g., `ref<HTMLInputElement | null>(null)`). You must use optional chaining (`.value?.`) when accessing it, because the ref is null before the component actually mounts the DOM.

**Q: How do you maintain type safety between `provide` and `inject`?**
By using Vue's `InjectionKey<T>`. You export a typed Symbol from a shared file and use it as the key in both `provide` and `inject`. This ensures the injected value retains the exact type provided by the parent.

---

## Key Takeaways

- Add `lang="ts"` to `<script setup>` to enable TypeScript.
- Use generics `defineProps<T>()` and `defineEmits<T>()` instead of runtime configuration objects.
- Rely on Type Inference for simple `ref` and `reactive` state, but explicitly type them when starting with empty arrays or `null`.
- Use `InjectionKey<T>` to maintain strict typing across deep component tree communication.
