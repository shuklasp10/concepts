# Core Fundamentals

## Datatypes

### Primitive

> Always passed as value.

- **string**
- **number**
  - Numbers are **64 bit** IEEE 754 double precision.
  - Breakdown: Sign(1) + Exponent(11) + Mantissa(52)
  - Also include floats
  - Minimum safe range: `-(2^53 - 1)` or `9007199254740991` or `Number.MIN_SAFE_INTEGER`
  - Maximum safe range: `(2^53 - 1)` or `9007199254740991` or `Number.MAX_SAFE_INTEGER`
  - Beyond this range numbers exist but precision is lost.
  - Minimum positive range: `5e-324` or `Number.MIN_VALUE`
  - Maximum range: `1.7976931348623157e+308` or `Number.MAX_VALUE`
  - Beyond this range become `0` for minimum and `Infinity` for maximum

```html
<!-- TODO: Move it in separate section and add link  -->
```

> `NaN` is special numeric value to represent invalid numbers.
> Example: `0/0`, `Math.sqrt(-1)`, `"Hello"`
> `NaN === NaN` will always be false. To compare use `Number.isNaN(value)`
> `isNaN()` old way it try to convert value in number first then compare. Use `Number.isNaN()` for safe check.

- **bigint**
  - For number beyond safe integer.
  - Range limited by memory.
- **boolean**
- **undefined**
- **null**
  - `Null` is primitive datatype but its `typeof` is `object`. This is
    intentional bug in Javascript.
- **symbol**
  - Used as **unique identifiers**, mostly as keys in object.
  - Two symbol with same value can't be equal.
  - `Symbol("id") === Symbol("id")` false

### Non primitive (reference)

> Always passed as referenceJavascript has one non-primitive type `object`, rest all are specialized objects.

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
   - **format** YYYY-MM-DDTHH:MM:SS:MMMZ
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
