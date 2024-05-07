# Web Developemnt Notes: React

## Table of Contents
- [useEffect](#useeffect)
- [useContext](#usecontext)
- [useReducer](#usereducer)
- [useRef](#useref)
- [Routing](#routing)
- [Redux](#redux)
- [Frontend Storage](#frontend-storage)

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
Creates a context data which can be accessed in any component without prop drilling. 
**Walkthrough**:
1. Create context using ```createContext``` which takes default value.
2. Wrap application with context provider using ```myContext.Provider```.
3. To access context anywhere use ```useContext``` with your context name.



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
Used to manage complex states with custom actions.  
Walkthrough:
1. Create a state using ```useReducer``` with reducer function and initial value.
2. Create a reducer function which takes current state and action and changes state according to given actions.
3. call ```dispatch()``` with actions object to trigger reducer which will change state.
4. actions object will contain type and payload data.
5. for safety purpose create a ACTIONS constant and use that everywhere. 

### create state with useReducer
```[javascript]
//App.jsx
import { useReducer } from 'react'

function App() {
    const [state, dispatch] = useReducer(reducer, InitialState)

    return ()
}
```
- Parameter
    - **reducer** a function which changes state
    - **InitialState** a object containing initial state
- Returns
    - An array containing
        - **state** current value of state
        - **dispatch** function to call actions

### reducer function
```
function reducer(state, action){
    switch(action.type){
        case 'action1':
            ...operation
            return modifiedState
        case 'action2':
            ...operation
            return modifiedState
        default:
            return state
    }
}
```
- Parameter
    - **state** current state
    - **actions** object containing type and payload
- Returns
    - new modified state

### dispatch function
calls reducer function by passing actions as parameter
```
dispatch({type:'action1'})
```

### actions
Constant object to define action name. It used to prevent error in dispatch and reducer function.
```
const ACTIONS = {
    INCREMENT : 'increment',
    DECREMENT : 'decrement'
}
```

### Note
1. Always make constant or variable of string if  it used multiple places
2. Do not modify state in reducer function since it is read only instead reutrn new state.
3. We can pass *initializer function* as 3rd argument in useReducer.
4. **initializer function** return value of this function will be set as state. Only called at first render.

## useRef

## Routing
Used to navigate in application through URL path.  
Library -  ```react-router-dom```  
**Walkthrough**
1. Install `react-router-dom` library.
2. Wrap application with `<BrowserRouter>`
3. Create `Routes` and `Route` defining path and component relation.
4. Use `Link` to create navigation button or link.
5. Use `<Outlet />` to create placeholder for nested route in parent route. 

### router setup
wrap application with ```BrowserRouter```
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

### creating routes
define ```Route``` inside ```Routes```
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

### creating navigations
Wrap button with ```Link``` to enable routing.
```[javascript]
//Nav.jsx
import {Link} from 'react-router-dom'

....
<li><Link to='/about'>About</Link></li>
```

### absolute vs relative path
| absolute | relative (recommended) |
|----------|----------|
| specify URL structure from root | specify URL structure from current route  |
| starts with ```'/'``` |  doesn't starts with ```'/'``` | 
| clear & simple to understand | require time to understand very nested routes | 
| complex for nested routes | more maintainable for nested routes | 
| need to change all absolute path if subdirectory of app changes | no changes neede if app deployed to different directory |  

__absolute__  
```
<Route path='/about' element={<About />} />
```   
__relative__  
 ```
 <Route path='courses' element={<Courses />}>
    <Route path='detail/:courseId' element={<CourseDetail />} />
 </Route>
 ``` 

### nested routing
Used when we need to render both parent component as well as child component.  
define ```Route``` inside ```Route```
```
function App = () = {
    return (
       <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/course' element={<Course/>} >
            <Route path='search element={<CourseSearch />} />
        </Route>
        <Route path='/contact' element={<Contact/>} />
       <Routes/>
    )
}
```
```<Outlet />``` 
* It is a placeholder component in parent component.
* It decides where child compoent will render in parent component.
* Used in parent component as a placeholder for nested route.
* It creates a socket where child routes can be plugged to render their content.
* In above example course will contain ```<Outlet />``` 

### Notes
1. Use ```<Outlet />``` in navigation if there is nested routing.
2. ```'/path'``` gives absolute path whereas ```'path'``` gives relative path.

## Redux
It provides a centralized store for your application's state, along with mechanisms for updating that state in a controlled and testable manner.  
**Walkthrough**
* Creating redux
    1. Create a store for application in `store.js` which contains all your reducers.
    2. Create a slice for each state which will provide reducer, actions and selectors for the application.
* Implementing redux
    3. Use `Provider` to wrap application making state available to entire application.
    4. To retrieve state in any component use `useSelector`.
    5. To change state use `useDispatch` to send actions


## Frontend Storage

