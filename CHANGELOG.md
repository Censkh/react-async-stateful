## 0.9.0

### Breaking

- remove `StatefulPromise`
- rename some redux types

### Changes

- add `meta` data to async states (eg. for when you want to store extra info about a state such as when it was cached)
- `AsyncStateGroup` to allow efficient grouping of elements
- improved error logging
- add `pending` action to `AsyncState` and redux actions 

## 0.8.0

### Features: 
- `map` function

## 0.6.1

### Features
- `minimumPending` option to update function

## 0.2.0

### Features:
- redux support ([docs](./docs/redux.md))
- `patch()` method
