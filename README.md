# [react-async-stateful](https://github.com/Censkh/react-async-stateful/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Censkh/react-async-stateful/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/react-async-stateful.svg?style=flat)](https://www.npmjs.com/package/react-async-stateful)

## What is it?

A consistent method of storing state about async calls with the goal of reducing boilerplate in react code

```jsx harmony
// plain js
import {useAsyncState} from "react-async-stateful";

const AsyncComponent = (props) => {
    const [submitResult, _, updateSubmitResult] = useAsyncState();    

    const submit = useCallback(() => {
        const {resolvedAt} = updateSubmitResult(async () => {
            const response = await fetch("https://example.com/api/v1/squeal-loudly");
            return response.json();
        });
        console.log(`API responded at: ${new Date(resolvedAt).toString()}`)
    });
    
    return <div>
        <button onClick={submit}>Call the API!</button>
        {submitResult.resolved && <div>The response: {JSON.stringify(submitResult.value)}</div>}
    </div>;
};
```

## useAsyncState hook

The `useAsyncState` hook returns:

```jsx harmony
    const [asyncState, setAsyncState, updateAsyncState] = useAsyncState(defaultValue);
``` 

- `asyncState` is the the current value of the async state
- `setAsyncState` is usually never needed but can be useful to synchronously update the state, eg:
    ```jsx harmony
  import {resolve} from "react-async-stateful";

  const updateFromLocalStorage = () => {
      setAsyncState(asyncState => {
          const value = localStorage.getItem("key");
          return resolve(asyncState, value);
      });
  };
    ```
- `updateAsyncState` is the recommended way of updating. It will automatically update the state and re-render your component with a pending state allowing you to dipslay loading spinners ect.
    ```jsx harmony
  const submit = useCallback(() => {
      updateAsyncState(/*promise or an async function*/ async () => {
          const response = await api.get(`user/${userId}`); // thrown errors are automatically handled
          const user = formatUserObject(response.data);
          return user;
      });
  }, [userId]);
  
  // component will receive:
  asyncState.pending === true
  
  // then
  asyncState.resolved === true
  asyncState.value    === user // resolved value
  
  // or if a rejection
  asyncState.rejected === true
  asyncState.error    === Error // error instance
    ```



## The AsyncState object

**Note:** All operations on async state **do not** mutate the original object

```typescript jsx
// typescript
import * as AsyncState from "react-async-stateful";

// creating the state
const state = AsyncState.create("hello");
console.log(state.pristine); // true
console.log(state.value); // hello

// resolving the state
const resolvedState = AsyncState.resolve(state, "world");
console.log(state.resolved); // true
console.log(state.value); // world

```

#### Properties

| key            | type                                  | description
| ---            | ---                                   | --- 
| `defaultValue` | `T` or `undefined`                    | default value set at the object creation    
| `pristine`     | `boolean`                             | have we been updated yet?
| `pending`      | `boolean`                             | is there an update to the state happening now?
| `pendingAt`    | `number` or `null`                    | when the update started
| `resolved`     | `boolean`                             | do we have a resolved value? if this is true then `value` must not be `undefined`
| `resolvedAt`   | `number` or `null`                    | when the value the was resolved    
| `rejected`     | `boolean`                             | if an error occurred or the update was rejected. if this is true then `error` must not be `undefined`
| `rejectedAt`   | `number` or `null`                    | when the rejection happened 😢
| `settled`      | `boolean`                             | if the object is resolved/rejected and not pending
| `settledAt`    | `number` or `null`                    | when it was settled
| `value`        | `T` or `undefined`                    | the currently resolved value, if `undefined` we are not resolved    
| `error`        | `Error` or `undefined`                | the reason for the rejection, if `undefined` we are not rejected        
| `submitType`   | `AsyncStateSubmitType` or `undefined` | what kind of submit was it? can be either `submit` or `refresh`                        

## To-Do

- [ ] tests
- [ ] better docs
- [ ] redux actions + reducers