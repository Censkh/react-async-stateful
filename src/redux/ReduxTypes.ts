export type Thunk = (dispatch: Dispatch, getState: () => any) => void;

export type Action<P = any> = {
  type: string;
  payload: P;
};

export interface ActionCreator<P = any> {
  (payload: P): Action<P>;

  type: string;
}

export interface AsyncActionCreators<P = any, V = any> {
  (payload: P): void;

  reset: ActionCreator<void>;

  submit: ActionCreator<P>;

  refresh: ActionCreator<P>;

  resolved: ActionCreator<V>;

  rejected: ActionCreator<Error>;

  type: string;
}

export type Dispatch = (action: Action | Thunk) => Promise<any>;

export interface AsyncActionWithThunk<P = any, V = any> {
  (payload: P): Thunk;

  type: string;
}

export interface AsyncActionCreatorsWithThunk<P = any, V = any>
  extends Omit<AsyncActionCreators<P, V>, "submit" | "refresh"> {
  (payload: P): Thunk;

  submit: AsyncActionWithThunk<P, V>;

  refresh: AsyncActionWithThunk<P, V>;
}

export type AsyncActionHandler<S, P, V> = (
  action: Action<P>,
  dispatch: Dispatch,
  getState: () => S,
) => Promise<V>;

export type TypedReducer<S> = (state: S, action: Action) => S;
