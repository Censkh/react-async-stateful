import * as AsyncStateMethods from "../Methods";
import { AsyncState } from "../Types";

import {
  Action,
  ActionCreator,
  AsyncActionCreators,
  AsyncActionCreatorsWithThunk,
  AsyncActionHandler,
  Dispatch,
  Thunk
} from "./ReduxTypes";

const asyncStateReducer = (
    type: string,
    asyncState: AsyncState<any>,
    action: Action
): AsyncState<any> => {
  switch (action.type) {
    case `${type}__RESET`:
      return AsyncStateMethods.reset(asyncState);
    case `${type}__SUBMIT`:
      return AsyncStateMethods.submit(asyncState);
    case `${type}__REFRESH`:
      return AsyncStateMethods.refresh(asyncState);
    case `${type}__RESOLVED`:
      return AsyncStateMethods.resolve(asyncState, action.payload);
    case `${type}__REJECTED`:
      return AsyncStateMethods.reject(asyncState, action.payload);
    default:
      return asyncState;
  }
};

export const createAsyncStateReducer = <T>(
    types: { [K in keyof T]?: string },
): ((state: T, action: Action) => T) => {
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
          copy = { ...state };
        }
        (copy as any)[key] = updated;
      }
    }

    return copy || state;
  };
};

const actionCreator = <P = any>(type: string): ActionCreator<P> => {
  return Object.assign(
    (payload: P): Action<P> => {
      return {
        type,
        payload,
      };
    },
    { type: type },
  );
};

let lockIdCounter = 0;
const locks: Record<string, number> = {};

const actionCreatorsImpl = <
  S,
  P = any,
  V = any,
  H extends undefined | AsyncActionHandler<S, P, V> = undefined
>(
  type: string,
  handler: H
): H extends undefined
  ? AsyncActionCreators<P, V>
  : AsyncActionCreatorsWithThunk<P, V> => {
  const creators: AsyncActionCreators<P, V> = Object.assign(
    (payload: P) => {
      return creators.submit(payload);
    },
    {
      type: type,
      reset: actionCreator<void>(`${type}__RESET`),
      submit: actionCreator<P>(`${type}__SUBMIT`),
      refresh: actionCreator<P>(`${type}__REFRESH`),
      resolved: actionCreator<V>(`${type}__RESOLVED`),
      rejected: actionCreator<Error>(`${type}__REJECTED`)
    }
  );

  if (typeof handler === "function") {
    const injectEnhancedMethod = <C extends Record<string, any>>(
      name: string,
      creators: C,
      handler: AsyncActionHandler<S, P, V>
    ): void => {
      const original = creators[name];
      (creators as any)[name] = (payload: P) => {
        return async (dispatch: Dispatch, getState: () => S): Promise<any> => {
          const operationId = lockIdCounter++;
          locks[type] = operationId;

          const dispatchIfStillCurrentOp = (action: Action | Thunk) => {
            if (locks[type] === operationId) {
              dispatch(action);
            }
          };

          // wait 200ms to send the pending action incase we resolve first
          const pendingTimeout = setTimeout(
            () => dispatchIfStillCurrentOp(original(payload)),
            200
          );

          const actionType = `${type}__${(name as string).toUpperCase()}`;
          const action = { type: actionType, payload: payload };

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

export const actionCreators = <S, P = any, V = any>(
  type: string
): AsyncActionCreators<P, V> => {
  return actionCreatorsImpl(type, undefined);
};

export const actionCreatorsThunk = <S, P = any, V = any>(
  type: string,
  handler: AsyncActionHandler<S, P, V>
): AsyncActionCreatorsWithThunk<P, V> => {
  return actionCreatorsImpl<S, P, V, AsyncActionHandler<S, P, V>>(
    type,
    handler
  );
};
