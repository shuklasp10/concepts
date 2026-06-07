# Collections Framework

> The Collections Framework is Java's unified architecture for storing, manipulating, and iterating over groups of objects. Understanding the internal data structures behind each collection — not just their APIs — is what separates a senior developer from a junior one.

---

## The Collections Hierarchy

```
                        Iterable<E>
                            │
                       Collection<E>
                     ┌──────┼──────────────┐
                     │      │              │
                  List<E>  Set<E>       Queue<E>
                  │        │              │
          ┌───────┤    ┌───┤          ┌───┤
          │       │    │   │          │   │
     ArrayList  LinkedList HashSet TreeSet PriorityQueue
                  │        │              │
              (also       LinkedHashSet  ArrayDeque
              implements                 (also Deque)
              Deque)

                        Map<K,V>  (NOT part of Collection — separate hierarchy)
                     ┌──────┼──────────┐
                     │      │          │
                 HashMap  TreeMap  LinkedHashMap
                     │
              ConcurrentHashMap
```

> **Key Insight:** `Map` does NOT extend `Collection`. A Map stores key-value pairs, not individual elements. However, you can get collection views: `map.keySet()`, `map.values()`, `map.entrySet()`.

---

## List Implementations — Internal Deep Dive

### ArrayList

> A dynamically resizing array. The most commonly used `List` implementation.

#### Internal Structure

```
ArrayList<String> list = new ArrayList<>();
// Internally: Object[] elementData = new Object[10];  (default capacity)

list.add("A");  list.add("B");  list.add("C");

Internal array:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  A  │  B  │  C  │null │null │null │null │null │null │null │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  [0]   [1]   [2]   [3]   [4]   [5]   [6]   [7]   [8]   [9]
                     ↑
                  size = 3, capacity = 10
```

#### How Dynamic Resizing Works

When the array is full and you add another element:

1. Create a new array with **1.5x capacity** (`newCapacity = oldCapacity + (oldCapacity >> 1)`)
2. Copy all elements to the new array (`System.arraycopy()`)
3. Point the internal reference to the new array
4. Add the new element

> **Performance Impact:** Resizing is O(n) — copying all elements. This is amortized O(1) because resizing happens infrequently. But if you know the size upfront, use `new ArrayList<>(expectedSize)` to avoid unnecessary resizing.

#### Time Complexity

| Operation | Time | Why |
|-----------|------|-----|
| `get(index)` | **O(1)** | Direct array index access |
| `add(element)` | **O(1)** amortized | Append at end; O(n) if resize needed |
| `add(index, element)` | **O(n)** | Must shift all subsequent elements right |
| `remove(index)` | **O(n)** | Must shift all subsequent elements left |
| `contains(element)` | **O(n)** | Linear scan |
| `set(index, element)` | **O(1)** | Direct array index replacement |

### LinkedList

> A doubly-linked list. Each element is a node with pointers to the previous and next nodes.

#### Internal Structure

```
LinkedList<String> list = new LinkedList<>();
list.add("A");  list.add("B");  list.add("C");

head                                              tail
  │                                                │
  ▼                                                ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ prev: null   │◄───│ prev: ●      │◄───│ prev: ●      │
│ item: "A"    │    │ item: "B"    │    │ item: "C"    │
│ next: ●──────│───►│ next: ●──────│───►│ next: null   │
└──────────────┘    └──────────────┘    └──────────────┘
    Node 0              Node 1              Node 2
```

#### Time Complexity

| Operation | Time | Why |
|-----------|------|-----|
| `get(index)` | **O(n)** | Must traverse from head or tail |
| `add(element)` | **O(1)** | Link new node at tail |
| `add(index, element)` | **O(n)** | Traverse to position (O(n)), then link (O(1)) |
| `remove(index)` | **O(n)** | Traverse to position, then unlink (O(1)) |
| `addFirst()` / `addLast()` | **O(1)** | Direct head/tail pointer manipulation |
| `removeFirst()` / `removeLast()` | **O(1)** | Direct head/tail pointer manipulation |

