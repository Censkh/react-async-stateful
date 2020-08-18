import {Dispatch, SetStateAction} from "react";
import AsyncState                 from "./AsyncState";
import {PromiseOrAsyncFunction}   from "./Types";

export interface UpdateAsyncStateOptions {
  refresh?: boolean;
  minimumPending?: number;
}

export const updateAsyncState = async <T>(setAsyncState: Dispatch<SetStateAction<AsyncState<T>>>,
                                          promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
                                          options?: UpdateAsyncStateOptions): Promise<AsyncState<T>> => {
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

    let minimumPendingPromise: Promise<void> | undefined = undefined;
    if (options?.minimumPending) {
      minimumPendingPromise = new Promise<void>((resolve) => setTimeout(resolve, options.minimumPending));
    }

    let [value] = await Promise.all([promise, minimumPendingPromise]);
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
