import {Dispatch, SetStateAction, useMemo, useState} from "react";
import {AsyncState} from "./AsyncStateTypes";
import * as AsyncStateMethods from "./AsyncStateMethods";

export type PromiseOrAsyncFn<T> = Promise<T> | (() => Promise<T>);

interface UpdateAsyncStateOptions {
    refresh?: boolean;
}

export type UpdateAsyncStateFn<T> = (promiseOrAsyncFn: PromiseOrAsyncFn<T>, options?: UpdateAsyncStateOptions) => Promise<AsyncState<T>>;

export type UseAsyncStateResult<T> = [AsyncState<T>, Dispatch<SetStateAction<AsyncState<T>>>, UpdateAsyncStateFn<T>];

export function useAsyncState<T>(defaultValue?: T): UseAsyncStateResult<T> {
    const [asyncState, setAsyncState] = useState<AsyncState<T>>(AsyncStateMethods.create(defaultValue));
    const updateFn = useMemo<UpdateAsyncStateFn<T>>(() => createUpdateFn(asyncState, setAsyncState), [asyncState]);

    return [asyncState, setAsyncState, updateFn];
}

const createUpdateFn = <T>(asyncState: AsyncState<T>, setAsyncState: Dispatch<SetStateAction<AsyncState<T>>>): UpdateAsyncStateFn<T> => {
    return async (promiseOrAsyncFn, options) => {
        if (options?.refresh) {
            setAsyncState(currentState => AsyncStateMethods.refresh(currentState));
        } else {
            setAsyncState(currentState => AsyncStateMethods.submit(currentState));
        }

        let valueResolve : (state: AsyncState<T>) => void;
        let valuePromise = new Promise<AsyncState<T>>(resolve => valueResolve = resolve);

        try {
            const promise = typeof promiseOrAsyncFn === "function" ? promiseOrAsyncFn() : promiseOrAsyncFn;
            if (typeof promise.then !== "function") {
                throw new Error(typeof promiseOrAsyncFn === "function" ?
                    "Function provided did not return a promise" :
                    "First argument was not a promise or an async function")
            }

            const value = await promise;
            if (value === undefined) {
                throw new Error("Update state resolution cannot resolve to 'undefined', did you miss a return in your promise?");
            }

            setAsyncState(currentState => {
                const updatedState = AsyncStateMethods.resolve(currentState, value);
                valueResolve(updatedState);
                return updatedState;
            });
        } catch (error) {
            setAsyncState(currentState => {
                const updatedState = AsyncStateMethods.reject(currentState, error);
                valueResolve(updatedState);
                return updatedState;
            });
        }

        // wait for react to have updated our state
        return await valuePromise;
    };
};