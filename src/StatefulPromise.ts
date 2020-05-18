import {AsyncStateBase} from "./Types";
import AsyncState       from "./AsyncState";

export interface StatefulPromise<T> extends Promise<T>, AsyncStateBase<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): StatefulPromise<TResult1 | TResult2>;

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): StatefulPromise<T | TResult>;
}

export const toStateful = <T>(promise: Promise<T>): StatefulPromise<T> => {
    const stateful: StatefulPromise<T> = Object.assign(
        promise,
        AsyncState.create<T>(undefined, { pending: true }),
    ) as any;
    return stateful.then(
        (data) => {
            Object.assign(stateful, AsyncState.resolve(stateful, data));
            return data;
        },
        (error: Error) => {
            Object.assign(stateful, AsyncState.reject(stateful, error));
            throw error;
        },
    );
};
