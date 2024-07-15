import { createStore } from './myRedux.js';

const countElement = document.querySelector('#count')
const inputElement = document.querySelector('input')

const INITIAL_STATE = {
    count: 0
}

function reducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case "increase":
            return { count: state.count + action.payload }
        case "decrease":
            return { count: state.count - action.payload }
        default:
            return state;
    }
}

const Store = createStore(reducer);

function callback(){
    console.log(Store.getState());
    countElement.innerText = Store.getState().count;
}

Store.subscribe(callback);

console.log(Store);

console.log(Store.getState());

countElement.innerText = Store.getState().count;

function handleAdd() {
    const value = parseInt(inputElement.value)
    Store.dispatch({type: "increase", payload: value})
    inputElement.value = 0
}

function handleSubstract(){
    const value = parseInt(inputElement.value)
    Store.dispatch({type: "decrease", payload:value })
    inputElement.value = 0
}

window.handleAdd = handleAdd;
window.handleSubstract = handleSubstract


