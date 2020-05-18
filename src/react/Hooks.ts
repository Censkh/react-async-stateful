import {Dispatch, SetStateAction, useMemo, useState} from "react";
import AsyncState                                    from "../AsyncState";

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
  UpdateAsyncStateFn<T>
];

const createUpdateFn = <T>(
  setAsyncState: Dispatch<SetStateAction<AsyncState<T>>>,
): UpdateAsyncStateFn<T> => {
  return async (promiseOrAsyncFn, options): Promise<AsyncState<T>> => {
    if (options?.refresh) {
      setAsyncState(currentState => currentState.refresh());
    } else {
      setAsyncState(currentState => currentState.submit());
    }

    let valueResolve: (state: AsyncState<T>) => void = () => {
      throw new Error("This should never happen!");
    };
    const valuePromise = new Promise<AsyncState<T>>(resolve => {
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

      let value = await promise;
      if (value === undefined) {
        // shouldn't resolve to undefined, as that denotes we haven't resolved at all
        value = null as any;
      }

      setAsyncState(currentState => {
        const updatedState = currentState.resolve(value);
        valueResolve(updatedState);
        return updatedState;
      });
    } catch (error) {
      setAsyncState(currentState => {
        const updatedState = currentState.reject(error);
        valueResolve(updatedState);
        if (process.env.NODE_ENV === "development") {
          console.error("[react-async-stateful] Updating async state failed:");
          console.error(error);
        }
        return updatedState;
      });
    }

    // wait for react to have updated our state
    return await valuePromise;
  };
};

export function useAsyncState<T>(defaultValue?: T): UseAsyncStateResult<T> {
  const [asyncState, setAsyncState] = useState<AsyncState<T>>(AsyncState.create(defaultValue),);
  const updateFn = useMemo<UpdateAsyncStateFn<T>>(
    () => createUpdateFn(setAsyncState),
    [],
  );

  return [asyncState, setAsyncState, updateFn];
}
