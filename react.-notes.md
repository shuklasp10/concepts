# Programming Language Notes: React

## Introduction
Brief introduction to the programming language.

## Table of Contents
- [useEffect](#useeffect)
- [useContext](#usecontext)
- [Routing](#control-structures)
- [Functions](#functions)
- [Data Structures](#data-structures)
- [Example Code](#example-code)
- [Resources](#resources)

## useEffect
Used to synchronize components with some external systems (server, network, widget outside react)
### Execution order
- Component added to DOM for first time
    - __setup__ executed
- Dependency changed
    - component rerenders
    - __cleanup__ executed with old values
    - __setup__ executed with new values 
```[javascript]
useEffect(()=>{
    ...setup function
    return ()=>{
        ...cleanup function
    }
},[dependencies])
```
**Dependency** props, state, variables and functions  
**No Dependency array** run setup after every rerender  
**Empty Dependency array** run on initial render but not on rerender

### Notes
1. In strict mode useEffect will run twice at first
2. It is hook so must be call at top most level. Not in loop or conditions.

## useContext
Used to access and use values from context to prevent prop drilling

### Create context object
 ```
//Context.jsx
import React, { createContext } from "react";

export const MyContext = createContext(defaultValue);
 ```

### Provide context to entire component tree
```
//Index.jsx
import {MyContext} from './Context.jsx'

root.render(
    <MyContext.Provider>
        <App />
    </MyContext.Provider>
)
```

### Access context in component
```
//Page.jsx
import {useContext} from 'react';

export default Page = () =>{
    const myContext = useContext(MyContext)
}
```

## Routing
Description of conditional statements and loops.
