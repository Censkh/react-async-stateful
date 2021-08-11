import {DefaultMeta, Meta, MetaUpdate} from "../Types";

export type AsyncStateThunk = (dispatch: AsyncStateDispatch, getState: () => any) => void;

export interface Action<P = any> {
  type: string;
  payload: P;
}

export type AsyncStateAction<P = any, E = void> = {
  type: string;
  payload: P;
  extra?: E | undefined;
};

export interface ActionCreator<P = any, E = void> {
  (payload: P, extra?: E): AsyncStateAction<P, E>;

  type: string;
}

export interface AsyncActionCreators<P = any, V = any, M extends Meta = DefaultMeta> {
  (payload: P): void;

  reset: ActionCreator<void>;

  submit: ActionCreator<P>;

  refresh: ActionCreator<P>;

  resolved: ActionCreator<V, MetaUpdate<M>>;

  rejected: ActionCreator<Error>;

  pending: ActionCreator<void>;

  type: string;
}

export type AsyncStateDispatch = (action: Action | AsyncStateAction<any, any> | AsyncStateThunk) => Promise<any>;

export interface AsyncActionWithThunk<P = any, V = any, M extends Meta = DefaultMeta> {
  (payload: P): AsyncStateThunk;

  type: string;
}

export interface AsyncActionCreatorsWithThunk<P = any, V = any, M extends Meta = DefaultMeta>
  extends Omit<AsyncActionCreators<P, V, M>, "submit" | "refresh"> {
  (payload: P): AsyncStateThunk;

  submit: AsyncActionWithThunk<P, V, M>;

  refresh: AsyncActionWithThunk<P, V, M>;
}

export type AsyncActionHandler<S, P, V, M extends Meta = DefaultMeta> = (
  action: AsyncStateAction<P, M>,
  dispatch: AsyncStateDispatch,
  getState: () => S,
) => Promise<V>;
