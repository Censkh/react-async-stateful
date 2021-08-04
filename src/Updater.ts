import {Dispatch, SetStateAction} from "react";
import AsyncState                 from "./AsyncState";
import {PromiseOrAsyncFunction}   from "./Types";
import AsyncStateGroup            from "./AsyncStateGroup";

export interface UpdateAsyncStateOptions {
  refresh?: boolean;
  minimumPending?: number;
}

export const updateAsyncState = async <T, A extends AsyncState<T>>(setAsyncState: Dispatch<SetStateAction<A>>,
                                                                   promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
                                                                   options?: UpdateAsyncStateOptions): Promise<A> => {
  if (options?.refresh) {
    setAsyncState(currentState => {
      return AsyncState.refresh(currentState) as A;
    });
  } else {
    setAsyncState(currentState => {
      return AsyncState.submit(currentState) as A;
    });
  }

  let valueResolve: (state: A) => void = () => {
    throw new Error("This should never happen!");
  };
  const valuePromise = new Promise<A>(resolve => {
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
      const updatedState = AsyncState.resolve(currentState, value) as A;
      valueResolve(updatedState);
      return updatedState;
    });
  } catch (error) {
    setAsyncState(currentState => {
      const updatedState = AsyncState.reject(currentState, error) as A;
      valueResolve(updatedState);
      console.error(`[react-async-stateful] Updating async state failed: ${error.toString()}`);
      return updatedState;
    });
  }

  // wait for react to have updated our state
  return await valuePromise;
};

export const updateAsyncStateElement = async <T extends K, A extends AsyncStateGroup<T, K>, K>(
  stateGroup: A,
  setAsyncState: Dispatch<SetStateAction<A>>,
  key: K,
  promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
  options?: UpdateAsyncStateOptions): Promise<A> => {
  let valueResolve: (state: A) => void = () => {
    throw new Error("This should never happen!");
  };
  const valuePromise = new Promise<A>(resolve => {
    valueResolve = resolve;
  });

  const promise =
          typeof promiseOrAsyncFn === "function"
            ? promiseOrAsyncFn()
            : promiseOrAsyncFn;

  const update = async () => {
    const updateElement = (elementOrUpdater: AsyncState<T> | ((prevElement: AsyncState<T>) => AsyncState<T>)) => setAsyncState((prevState => {
      const element = typeof elementOrUpdater === "function" ? elementOrUpdater(AsyncStateGroup.getOrCreateElement(prevState, key)) : elementOrUpdater;
      const updatedState = AsyncStateGroup.setElement(prevState, key, element) as A;
      if (updatedState.resolved || updatedState.rejected) {
        valueResolve(updatedState);
      }
      return updatedState;
    }));
    await updateAsyncState(updateElement, promise, options);
  };

  update();

  return valuePromise;
};