### ArrayList vs LinkedList — The Real Comparison

| Aspect | ArrayList | LinkedList |
|--------|-----------|------------|
| Random access (`get`) | **O(1)** ✅ | O(n) |
| Sequential access | Fast (CPU cache-friendly) | Slow (nodes scattered in memory) |
| Insert at end | **O(1)** amortized | **O(1)** |
| Insert in middle | O(n) (shift elements) | O(n) (traverse) + O(1) (link) |
| Memory per element | ~4 bytes (reference) | ~24 bytes (prev + item + next references + node object overhead) |
| Use when | 99% of cases | Frequent add/remove at head, or as Deque/Queue |

> **Practical Truth:** Almost always use `ArrayList`. LinkedList's theoretical O(1) insert advantage is negated by poor cache locality. Modern CPUs are optimized for sequential memory access (arrays), not pointer chasing (linked lists).

---

## Set Implementations

### HashSet

> An unordered collection of unique elements. Backed by a `HashMap` internally.

#### Internal Working

```java
// HashSet is literally a HashMap where:
//   - Your element is the KEY
//   - A dummy Object (PRESENT) is the VALUE
public class HashSet<E> {
    private HashMap<E, Object> map;
    private static final Object PRESENT = new Object();
    
    public boolean add(E e) {
        return map.put(e, PRESENT) == null;
    }
}
```

**Uniqueness check:** When you `add(element)`:
1. Compute `hashCode()` → determines bucket.
2. Check bucket for existing element with same hash.
3. If found, call `equals()` → if true, element already exists (not added).

#### Time Complexity

| Operation | Average | Worst Case |
|-----------|---------|------------|
| `add(element)` | **O(1)** | O(n) (all elements in one bucket) |
| `remove(element)` | **O(1)** | O(n) |
| `contains(element)` | **O(1)** | O(n) |

### TreeSet

> A sorted set backed by a **Red-Black Tree** (self-balancing BST). Elements are stored in natural ordering or by a custom `Comparator`.

| Operation | Time |
|-----------|------|
| `add`, `remove`, `contains` | **O(log n)** |
| `first()`, `last()` | **O(log n)** |
| Iteration | **Sorted order** |

```java
TreeSet<Integer> set = new TreeSet<>();
set.add(5); set.add(2); set.add(8); set.add(1);
System.out.println(set);  // [1, 2, 5, 8] — always sorted
```

### LinkedHashSet

> Maintains **insertion order** while still having O(1) lookups. Backed by a `LinkedHashMap`.

```java
LinkedHashSet<String> set = new LinkedHashSet<>();
set.add("banana"); set.add("apple"); set.add("cherry");
System.out.println(set);  // [banana, apple, cherry] — insertion order preserved
```

### Set Comparison

| Feature | HashSet | TreeSet | LinkedHashSet |
|---------|---------|---------|---------------|
| Order | None | Sorted (natural/comparator) | Insertion order |
| Performance | O(1) | O(log n) | O(1) |
| Null elements | 1 null allowed | No nulls (NPE on compare) | 1 null allowed |
| Backing structure | HashMap | Red-Black Tree | LinkedHashMap |
| Use when | Default choice | Need sorted data | Need insertion order |

---

## Map Implementations — The Most Important Collection

### HashMap — Internal Deep Dive

> The single most important data structure to understand for interviews.

#### Internal Structure (Java 8+)

```
HashMap<String, Integer> map = new HashMap<>();

           Hash Table (Node[] table — default capacity 16)
Bucket:  [0]  [1]  [2]  [3]  [4]  [5]  [6]  [7] ... [15]
          │         │                   │
          ▼         ▼                   ▼
        null     ┌─────┐            ┌─────┐
                 │"age" │            │"name"│
                 │ =25  │            │="Ali"│
                 │next──│──►┌─────┐  │next  │
                 └─────┘   │"id" │  └──│──┘
                           │ =42 │     ▼
                           │next │   null
                           └─────┘
                           
     Linked List (< 8 nodes)     or     Red-Black Tree (≥ 8 nodes)
```

