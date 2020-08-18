import {Dispatch, SetStateAction, useCallback, useState} from "react";
import AsyncState, {CreateOptions, CreateOptionsPending} from "../AsyncState";
import {updateAsyncState, UpdateAsyncStateOptions}       from "../Updater";
import {PromiseOrAsyncFunction}                          from "../Types";

export type UpdateAsyncStateFunction<T> = (
  promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
  options?: UpdateAsyncStateOptions,
) => Promise<AsyncState<T>>;

export type UseAsyncStateResult<T> = [
  AsyncState<T>,
  Dispatch<SetStateAction<AsyncState<T>>>,
  UpdateAsyncStateFunction<T>
];

export function useAsyncState<T>(defaultValue?: T, options?: CreateOptionsPending | CreateOptions): UseAsyncStateResult<T> {
  const [asyncState, setAsyncState] = useState<AsyncState<T>>(AsyncState.create(defaultValue, options));
  const updateFn = useCallback<UpdateAsyncStateFunction<T>>(
    (promiseOrAsyncFn, options) => updateAsyncState(setAsyncState, promiseOrAsyncFn, options),
    [],
  );

  return [asyncState, setAsyncState, updateFn];
}

export type UpdateAsyncStateGroupFunction<T, K extends string | number> = (
  key: K,
  promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
  options?: UpdateAsyncStateOptions,
) => Promise<AsyncState<T>>;

export type UseAsyncStateGroupResult<T, K extends string | number> = [
  Record<K, AsyncState<T>>,
  Dispatch<SetStateAction<Record<K, AsyncState<T>>>>,
  UpdateAsyncStateGroupFunction<T, K>
];

export function useAsyncStateGroup<T, K extends string | number = string>(defaultValue?: Record<K, AsyncState<T>>, defaultStateGetter?: () => AsyncState<T>): UseAsyncStateGroupResult<T, K> {
  const [stateGroup, setStateGroup] = useState((defaultValue || {}) as Record<K, AsyncState<T>>);

  const updateStateGroup = useCallback<UpdateAsyncStateGroupFunction<T, K>>((key, promiseOrAsyncFn, options) => {
    return updateAsyncState((state) => {
      return setStateGroup(prevState => {
        const newState = typeof state === "function" ? state(prevState[key] || (defaultStateGetter ? defaultStateGetter() : AsyncState.create())) : state;
        return Object.assign({}, prevState, {[key]: newState});
      });
    }, promiseOrAsyncFn, options);
  }, []);

  return [stateGroup, setStateGroup, updateStateGroup];
}
