export type AsyncStateActionMap<S> = {
    [K in keyof S]?: string;
}

export type Action<T extends string = string, P = any> = {
    type: T;
    payload: P;
}

export interface ActionCreator<T extends string = string, P = any> {
    (payload: P): Action<T, P>;

    type: T;
}

export interface AsyncActionCreators<T extends string = string, P = any, V = any> {
    (payload: P): void;

    reset: ActionCreator<string, void>;

    submit: ActionCreator<string, P>;

    refresh: ActionCreator<string, P>;

    resolved: ActionCreator<string, V>;

    rejected: ActionCreator<string, Error>;

    type: T;
}

export type Dispatch = (action: Action) => void | Promise<any>;

export interface AsyncActionThunk<T = string, P = any, V = any> {
    (payload: P): ((dispatch: Dispatch, getState: Function) => any);

    type: T;
}

export interface AsyncActionCreatorsThunk<T extends string = string, P = any, V = any> extends Omit<AsyncActionCreators<T, P, V>, "submit" | "refresh"> {
    submit: AsyncActionThunk<string, P, V>;

    refresh: AsyncActionThunk<string, P, V>;
}

export type AsyncActionHandler<S, P, V> = (action: Action<string, P>, dispatch: Dispatch, getState: () => S) => Promise<V>;