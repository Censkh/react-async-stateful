import {
  ActionCreator,
  AsyncActionCreators,
  AsyncActionCreatorsWithThunk,
  AsyncActionHandler,
  AsyncStateAction,
  AsyncStateDispatch,
  AsyncStateThunk,
}                                      from "./ReduxTypes";
import AsyncState                      from "../AsyncState";
import * as Utils                      from "../Utils";
import {DefaultMeta, Meta, MetaUpdate} from "../Types";

const asyncStateReducer = (
  type: string,
  asyncState: AsyncState<any, any>,
  action: AsyncStateAction,
): AsyncState<any> => {
  switch (action.type) {
    case `${type}__RESET`:
      return AsyncState.reset(asyncState);
    case `${type}__SUBMIT`:
      return AsyncState.submit(asyncState);
    case `${type}__REFRESH`:
      return AsyncState.refresh(asyncState);
    case `${type}__PENDING`:
      return AsyncState.pending(asyncState);
    case `${type}__RESOLVED`:
      return AsyncState.resolve(asyncState, action.payload, action.extra);
    case `${type}__REJECTED`:
      return AsyncState.reject(asyncState, action.payload);
    default:
      return asyncState;
  }
};

export const createAsyncStateReducer = <T>(
  types: { [K in keyof T]?: string },
): ((state: T, action: AsyncStateAction) => T) => {
  return (state, action) => {
    let copy = null;
    const keys = Object.keys(types);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const type = (types as any)[key];

      const current = (state as any)[key];
      const updated = asyncStateReducer(type, current, action);
      if (current !== updated) {
        if (!copy) {
          copy = {...state};
        }
        (copy as any)[key] = updated;
      }
    }

    return copy || state;
  };
};

const actionCreator = <P = any, E = void>(type: string): ActionCreator<P, E> => {
  return Utils.assign(
    (payload: P, extra?: E): AsyncStateAction<P, E> => {
      return {
        type   : type,
        payload: payload,
        extra  : extra,
      };
    },
    {type: type},
  );
};

let lockIdCounter = 0;
const locks: Record<string, number> = {};

const actionCreatorsImpl = <S,
  P = any,
  V = any,
  M extends Meta = DefaultMeta,
  H extends undefined | AsyncActionHandler<S, P, V, M> = undefined>(
  type: string,
  handler?: H,
): H extends undefined
  ? AsyncActionCreators<P, V, M>
  : AsyncActionCreatorsWithThunk<P, V, M> => {
  const creators: AsyncActionCreators<P, V, M> = Utils.assign(
    (payload: P) => {
      return creators.submit(payload);
    },
    {
      type    : type,
      reset   : actionCreator<void>(`${type}__RESET`),
      submit  : actionCreator<P>(`${type}__SUBMIT`),
      refresh : actionCreator<P>(`${type}__REFRESH`),
      pending : actionCreator<void>(`${type}__PENDING`),
      resolved: actionCreator<V, MetaUpdate<M>>(`${type}__RESOLVED`),
      rejected: actionCreator<Error>(`${type}__REJECTED`),
    },
  );

  if (typeof handler === "function") {
    const injectEnhancedMethod = <C extends Record<string, any>>(
      name: string,
      creators: C,
      handler: AsyncActionHandler<S, P, V>,
    ): void => {
      const original = creators[name];
      (creators as any)[name] = (payload: P, extra: any) => {
        return async (dispatch: AsyncStateDispatch, getState: () => S): Promise<any> => {
          const operationId = lockIdCounter++;
          locks[type] = operationId;

          const dispatchIfStillCurrentOp = (action: AsyncStateAction | AsyncStateThunk) => {
            if (locks[type] === operationId) {
              dispatch(action);
            }
          };

          // wait 200ms to send the pending action incase we resolve first
          const pendingTimeout = setTimeout(
            () => dispatchIfStillCurrentOp(original(payload)),
            200,
          );

          const actionType = `${type}__${(name as string).toUpperCase()}`;
          const action = {type: actionType, payload: payload, extra};

          try {
            const result = await handler(action, dispatch, getState);
            return dispatchIfStillCurrentOp(creators.resolved(result));
          } catch (error) {
            console.error(`${actionType}:`, error);
            return dispatchIfStillCurrentOp(creators.rejected(error));
          } finally {
            clearTimeout(pendingTimeout);
          }
        };
      };
    };

    injectEnhancedMethod("submit", creators, handler as any);
    injectEnhancedMethod("refresh", creators, handler as any);
    return creators as any;
  }

  return creators as any;
};

export const asyncStateActionCreators = <S, P = any, V = any, M extends Meta = DefaultMeta>(
  type: string,
): AsyncActionCreators<P, V, M> => {
  return actionCreatorsImpl(type, undefined);
};

export const asyncStateActionCreatorsThunk = <S, P = any, V = any, M extends Meta = DefaultMeta>(
  type: string,
  handler?: AsyncActionHandler<S, P, V, M>,
): AsyncActionCreatorsWithThunk<P, V, M> => {
  return actionCreatorsImpl<S, P, V, M, AsyncActionHandler<S, P, V, M>>(
    type,
    handler,
  );
};
