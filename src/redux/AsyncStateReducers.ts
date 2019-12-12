import * as AsyncStateMethods from "../AsyncStateMethods";
import {AsyncState} from "../AsyncStateTypes";

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

const asyncStateReducer = (type: string, asyncState: AsyncState<any>, action: Action): AsyncState<any> => {
    switch (action.type) {
        case `${type}__RESET`:
            asyncState = AsyncStateMethods.reset(asyncState);
            break;
        case `${type}__SUBMIT`:
            asyncState = AsyncStateMethods.submit(asyncState);
            break;
        case `${type}__REFRESH`:
            asyncState = AsyncStateMethods.refresh(asyncState);
            break;
        case `${type}__RESOLVED`:
            asyncState = AsyncStateMethods.resolve(asyncState, action.payload);
            break;
        case `${type}__REJECTED`:
            asyncState = AsyncStateMethods.reject(asyncState, action.payload);
            break;
        default:
            return asyncState;
    }

    return asyncState;
};

export const asyncStateReducers = <S extends Record<string, any>, A>(state: S, action: Action, types: AsyncStateActionMap<S>): S => {
    const copy: any = {...state};
    const keys = Object.keys(types);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i] as keyof S;
        const type = types[key];
        copy[key] = asyncStateReducer(type as string, state[key], action);
    }

    return copy;
};

export interface AsyncActionCreators<T extends string = string, P = any, V = any> {
    (payload: P): void;

    reset: ActionCreator<string, void>;

    submit: ActionCreator<string, P>;

    refresh: ActionCreator<string, P>;

    resolved: ActionCreator<string, V>;

    rejected: ActionCreator<string, Error>;

    type: T;
}

type Dispatch = (action: Action) => void | Promise<any>;

interface AsyncActionThunk<T = string, P = any, V = any> {
    (payload: P): ((dispatch: Dispatch, getState: Function) => any);

    type: T;
}

export interface AsyncActionCreatorsThunk<T extends string = string, P = any, V = any> extends Omit<AsyncActionCreators<T, P, V>, "submit" | "refresh"> {
    submit: AsyncActionThunk<string, P, V>;

    refresh: AsyncActionThunk<string, P, V>;
}

const actionCreator = <T extends string = string, P = any>(type: T): ActionCreator<T, P> => {
    return Object.assign((payload: P): Action<T, P> => {
        return {
            type,
            payload,
        };
    }, {type: type});
};

export type AsyncActionHandler<S, P, V> = (action: Action<string, P>, dispatch: Dispatch, getState: () => S) => Promise<V>;

const actionCreatorsImpl = <S, P = any, V = any, H extends undefined | AsyncActionHandler<S, P, V> = undefined>(type: string, handler: H):
    (H extends undefined ? AsyncActionCreators<string, P, V> : AsyncActionCreatorsThunk<string, P, V>) => {
    const creators: AsyncActionCreators<string, P, V> = Object.assign((payload: P) => {
        return creators.submit(payload);
    }, {
        type    : type,
        reset   : actionCreator<string, void>(`${type}__RESET`),
        submit  : actionCreator<string, P>(`${type}__SUBMIT`),
        refresh : actionCreator<string, P>(`${type}__REFRESH`),
        resolved: actionCreator<string, V>(`${type}__RESOLVED`),
        rejected: actionCreator<string, Error>(`${type}__REJECTED`),
    });

    if (typeof handler === "function") {
        const injectEnhancedMethod = <C extends Record<string, any>>(name: string, creators: C, handler: AsyncActionHandler<S, P, V>): void => {
            const original = creators[name];
            (creators as any)[name] = (payload: P) => {
                return async (dispatch: Dispatch, getState: () => S): Promise<any> => {
                    dispatch(original(payload));

                    const actionType = `${type}__${(name as string).toUpperCase()}}`;
                    const action = {type: actionType, payload: payload};

                    try {
                        const result = await handler(action, dispatch, getState);
                        return dispatch(creators.resolved(result));
                    } catch (error) {
                        console.error(`${actionType}:`, error);
                        return dispatch(creators.rejected(error));
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

export const actionCreators = <S, P = any, V = any>(type: string): AsyncActionCreators<string, P, V> => {
    return actionCreatorsImpl(type, undefined);
};

export const actionCreatorsThunk = <S, P = any, V = any>(type: string, handler: AsyncActionHandler<S, P, V>): AsyncActionCreatorsThunk<string, P, V> => {
    return actionCreatorsImpl<S, P, V, AsyncActionHandler<S, P, V>>(type, handler);
};