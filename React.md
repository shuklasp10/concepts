# Web Developemnt Notes: React

## Table of Contents
- [useEffect](#useeffect)
- [useContext](#usecontext)
- [useReducer](#usereducer)
- [useRef](#useref)
- [Routing](#routing)
- [Redux](#redux)
- [Dates](#dates)
- [Middleware](#middleware)
- [Keywords](#keywords);


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
### simple way of using context api
**Walkthrough**:
1. Create context using ```createContext``` which takes default value.
2. Wrap application with context provider using ```myContext.Provider```.
3. To access context anywhere use ```useContext``` with your context name.

**Create context object**
 ```
//Context.jsx
import React, { createContext } from "react";

export const MyContext = createContext(defaultValue);
 ```
* here we can't use `useState` because hooks can be used only in react component or in custom hook
* Also default value is not required becasue while wrapping application with provider it is mandatory to give value prop.

**Provide context to application**
```
//Index.jsx
import {MyContext} from './Context.jsx'

root.render(
    <MyContext.Provider value={"light"}>
        <App />
    </MyContext.Provider>
)
```
* Now here we can provide state and setState as value.

**Access context in component**
```
//Page.jsx
import {useContext} from 'react';

export default Page = () =>{
    const myContext = useContext(MyContext)
}
```

### Better way to use context API
**Walkthrough**:
1. while creating context, create a react component as `ThemeProvider`
2. Now wrap app with `ThemeProvider` component.
3. All the wrapped app will be passed as children prop to `ThemeProvider`.
4. Render children prop in `ThemeProvider` component by wrapping it with context provider.
5. New flow of application will be  
    Main -> App -> ThemeProvider -> Other components

```
//contexts.js
import {createContext, useState} from 'react'

const ThemeContext = createContext();

export const ThemeProvider = ({children}) =>{
    const [theme, setTheme] = useState('dark');
    return(
        <ThemeContext.Provider value={[theme,setTheme]}>
            {children}
        <ThemeContext>
    )}


//App.js

return(
    <ThemeProvider>
        <Header>
        <Body>
    <ThemeProvider>
)
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
### walkthrough
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
| starts with ```'/'``` |  starts without ```'/'``` | 
| clear & simple to understand | require time to understand very nested routes | 
| complex for nested routes | more maintainable for nested routes | 
| need to change all absolute path if subdirectory of app changes | no changes neede if app deployed to different directory |  

__absolute path__  
```
<Route path='/about' element={<About />} />
```   
__relative path__  
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

### Redirect
* Redirect from one page to another page can achieved in two way.  
* Prev page -> Next Page
* __Optional property:__ `{replace: true | falsee}` is used to replace history of prev page with next page in browser.

#### `Navigate` component wrapper
* Declarative way to redirect to another page
* It is replaced from `Redirect` component in previous version
```
import {Navigate} from 'react-router-dom';

return(
    <Navigate to='/admin/home' replace='false' />
)
// Also used on routing
<Route path='/admin' element=<Navigate to='/admin/home' replace /> />
```

#### `useNavigate` hooks
* Programitical way to redirect to another page
* Used to redirect on any event like button click or programitically
```
import {useNavigate} from 'react-router-dom'

const navigate = useNavigate()

function handleClick(){
    navigate('/admin/home',{replace: true});
}
```

### Notes
1. Use ```<Outlet />``` in navigation if there is nested routing.
2. ```'/path'``` gives absolute path whereas ```'path'``` gives relative path.

## Redux
It provides a centralized store for your application's state, along with mechanisms for updating that state in a controlled and testable manner.  

### walkthrough
* __Creating redux__ _(uses `@reduxjs/toolkit` library)_
    1. `createSlice` create a slice for each state which will return name, action generator functions and reducer for the application.
    2. `configureStore` create a store for application in which contains all your reducers.
* __Implementing redux__ _(uses `react-redux` library)_
    1. `Provider` wrap application making state available to entire application.
    2. `useSelector` to retrieve state in any component.
    3. `useDispatch` to change state use to send actions.

### createSlice
__Slice:__ provides tools to organize and manage a specific feature of app.  

__createSlice:__ Utility function to simplify and automate process of creating slice.

__arguments:__ an object including:
1. `name` used as prefix of action type to make it unique.
2. `initialState` initial value of state.
3. `reducers` object containing functions to update state.

__returns:__ an object including:
1. `name` Slice Name
2. `actions` action generators function
3. `reducer` a function combining all reducers and implement switch case based on action types

__Implementation:__
```
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
    name: 'counter',
    initialState: {count: 0},
    reducers: {
        increment(state){state.count++},
        decrement: (state, action){state.count}
    }
});

export const {increment, decrement} = counterSlice.actions;
export default counterSlice.reducer; 
```
__reducers:__
* It is an object with key-value pair where
    *  key: used as suffix of action type name
    * value: a reducer function mapped to that action type. 
* reducers are pure function.
* reducer function accepts `state` and `<action>` as argument.
* state are immutable but due to `immer` integration it can be directly mutated.

__action generators:__  
1. action creators are functions that returns action object with type and payload.
2. `createSlice` creates action creator functions with same name as reducers key.
3. If we execute action creators it gives object contaning
    * __type__ <name/actionName>
     _counter/increment_ or _counter/decrement_
    * __payload__ parameter passed while executing aciton creators 

### configureStore
__Store:__ create common space for all states.  
__arguments:__ an object including:
1. `reducer` _(required)_ reducers for all state and combine into one
2. `middleware` _(optional)_ by default thunk is added.

```
import { configureStore } from '@reduxjs/toolkit';
import {counterReducer} from './counterSlice';
import {todoReducer} from './todoSlice';

const store = configureStore({
    reducer: {
        counter: counterReducer,
        todo: todoReducer
    }
});

export deafult store;
```
>Name provided to reducers will be used as state name. eg state.counter, state.todo 

### Provider
To make store accessible to app.
 ```
 import ReactDOM from 'react-dom/client';
 import store from './store';
 import {Provider} from 'react-redux';

 const root = ReactDOM.createRoot(document.getElementById('root'));

 root.render(
    <Provider store={store}>
        <App />
    </Provider>
 )
 ```

### useSelector
`useSelector`
* is used to fetch state from store.
* takes a function which takes whole state and return required slice of state.
```
import {useSelector} from 'react-redux';

const app(){
    const count = useSelector((state)=>state.counter.count);

    return (

    )
}
```

### useDispatch
```useDispatch```  
* messenger between app and store.
* dispatch function send action object to store.
* action creator function is executed in dispatch function so that returned action object can be passed in dispatch funtion.
```
import {useDispatch} from 'react-redux';
import {increment, decrement} from './counterSlice';

const App(){
    const dispatch = Dispatch()
    dispatch(increment());

    return(
    )
}
```
__action object__  
* It contains two things
    1. __type__ _required_ String
    2. __payload__ _optional_ additional data


## dates


## Keywords
1. conditional rendering
2. React Router - Router, Routes, Route, Link, Navigate, Location
3. Lifecycle - Initialization, Mounting, Updating, Unmounting
4. Hooks: how it works?
5. How state and prop affects render?
6. React fragments
7. CSS modules - locally scope css
8. Styled component
9. Prop drilling
10. Controlled and uncontrolled components
11. useref hook
12. Synthetic event
13. Events