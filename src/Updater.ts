import {Dispatch, SetStateAction} from "react";
import AsyncState                 from "./AsyncState";
import {PromiseOrAsyncFunction}   from "./Types";
import AsyncStateGroup            from "./AsyncStateGroup";

export interface UpdateAsyncStateOptions {
  /** do not reset value when submitting */
  refresh?: boolean;
  /** minimum time to stay in pending state, will delay resolve until `minimumPending` ms */
  minimumPending?: number;
  /** if update takes longer than `timeout` ms: reject */
  timeout?: number;

  errorDebug?: boolean,
}

export const updateAsyncState = async <T, A extends AsyncState<T, any>>(setAsyncState: Dispatch<SetStateAction<A>>,
                                                                        promiseOrAsyncFn: PromiseOrAsyncFunction<T>,
                                                                        options?: UpdateAsyncStateOptions): Promise<A> => {
  let pendingAt: number | null = null;

  setAsyncState(currentState => {
    const newState = options?.refresh ? AsyncState.refresh(currentState) : AsyncState.submit(currentState);
    pendingAt = newState.pendingAt;
    return newState as A;
  });

  let timeoutId: any = undefined;
  let resolved = false;
  let possiblyResolve: (stateUpdater: (state: AsyncState<T>) => AsyncState<T>) => boolean = () => {
    throw new Error("[react-async-stateful] This should never happen!");
    return false;
  };

  const valuePromise = new Promise<A>(resolve => {
    possiblyResolve = (stateUpdater) => {
      if (resolved) {
        return false;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolved = true;
      setAsyncState(currentState => {
        if (currentState.pendingAt !== pendingAt) {
          // this state has been updated again since we started -- we are no longer in charge of resolving this state and shouldn't update it
          return currentState;
        }

        const updatedState = stateUpdater(currentState) as A;
        resolve(updatedState);
        return updatedState;
      });
      return true;
    };
  });

  if (options?.timeout) {
    timeoutId = setTimeout(() => {
      const error = new Error(`[react-async-stateful] Async update timed out, took longer than ${options.timeout}ms`);
      if (possiblyResolve(state => AsyncState.reject(state, error))) {
        console.error(error);
      }
    }, options.timeout);
  }

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

    possiblyResolve(state => AsyncState.resolve(state, value));
  } catch (error) {
    if (possiblyResolve(state => AsyncState.reject(state, error))) {
      console.error(`[react-async-stateful] Updating async state failed: ${error.stack || error.message}`);

      if (options?.errorDebug) {
        console.error(`[react-async-stateful] Error debug: ${JSON.stringify(error, null, 2)}`);
      }
    }
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
