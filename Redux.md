# Redux fundamental

## Redux architecture
* Redux works on principle of context API
* Redux contains three component
    * __State__ an object of all states for application
    * __Reducers__ function to change state with a pattern. It is abstract
    * __Subscribe__ Instead of directly calling reducers subscribe is used

## Why state in redux are immutable
* to track changes from previous state
```
const state = {count: 0}
const prevState = state;
state.count = 1 //Mutating object
console.log(state) //{count: 1}
console.log(prevState) //{count: 1}
```
* this will also change prevState since state and prevState are referring to same object.
```
const state = {count: 0}
const prevState = state;
state = {count: 1} //Immutating object
console.log(state) //{count: 1}
console.log(prevState) //{count: 0}
```
* Here state is not poinitng to different object and prevState is unchanged.
* React cannot track change if state is mutated
```
const App = () =>{
    const [state, setState] = useState({count: 0});
    state.count = 1 //state = {count: 1}
    setState(state) //this will not update component
}
```
* React only render only prev object and current object are different

## reducers
* Reducer is a funtion which change state
* Every redux store has one reducer which may be combination of multiple reducers
* Reducer takes state and action and returns a new object which will new state. 
* The default value of this state argument is initial state.

### Why it is called reducer
* Reducer reducer state and action to one object.

## redux flow
* Application state are combined in single state object.
* reducer is called with action type and payload.
* Based on action type reducer returns new ojbect.
* New object is then store in state variable.
* New and prev state are compared to rerender.

## dispatch
* It is function in redux which takes action object and calls reducer
* It also update state based on returned object from reducer
`store.disptach({type:'increment', payload:20})`

## subscribe
* It takes function which executes every time dispatch is called;
`store.subscribe(()=>{console.log("state changed)})`


## Store
* it is an object which is used to interact with state. 
* It contains reducers, state and provide method to call redcuers and get or track state.
* Methods of store
    * __getState()__ `store.getState()` returns state object
    * __dispatch()__ `store.dispatch()` call reducer and update state.
    * __subscribe()__ `store.subscribe()` execute a function everytime dispatch is called
* arguments
    * __reducer__ combined reducer
    * __store enhancer__ middleware, redux extension etc
* When store is created dispatch is called by redux and initialvalue passed in reducer is stored in state