#### How `put(key, value)` Works — Step by Step

```
1. Compute hash:
   hash = key.hashCode() ^ (key.hashCode() >>> 16)  // Spread high bits
   
2. Find bucket index:
   index = hash & (table.length - 1)   // Bitwise AND (faster than modulo)
   
3. Check bucket:
   ├── Empty bucket → Create new Node, place in bucket
   │
   └── Non-empty bucket → Walk the chain
       ├── Key exists (hash matches AND equals() is true)
       │   → Replace the value, return old value
       │
       └── Key not found → Append new Node to the chain
           ├── Chain length ≥ 8 → Convert chain to Red-Black Tree
           └── Table load factor exceeded → Resize (double capacity)
```

#### Critical Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| Default capacity | **16** | Initial number of buckets |
| Load factor | **0.75** | When 75% full, resize (double) |
| Treeify threshold | **8** | Convert linked list to tree when chain reaches 8 |
| Untreeify threshold | **6** | Convert tree back to linked list when chain drops to 6 |

#### Why Load Factor 0.75?

Trade-off between space and time:
- **Lower (0.5)** → More empty buckets (wastes memory), fewer collisions (faster).
- **Higher (0.9)** → Less wasted space, more collisions (slower).
- **0.75** → Good balance. Statistically, at 75% occupancy, chains are short enough for O(1) average access.

#### Resizing (Rehashing)

When `size > capacity * loadFactor`:
1. Create a new array with **2x capacity**.
2. Recompute bucket index for every entry (`hash & (newCapacity - 1)`).
3. Move all entries to their new positions.

> **Performance Impact:** Rehashing is O(n). If you know the expected size, pre-size: `new HashMap<>(expectedSize * 4 / 3 + 1)` to avoid rehashing.

### TreeMap

> A sorted map backed by a **Red-Black Tree**. Keys are stored in natural order or by a custom `Comparator`.

```java
TreeMap<String, Integer> map = new TreeMap<>();
map.put("Charlie", 3);
map.put("Alice", 1);
map.put("Bob", 2);
// Iteration: Alice=1, Bob=2, Charlie=3 (sorted by key)

// Useful navigation methods
map.firstKey();           // "Alice"
map.lastKey();            // "Charlie"
map.subMap("Alice", "C"); // Alice=1, Bob=2 (range query)
map.floorKey("Bravo");    // "Bob" (greatest key ≤ given key)
```

| Operation | Time |
|-----------|------|
| `put`, `get`, `remove` | **O(log n)** |
| `firstKey`, `lastKey` | **O(log n)** |
| Range queries | **O(log n + k)** where k is result count |

### LinkedHashMap

> Maintains **insertion order** (or optionally **access order**) while providing O(1) lookups.

```java
// Access-order mode — useful for LRU cache
LinkedHashMap<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
        return size() > 100;  // Evict when cache exceeds 100 entries
    }
};
```

### ConcurrentHashMap

> Thread-safe map that uses **fine-grained locking** (per-bucket or segment locking) instead of synchronizing the entire map.

| Feature | HashMap | Hashtable | ConcurrentHashMap |
|---------|---------|-----------|-------------------|
| Thread-safe | ❌ No | ✅ (synchronized on entire map) | ✅ (per-bucket locking) |
| Null keys/values | ✅ 1 null key, many null values | ❌ No nulls | ❌ No nulls |
| Performance (concurrent) | N/A | Poor (single lock) | **Excellent** |
| Iteration | Fail-fast | Fail-fast | **Weakly consistent** |

### Map Comparison

