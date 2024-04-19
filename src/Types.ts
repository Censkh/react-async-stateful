import type AsyncState from "./AsyncState";

export type DefaultMeta = {};

export type Meta = Record<string, any>;

export type MetaUpdate<M extends Meta> = M | ((meta: M | null) => M);

export type MetaOf<T extends AsyncState<any, any>> = T extends AsyncState<any, infer M> ? M : never;

export type PromiseOrAsyncFunction<T> = Promise<T> | (() => Promise<T>);

export type AsyncStateSubmitType = "submit" | "refresh";

export interface AsyncStateBase<T, M extends Meta = DefaultMeta> {
  readonly defaultValue: T | undefined;
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
  readonly cancelled: boolean;
  readonly cancelledAt: number | null;
  readonly meta: M | null;
}

export interface AsyncStateSettled<T, M extends Meta = DefaultMeta> extends AsyncState<T, M> {
  readonly settled: true;
  readonly settledAt: number;
}

export interface AsyncStateResolved<T, M extends Meta = DefaultMeta> extends AsyncStateSettled<T, M> {
  readonly resolved: true;
  readonly resolvedAt: number;
  readonly rejected: false;
  readonly pending: false;
  readonly value: T;
  readonly error: undefined;
}

export interface AsyncStateRejected<T, M extends Meta = DefaultMeta> extends AsyncStateSettled<T, M> {
  readonly resolved: false;
  readonly rejected: true;
  readonly rejectedAt: number;
  readonly pending: false;
  readonly error: Error;
}

export interface AsyncStatePending<T, M extends Meta = DefaultMeta> extends AsyncState<T, M> {
  readonly pending: true;
  readonly pendingAt: number;
  readonly submitType: AsyncStateSubmitType;
  readonly settled: false;
}

export interface AsyncStateCancelled<T, M extends Meta = DefaultMeta> extends AsyncState<T, M> {
  readonly cancelled: true;
  readonly cancelledAt: number;
}

export interface AsyncStateSubmitting<T, M extends Meta = DefaultMeta> extends AsyncStatePending<T, M> {
  readonly resolved: false;
  readonly rejected: false;
  readonly submitType: "submit";
}

export interface AsyncStateRefreshing<T, M extends Meta = DefaultMeta> extends AsyncStatePending<T, M> {
  readonly resolved: boolean;
  readonly rejected: boolean;
  readonly submitType: "refresh";
}

export interface AsyncStatePristine<T, M extends Meta = DefaultMeta> extends AsyncState<T, M> {
  readonly pending: false;
  readonly resolved: false;
  readonly rejected: false;
  readonly settled: false;
  readonly error: undefined;
  readonly submitType: undefined;
}

export type AsyncStateStatus = "pristine" | "submitting" | "refreshing" | "rejected" | "resolved" | "invalid";

export type MatchCases<T, V> = {
  [K in AsyncStateStatus]?: K extends "resolved"
    ? V | ((value: T) => V)
    : K extends "rejected"
      ? V | ((error: Error) => V)
      : V;
};
