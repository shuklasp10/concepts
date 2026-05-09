# Core Fundamentals

## Datatypes

### Primitive

> Always passed as value.

- **string**
- **number**
    - Numbers are **64 bit** IEEE 754 double precision.
    - Breakdown: Sign(1) + Exponent(11) + Mantissa(52)
    - Also include floats
    - Minimum safe range: `-(2^53 - 1)` or `-9007199254740991` or `Number.MIN_SAFE_INTEGER`
    - Maximum safe range: `(2^53 - 1)` or `9007199254740991` or `Number.MAX_SAFE_INTEGER`
    - Beyond this range numbers exist but precision is lost.
    - Minimum positive range: `5e-324` or `Number.MIN_VALUE`
    - Maximum range: `1.7976931348623157e+308` or `Number.MAX_VALUE`
    - Beyond this range become `0` for minimum and `Infinity` for maximum

#### NaN

Special numeric value representing invalid number results.

- Created by: `0/0`, `Math.sqrt(-1)`, `Number("Hello")`
- `NaN === NaN` is always `false`. Use `Number.isNaN(value)` to check.
- `isNaN()` converts value to number first then compares — prefer `Number.isNaN()` for strict check.

- **bigint**
    - For number beyond safe integer.
    - Range limited by memory.
- **boolean**
- **undefined**
- **null**
    - `null` is a primitive datatype but `typeof null` returns `"object"`. This is a historical bug from the first JavaScript implementation, kept for backward compatibility.
- **symbol**
    - Used as **unique identifiers**, mostly as keys in object.
    - Two symbol with same value can't be equal.
    - `Symbol("id") === Symbol("id")` false

### Non primitive (reference)

> Always passed as reference. Javascript has one non-primitive type `object`, rest all are specialized objects.

- **object**
- **array**
- **function**
- **date**
- **RegExp**
- **map**
- **set**
- **weakmap**
- **weakset**

### Built-in objects

- **Set**
    - stores unique value of any type
- **Map**
    - map stores key, value pair where key can be anything not only string
    - `map.size` gives number of entries in map.
    - `Object.fromEntries(map)` convert map to object.

## Date

date is represented by `Date` object.

### creating date object

various method of creating date object

1. `const currentDate = new Date();`

   - returns current date and time with ISO 8601 format.
   - **format** YYYY-MM-DDTHH:MM:SS.mmmZ
   - **T** represent separator, time start after that
   - **Z** represent timezone z - UTC
2. `const date = new Date(n);`

   - returns date after n milliseconds from Unix epoch
   - `new Date(0)` - (1970-01-01T00:00:00.000Z)
   - `new Date(1)` - (1970-01-01T00:00:00.001Z)
   - `new Date(1001)` - (1970-01-01T00:00:01.001Z)
3. `const date = new Date(yr,m,d,hr,min,sec)`;

   - month is 0-indexed so 0-jan, 1-Feb, 11-Dec

### accessing date component

following method are used for accessing components from date object

1. `date.getFullYear()` 2024
2. `date.getMonth()` 0-indexed month
3. `date.getDate()` 15
4. `date.getHours()` 23
5. `date.getMinutes()` 59
6. `date.getSeconds()` 59
7. `date.getTime()` return total ms between current date and start time

### manipulating dates

1. `date.setDate(date.getDate() + 7);`
2. `date.setMonth(date.getMonth() + 1);`
3. `date.setFullYear(date.getFullYear() - 1);`
4. Same can be done for hr, min and sec.

### comparing dates

1. Compare dates using operators or convert to milliseconds with `getTime()`.

### formatting date

1. `date.toDateString()` Mon May 15 2024
2. `date.toTimeString()` 12:00:00 GMT+0000 (Coordinated Universal Time)
3. `date.toISOString()` 2024-05-15T12:00:00.000Z

## Loops

### Basic `for` loop

```js
for (let i = 0; i < arr.length; i++) { ... }
```

### `for...in` loop

Iterate through `keys` for object, and `index` for array and string.

```js
const obj = { name: 'john', age: 20 }
const arr = [10, 20, 30]
const str = 'john'

for (let i in obj) { console.log(i) } // name age
for (let j in arr) { console.log(j) } // 0 1 2
for (let k in str) { console.log(k) } // 0 1 2 3
```

### `for...of` loop

Iterate through `values` for array, `char` for string.

For objects, it does not work directly. Instead, we can use `Object.entries(obj)` which return array of array of key value.

```js
const obj = { name: 'john', age: 20 }
const arr = [10, 20, 30]
const str = 'john'

for (let [key, value] of Object.entries(obj)) { 
  console.log(key, value)
} 
// name john
// age 20
for (let j of arr) { console.log(j) } // 10 20 30
for (let k of str) { console.log(k) } // j o h n
```

---

## TODO: Topics to Study

- [ ] `var` vs `let` vs `const` (declaration, scoping, redeclaration rules)
- [ ] Type coercion (implicit vs explicit)
- [ ] Truthy/falsy values
- [ ] `==` vs `===` (loose vs strict equality)
- [ ] Template literals
- [ ] Destructuring (array & object)
- [ ] Spread/rest operator
- [ ] Optional chaining (`?.`) and nullish coalescing (`??`)
- [ ] `typeof` operator behavior table
- [ ] String methods, Array methods (map, filter, reduce, etc.)
- [ ] WeakRef and FinalizationRegistry