| Feature | HashMap | TreeMap | LinkedHashMap |
|---------|---------|---------|---------------|
| Order | None | Sorted by key | Insertion order |
| Get/Put | O(1) | O(log n) | O(1) |
| Null keys | 1 allowed | ❌ | 1 allowed |
| Backing | Hash table | Red-Black Tree | Hash table + doubly linked list |
| Use when | Default choice | Need sorted keys or range queries | Need insertion order or LRU cache |

---

## Queue and Deque

### PriorityQueue

> A min-heap (by default) that always dequeues the smallest element.

```java
PriorityQueue<Integer> pq = new PriorityQueue<>();  // Min-heap
pq.add(5); pq.add(1); pq.add(3);
pq.poll();  // Returns 1 (smallest)
pq.poll();  // Returns 3
pq.poll();  // Returns 5

// Max-heap
PriorityQueue<Integer> maxPq = new PriorityQueue<>(Comparator.reverseOrder());
```

| Operation | Time |
|-----------|------|
| `offer()` / `add()` | **O(log n)** |
| `poll()` / `remove()` | **O(log n)** |
| `peek()` | **O(1)** |

### ArrayDeque

> A resizable array-based double-ended queue. Faster than both `LinkedList` (as a queue) and `Stack`.

```java
ArrayDeque<String> deque = new ArrayDeque<>();

// As a Stack (LIFO)
deque.push("A");
deque.push("B");
deque.pop();     // "B"

// As a Queue (FIFO)
deque.offer("A");
deque.offer("B");
deque.poll();    // "A"
```

> **Best Practice:** Use `ArrayDeque` instead of `Stack` (legacy, synchronized, slow) and instead of `LinkedList` for queues (better cache locality, less memory).

---

## Fail-Fast vs Fail-Safe Iterators

### Fail-Fast

Most collections (`ArrayList`, `HashMap`, `HashSet`) have fail-fast iterators. If the collection is modified while iterating (except through the iterator itself), it throws `ConcurrentModificationException`.

```java
List<String> list = new ArrayList<>(List.of("A", "B", "C"));
for (String s : list) {
    if (s.equals("B")) {
        list.remove(s);  // ConcurrentModificationException!
    }
}

// Correct way — use iterator's remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("B")) {
        it.remove();  // Safe — iterator handles internal state
    }
}

// Or use removeIf (Java 8+)
list.removeIf(s -> s.equals("B"));
```

**How it works:** Collections maintain a `modCount` (modification counter). The iterator saves the initial `modCount` at creation. On each `next()` call, it checks if `modCount` has changed — if so, throws the exception.

### Fail-Safe (Weakly Consistent)

Concurrent collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`) use fail-safe iterators that work on a copy or snapshot. They never throw `ConcurrentModificationException` but may not reflect recent modifications.

---

## Comparable vs Comparator

### Comparable — Natural Ordering

```java
// The class itself defines its natural ordering
public class Employee implements Comparable<Employee> {
    private String name;
    private int salary;
    
    @Override
    public int compareTo(Employee other) {
        return Integer.compare(this.salary, other.salary);  // Sort by salary
    }
}

List<Employee> employees = ...;
Collections.sort(employees);  // Uses compareTo
```

### Comparator — External Ordering

```java
// Define ordering externally — multiple orderings possible
Comparator<Employee> byName = Comparator.comparing(Employee::getName);
Comparator<Employee> bySalaryDesc = Comparator.comparing(Employee::getSalary).reversed();
Comparator<Employee> byNameThenSalary = Comparator.comparing(Employee::getName)
                                                   .thenComparing(Employee::getSalary);

employees.sort(byName);
employees.sort(bySalaryDesc);
```

### Comparison

| Aspect | Comparable | Comparator |
|--------|-----------|------------|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(T other)` | `compare(T a, T b)` |
| Modifies class? | Yes (implements interface) | No (external) |
| Orderings | One (natural) | Multiple (custom) |
| Use when | Class has a single obvious ordering | Need multiple orderings or can't modify the class |

