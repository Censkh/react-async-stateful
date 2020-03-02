import AsyncState from "./AsyncState";

export type AsyncStateSubmitType = "submit" | "refresh";

export enum AsyncStateActionType {
  Reset = "reset",
  Submit = "submit",
  Refresh = "submit",
  Reject = "reject",
  Resolve = "resolve",
}

export interface AsyncStateBase<T> {
  readonly defaultValue: T | undefined;
  readonly pristine: boolean;
  readonly pending: boolean;
  readonly pendingAt: number | null;
  readonly resolved: boolean;
  readonly resolvedAt: number | null;
  readonly rejected: boolean;
  readonly rejectedAt: number | null;
  readonly settled: boolean;
  readonly settledAt: number | null;
  readonly value: T | undefined;
  readonly error: Error | undefined;
  readonly submitType: AsyncStateSubmitType | undefined;
}

export interface AsyncStateSettled<T> extends AsyncState<T> {
  readonly pristine: false;
  readonly settled: true;
  readonly settledAt: number;
}

export interface AsyncStateResolved<T> extends AsyncStateSettled<T> {
  readonly resolved: true;
  readonly resolvedAt: number;
  readonly rejected: false;
  readonly pending: false;
  readonly value: T;
  readonly error: undefined;
}

export interface AsyncStateRejected<T> extends AsyncStateSettled<T> {
  readonly resolved: false;
  readonly rejected: true;
  readonly rejectedAt: number;
  readonly pending: false;
  readonly error: Error;
}

export interface AsyncStatePending<T> extends AsyncState<T> {
  readonly pristine: false;
  readonly pending: true;
  readonly pendingAt: number;
  readonly submitType: AsyncStateSubmitType;
  readonly settled: false;
}

export interface AsyncStateSubmitting<T> extends AsyncStatePending<T> {
  readonly resolved: false;
  readonly rejected: false;
  readonly submitType: "submit";
}

export interface AsyncStateRefreshing<T> extends AsyncStatePending<T> {
  readonly resolved: boolean;
  readonly rejected: boolean;
  readonly submitType: "refresh";
}

export interface AsyncStatePristine<T> extends AsyncState<T> {
  readonly pristine: true;
  readonly pending: false;
  readonly pendingAt: null;
  readonly resolved: false;
  readonly resolvedAt: null;
  readonly rejected: false;
  readonly rejectedAt: null;
  readonly settled: false;
  readonly settledAt: null;
  readonly error: undefined;
  readonly submitType: undefined;
}

export type AsyncStateStatus =
  | "pristine"
  | "submitting"
  | "refreshing"
  | "rejected"
  | "resolved"
  | "invalid";

export type MatchCases<T, V> = {
  [K in AsyncStateStatus]?: K extends "resolved"
    ? V | ((value: T) => V)
    : K extends "rejected"
      ? V | ((error: Error) => V)
      : V;
};

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
