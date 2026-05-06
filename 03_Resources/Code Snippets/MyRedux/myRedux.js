export function createStore(reducer) {
    let state = reducer(undefined, {type: undefined});
    let callback = () => { }
    
    const Store = {
        getState() { return state },
        dispatch(action) {
            state = reducer(state, action);
            this.callback();
        },
        subscribe(myfunc){
            this.callback = myfunc;
        }
    }
    return Store;
}