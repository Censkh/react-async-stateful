import {Dispatch, SetStateAction, useMemo, useState} from "react";
import AsyncState                                    from "../AsyncState";

export type PromiseOrAsyncFunction<T> = Promise<T> | (() => Promise<T>);

interface UpdateAsyncStateOptions {
  refresh?: boolean;
}

export type UpdateAsyncStateFunction<T> = (
  promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
  options?: UpdateAsyncStateOptions,
) => Promise<AsyncState<T>>;

export type UseAsyncStateResult<T> = [
  AsyncState<T>,
  Dispatch<SetStateAction<AsyncState<T>>>,
  UpdateAsyncStateFunction<T>
];

export const createUpdateFunction = <T>(
  setAsyncState: Dispatch<SetStateAction<AsyncState<T>>>,
): UpdateAsyncStateFunction<T> => {
  return async (promiseOrAsyncFn, options): Promise<AsyncState<T>> => {
    if (options?.refresh) {
      setAsyncState(currentState => {
        return AsyncState.refresh(currentState);
      });
    } else {
      setAsyncState(currentState => {
        return AsyncState.submit(currentState);
      });
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
        throw new Error(`[react-async-stateful] ${
          typeof promiseOrAsyncFn === "function"
            ? "Function provided did not return a promise"
            : "First argument was not a promise or an async function"
        }`);
      }

      let value = await promise;
      if (value === undefined) {
        // shouldn't resolve to undefined, as that denotes we haven't resolved at all
        value = null as any;
      }

      setAsyncState(currentState => {
        const updatedState = AsyncState.resolve(currentState, value);
        valueResolve(updatedState);
        return updatedState;
      });
    } catch (error) {
      setAsyncState(currentState => {
        const updatedState = AsyncState.reject(currentState, error);
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
  const [asyncState, setAsyncState] = useState<AsyncState<T>>(AsyncState.create(defaultValue));
  const updateFn = useMemo<UpdateAsyncStateFunction<T>>(
    () => createUpdateFunction(setAsyncState),
    [],
  );

  return [asyncState, setAsyncState, updateFn];
}
