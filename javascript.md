# Web developement Notes: CSS

## Table of Contents
- [Boilerplate](#Boilerplate)
- [Variables](#variables)
- [Control Structures](#control-structures)
- [Functions](#functions)
- [Data Structures](#data-structures)
- [Example Code](#example-code)
- [Resources](#resources)


## Higher order functions
HOF are those functions which operates on other functions
Two types of HOF:
1. __Taking function as argument__ most commonly used
1. __Returning function__ less frequently used

## Array HOF
| HOF |Return | Description |
|------|------|------|
| `map` | Array | returns new array with elements return by callback functions |
| `filter` | Array | returns new array with elements for which callback returns true |
| `forEach` | Undefined | same as map but does not return new array |
| `reduce` | Value | returns single value by operating on each element |
| `some` | Boolean | return true if for any element callback returns true |
| `every` | Boolean | return true if for all element callback returns true |
| `find` | Single element | returns first element for which callback returns true |
| `findIndex` | Single index | same as find but returns index instead of element |

### reduce
callback function in reduce take one extra argument known as __accumulator (acc)__ .
Accumulator will store value performed on each element of array.

`const total = arr.reduce((acc,ele)=>{acc+=ele});`


### handling input on key press
```
const addTag = (e) =>{
    if( e.key == "enter" ){
        add tag...
    }
}
```
`<input onKeyDown={addTag} />`

### adding chip in input field
div = chip span + input (flexgrow : 1)