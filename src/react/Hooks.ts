import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { AsyncState } from "../Types";
import * as Methods from "../Methods";

export type PromiseOrAsyncFn<T> = Promise<T> | (() => Promise<T>);

interface UpdateAsyncStateOptions {
  refresh?: boolean;
}

export type UpdateAsyncStateFn<T> = (
  promiseOrAsyncFn: PromiseOrAsyncFn<T>,
  options?: UpdateAsyncStateOptions,
) => Promise<AsyncState<T>>;

export type UseAsyncStateResult<T> = [
  AsyncState<T>,
  Dispatch<SetStateAction<AsyncState<T>>>,
  UpdateAsyncStateFn<T>,
];

const createUpdateFn = <T>(
  asyncState: AsyncState<T>,
  setAsyncState: Dispatch<SetStateAction<AsyncState<T>>>,
): UpdateAsyncStateFn<T> => {
  return async (promiseOrAsyncFn, options): Promise<AsyncState<T>> => {
    if (options?.refresh) {
      setAsyncState((currentState) => Methods.refresh(currentState));
    } else {
      setAsyncState((currentState) => Methods.submit(currentState));
    }

    let valueResolve: (state: AsyncState<T>) => void = () => {
      throw new Error("This should never happen!");
    };
    const valuePromise = new Promise<AsyncState<T>>((resolve) => {
      valueResolve = resolve;
    });

    try {
      const promise =
        typeof promiseOrAsyncFn === "function"
          ? promiseOrAsyncFn()
          : promiseOrAsyncFn;
      if (typeof promise.then !== "function") {
        throw new Error(
          typeof promiseOrAsyncFn === "function"
            ? "Function provided did not return a promise"
            : "First argument was not a promise or an async function",
        );
      }

      const value = await promise;
      if (value === undefined) {
        throw new Error(
          "Update state resolution cannot resolve to 'undefined', did you miss a return in your promise?",
        );
      }

      setAsyncState((currentState) => {
        const updatedState = Methods.resolve(currentState, value);
        valueResolve(updatedState);
        return updatedState;
      });
    } catch (error) {
      setAsyncState((currentState) => {
        const updatedState = Methods.reject(currentState, error);
        valueResolve(updatedState);
        console.error("Updating async state failed", error);
        return updatedState;
      });
    }

    // wait for react to have updated our state
    return await valuePromise;
  };
};

export function useAsyncState<T>(defaultValue?: T): UseAsyncStateResult<T> {
  const [asyncState, setAsyncState] = useState<AsyncState<T>>(
    Methods.create(defaultValue),
  );
  const updateFn = useMemo<UpdateAsyncStateFn<T>>(
    () => createUpdateFn(asyncState, setAsyncState),
    [asyncState],
  );

  return [asyncState, setAsyncState, updateFn];
}
