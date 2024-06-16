## 0.11.0

### Breaking

- `useDebounced` now immediately triggers pending state

### Changes

- deprecated `AsyncState.pending`

## 0.10.1

- add `use client` directive

## 0.10.0

### Breaking

- remove redux support
- remove experimental recoil support

### Features

- add `useDebounced` to update function

## 0.9.4

### Changes

- better error display

## 0.9.3

### Fixes

- fix bugged redux dependency in `peerDependencies`

## 0.9.0

### Breaking

- remove `StatefulPromise`
- rename some redux types

### Changes

- if another update occurs while one is already pending only display results for the last update that is submitted
- add `timeout` to timeout long updates
- add `meta` data to async states (eg. for when you want to store extra info about a state such as when it was cached)
- improved error logging
- add `pending` action to `AsyncState` and redux actions 
- **Experimental**: *`AsyncStateGroup` to allow efficient grouping of elements*

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
