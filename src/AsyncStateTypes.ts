export type AsyncStateSubmitType = "submit" | "refresh";

export interface AsyncState<T> {
    readonly defaultValue: T | undefined;
    readonly pristine: boolean;
    readonly pending: boolean;
    readonly pendingAt: number | null;
    readonly resolved: boolean;
    readonly resolvedAt: number | null;
    readonly rejected: boolean;
    readonly rejectedAt: number | null;
    readonly value: T | undefined;
    readonly error: Error | undefined;
    readonly submitType: AsyncStateSubmitType | undefined;
}

export interface AsyncStateResolved<T> extends AsyncState<T> {
    readonly pristine: false;
    readonly resolved: true;
    readonly resolvedAt: number;
    readonly rejected: false;
    readonly pending: false;
    readonly value: T;
    readonly error: undefined;
}

export interface AsyncStateRejected<T> extends AsyncState<T> {
    readonly pristine: false;
    readonly resolved: false;
    readonly rejected: true;
    readonly rejectedAt: number;
    readonly pending: false;
    readonly error: Error;
}

export interface AsyncStateSubmitting<T> extends AsyncState<T> {
    readonly pristine: false;
    readonly resolved: false;
    readonly rejected: false;
    readonly pending: true;
    readonly pendingAt: number;
    readonly submitType: "submit";
}

export interface AsyncStateRefreshing<T> extends AsyncState<T> {
    readonly pristine: false;
    readonly resolved: boolean;
    readonly rejected: boolean;
    readonly pending: true;
    readonly pendingAt: number;
    readonly submitType: "refresh";
}

export interface AsyncStatePristine<T> extends  AsyncState<T> {
    readonly pristine: true;
    readonly pending: false;
    readonly pendingAt: null;
    readonly resolved: false;
    readonly resolvedAt: null;
    readonly rejected: false;
    readonly rejectedAt: null;
    readonly error: undefined;
    readonly submitType: undefined;
}

export interface AsyncStatePending<T> extends AsyncState<T> {
    readonly pending: true;
    readonly pendingAt: number;
    readonly submitType: AsyncStateSubmitType;
    readonly pristine: false;
}