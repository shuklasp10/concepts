# Programming Language Notes: React

## Table of Contents
- [useEffect](#useeffect)
- [useContext](#usecontext)
- [useReducer](#usereducer)
- [useRef](#useref)
- [Routing](#routing)

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

### Provide context to application
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

## useReducer

## useRef

## Routing
Library used to implemement routing - *react-router-dom*

### Router setup
```[javascript]
//index.jsx
import {BrowserRouter} from 'react-router-dom';
...
root.render(
     <BrowserRouter>
        <App />
     </BrowserRouter>
 );
```

### Creating routes
```
//App.jsx
import {Routes, Route} from 'react-router-dom'

function App = () = {
    return (
       <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/about' element={<About/>} />
        <Route path='/contact' element={<Contact/>} />
       <Routes/>
    )
}
```

### Creating navigations
```[javascript]
//Nav.jsx
import {Link} from 'react-router-dom'

....
<li><Link to='/about'>About</Link></li>
```

### Notes
1. Use ```<Outlet />``` in navigation if there is nested routing.
2. ```'/path'``` gives absolute path whereas ```'path'``` gives relative path.