import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncState, { type CreateOptions, type CreateOptionsPending } from "../AsyncState";
import type { PromiseOrAsyncFunction } from "../Types";
import { type UpdateAsyncStateOptions, updateAsyncState } from "../Updater";
import * as Utils from "../Utils";

type UpdateAsyncStateFunctionInternal<T> = (
  promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
  options?: UpdateAsyncStateOptions,
) => Promise<AsyncState<T>>;

export type UpdateAsyncStateFunction<T> = UpdateAsyncStateFunctionInternal<T> & {
  useDebounced: (delay: number) => UpdateAsyncStateFunctionInternal<T>;
};

export type UseAsyncStateResult<T> = [
  AsyncState<T>,
  Dispatch<SetStateAction<AsyncState<T>>>,
  UpdateAsyncStateFunction<T>,
];

export function useAsyncState<T>(
  defaultValue?: T,
  options?: CreateOptionsPending | CreateOptions,
): UseAsyncStateResult<T> {
  const [asyncState, setAsyncState] = useState<AsyncState<T>>(AsyncState.create(defaultValue, options));

  const updateFn = useRef<UpdateAsyncStateFunction<T>>();

  if (!updateFn.current) {
    const updateFnInternal: UpdateAsyncStateFunctionInternal<T> = (promiseOrAsyncFn, options) =>
      updateAsyncState(setAsyncState, promiseOrAsyncFn, options);

    updateFn.current = Object.assign(updateFnInternal, {
      useDebounced: (delay: number) => {
        const handlerRef = useRef<any>();
        const debouncedFn = useRef(((promiseOrAsyncFn, options) => {
          clearTimeout(handlerRef.current);
          handlerRef.current = setTimeout(() => {
            updateFnInternal(promiseOrAsyncFn, options);
          }, delay);
        }) as UpdateAsyncStateFunctionInternal<T>);
        useEffect(() => {
          return () => {
            clearTimeout(handlerRef.current);
          };
        }, []);
        return debouncedFn.current;
      },
    }) satisfies UpdateAsyncStateFunction<T>;
  }

  return [asyncState, setAsyncState, updateFn.current];
}

export type UpdateAsyncStateGroupFunction<T, K extends string | number> = (
  key: K,
  promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
  options?: UpdateAsyncStateOptions,
) => Promise<AsyncState<T>>;

export type UseAsyncStateGroupResult<T, K extends string | number> = [
  Record<K, AsyncState<T>>,
  Dispatch<SetStateAction<Record<K, AsyncState<T>>>>,
  UpdateAsyncStateGroupFunction<T, K>,
];

export function useAsyncStateGroup<T, K extends string | number = string>(
  defaultValue?: Record<K, AsyncState<T>>,
  defaultStateGetter?: () => AsyncState<T>,
): UseAsyncStateGroupResult<T, K> {
  const [stateGroup, setStateGroup] = useState((defaultValue || {}) as Record<K, AsyncState<T>>);

  const updateStateGroup = useCallback<UpdateAsyncStateGroupFunction<T, K>>(
    (key, promiseOrAsyncFn, options) => {
      return updateAsyncState(
        (state) => {
          return setStateGroup((prevState) => {
            const newState =
              typeof state === "function"
                ? state(prevState[key] || (defaultStateGetter ? defaultStateGetter() : AsyncState.create()))
                : state;
            return Utils.assign({}, prevState, { [key]: newState });
          });
        },
        promiseOrAsyncFn,
        options,
      );
    },
    [defaultStateGetter],
  );

  return [stateGroup, setStateGroup, updateStateGroup];
}
