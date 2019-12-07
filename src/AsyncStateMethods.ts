import {
    AsyncStateRefreshing,
    AsyncStateRejected,
    AsyncStateResolved,
    AsyncStateSubmitting,
    AsyncState, AsyncStatePristine, AsyncStatePending
} from "./AsyncStateTypes";

export const resolve = <T>(state: AsyncState<T>, value: T): AsyncStateResolved<T> => {
    if (value === undefined) {
        throw new Error("Cannot resolve async state to 'undefined', did you mean 'reset(state)'?");
    }

    return {
        ...state,
        error: undefined,
        pending: false,
        pristine: false,
        rejected: false,
        resolved: true,
        resolvedAt: Date.now(),
        value: value
    }
};

export const reject = <T>(state: AsyncState<T>, error: Error): AsyncStateRejected<T> => {
    return {
        ...state,
        error: error,
        pending: false,
        pristine: false,
        rejected: true,
        rejectedAt: Date.now(),
        resolved: false,
        value: state.defaultValue ?? undefined,
    }
};

export const submit = <T>(state: AsyncState<T>): AsyncStateSubmitting<T> => {
    return {
        ...state,
        pending: true,
        pendingAt: Date.now(),
        pristine: false,
        rejected: false,
        resolved: false,
        value: state.defaultValue ?? undefined,
        submitType: "submit"
    };
};

export const refresh = <T>(state: AsyncState<T>): AsyncStateRefreshing<T> => {
    return {
        ...state,
        pristine: false,
        pending: true,
        pendingAt: Date.now(),
        submitType: "refresh"
    };
};

export const reset = <T>(state: AsyncState<T>): AsyncStatePristine<T> => {
    return {
        ...state,
        ...create(state.defaultValue)
    };
};

export const create = <T>(defaultValue?: T): AsyncStatePristine<T> => {
    return Object.freeze({
        defaultValue: defaultValue,
        pristine: true,
        resolved: false,
        resolvedAt: null,
        rejected: false,
        rejectedAt: null,
        pending: false,
        pendingAt: null,
        value: defaultValue ?? undefined,
        error: undefined,
        submitType: undefined,
    });
};

export const isRejected = <T>(state: AsyncState<T>): state is AsyncStateRejected<T> => {
    return state.rejected;
};

export const isPending = <T>(state: AsyncState<T>): state is AsyncStatePending<T> => {
    return state.pending;
};

export const isResolved = <T>(state: AsyncState<T>): state is AsyncStateResolved<T> => {
    return state.resolved;
};

export const isPristine = <T>(state: AsyncState<T>): state is AsyncStateRejected<T> => {
    return state.pristine;
};