---

## Unmodifiable and Immutable Collections

```java
// Unmodifiable VIEW — backed by original (changes reflect)
List<String> original = new ArrayList<>(List.of("A", "B"));
List<String> unmodifiable = Collections.unmodifiableList(original);
original.add("C");
System.out.println(unmodifiable);  // [A, B, C] — reflects change!

// Truly Immutable (Java 9+) — no backing collection
List<String> immutable = List.of("A", "B", "C");       // Throws UnsupportedOperationException on add/remove
Map<String, Integer> immMap = Map.of("a", 1, "b", 2);  // Truly immutable

// Immutable copy (Java 10+)
List<String> copy = List.copyOf(original);  // Independent copy, immutable
```

---

## Interview Perspective

**Q: Explain how HashMap works internally.**

HashMap uses an array of buckets (default 16). When you `put(key, value)`: (1) compute `hashCode()` of the key, (2) find bucket index via `hash & (capacity-1)`, (3) check for existing key using `equals()` — replace if found, append to chain if not. When load exceeds 75% (load factor), the array doubles in size and all entries are rehashed. In Java 8+, chains exceeding 8 nodes convert to Red-Black Trees for O(log n) worst-case lookup instead of O(n).

**Q: What happens if you don't override `hashCode()` when using custom objects as HashMap keys?**

If `hashCode()` isn't overridden, it uses `Object.hashCode()` (memory address). Two logically equal objects will have different hash codes, landing in different buckets. `map.get(equalKey)` won't find the entry even though `key.equals(equalKey)` is true, because it's looking in the wrong bucket.

**Q: ArrayList vs LinkedList — when would you use LinkedList?**

Almost never. ArrayList is faster for virtually all operations due to CPU cache locality (contiguous memory). LinkedList has 6x memory overhead per element (node objects). Use LinkedList only when you need constant-time insertions/removals at both ends (Deque operations), or if you're holding an iterator position and doing many inserts at that position.

**Q: What is the difference between fail-fast and fail-safe iterators?**

Fail-fast iterators (ArrayList, HashMap) throw `ConcurrentModificationException` if the collection is structurally modified during iteration (tracked via `modCount`). Fail-safe iterators (ConcurrentHashMap, CopyOnWriteArrayList) work on a snapshot/copy and never throw, but may not reflect concurrent modifications.

**Q: How would you implement an LRU cache in Java?**

Use `LinkedHashMap` in access-order mode with a max size. Override `removeEldestEntry()` to evict when capacity is exceeded. The most recently accessed entry moves to the tail; the eldest (least recently used) is at the head and gets evicted first.

**Q: When would you use TreeMap over HashMap?**

When you need sorted keys, range queries (`subMap`, `headMap`, `tailMap`), or navigation (`floorKey`, `ceilingKey`). TreeMap operations are O(log n) vs HashMap's O(1), so use HashMap when you don't need ordering.

---

## Key Takeaways

- **HashMap** is O(1) average, backed by array + linked lists/trees. Load factor 0.75 triggers rehashing. Most important collection to understand internally.
- **ArrayList** over LinkedList in 99% of cases. Cache locality matters more than theoretical complexity.
- **HashSet is a HashMap** with dummy values. Understanding HashMap means understanding HashSet.
- **TreeMap/TreeSet** use Red-Black Trees for O(log n) sorted operations.
- **`equals()`/`hashCode()` contract** is critical for all hash-based collections. Break it and nothing works.
- **Fail-fast iterators** throw on concurrent modification. Use `Iterator.remove()` or `removeIf()` for safe removal during iteration.
- **ArrayDeque** is the modern replacement for both `Stack` and `LinkedList` as a queue.
- **`List.of()` / `Map.of()`** (Java 9+) create truly immutable collections.
