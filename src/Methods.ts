import {
  AsyncState,
  AsyncStatePending,
  AsyncStatePristine,
  AsyncStateRefreshing,
  AsyncStateRejected,
  AsyncStateResolved,
  AsyncStateSettled,
  AsyncStateStatus,
  AsyncStateSubmitting,
  MatchCases,
  StatefulPromise,
} from "./Types";
import { NotFunction } from "./Utils";

export const getStatus = <T>(state: AsyncState<T>): AsyncStateStatus => {
  if (state.pristine) return "pristine";
  if (state.pending && state.submitType === "refresh") {
    return "refreshing";
  }
  if (state.pending && state.submitType === "submit") {
    return "submitting";
  }
  if (state.resolved) {
    return "resolved";
  }
  if (state.rejected) {
    return "rejected";
  }
  return "invalid";
};

export const resolve = <T>(
  state: AsyncState<T>,
  value: T,
): AsyncStateResolved<T> => {
  if (value === undefined) {
    throw new Error(
      "Cannot resolve async state to 'undefined', did you mean 'reset(state)'?",
    );
  }

  return {
    ...state,
    error: undefined,
    pending: false,
    pristine: false,
    rejected: false,
    resolved: true,
    resolvedAt: Date.now(),
    settled: true,
    settledAt: Date.now(),
    value: value,
  };
};

export const reject = <T>(
  state: AsyncState<T>,
  error: Error,
): AsyncStateRejected<T> => {
  return {
    ...state,
    error: error,
    pending: false,
    pristine: false,
    rejected: true,
    rejectedAt: Date.now(),
    settled: true,
    settledAt: Date.now(),
    resolved: false,
    value: state.defaultValue ?? undefined,
  };
};

export const submit = <T>(state: AsyncState<T>): AsyncStateSubmitting<T> => {
  return {
    ...state,
    pending: true,
    pendingAt: Date.now(),
    pristine: false,
    rejected: false,
    resolved: false,
    settled: false,
    value: state.defaultValue ?? undefined,
    submitType: "submit",
  };
};

export const refresh = <T>(state: AsyncState<T>): AsyncStateRefreshing<T> => {
  return {
    ...state,
    pristine: false,
    pending: true,
    pendingAt: Date.now(),
    settled: false,
    submitType: "refresh",
  };
};

interface CreateOptions {
  pending?: boolean;
}

type CreateOptionsPending = CreateOptions & {
  pending: true;
};

export const create = <T>(
  defaultValue?: T,
  options: CreateOptionsPending | CreateOptions = {},
): typeof options extends CreateOptionsPending
  ? AsyncStatePending<T>
  : AsyncStatePristine<T> => {
  const state = {
    defaultValue: defaultValue,
    pristine: true,
    resolved: false,
    resolvedAt: null,
    rejected: false,
    rejectedAt: null,
    pending: false,
    pendingAt: null,
    settled: false,
    settledAt: null,
    value: defaultValue ?? undefined,
    error: undefined,
    submitType: undefined,
  };
  if (options.pending) {
    return submit(state) as any;
  }

  return state as any;
};

export const clone = <T>(state: AsyncState<T>): AsyncState<T> => {
  return { ...state };
};

export const reset = <T>(state: AsyncState<T>): AsyncStatePristine<T> => {
  return {
    ...state,
    ...create(state.defaultValue),
  };
};

export const isRejected = <T>(
  state: AsyncState<T>,
): state is AsyncStateRejected<T> => {
  return state.rejected;
};

export const isPending = <T>(
  state: AsyncState<T>,
): state is AsyncStatePending<T> => {
  return state.pending;
};

export const isResolved = <T>(
  state: AsyncState<T>,
): state is AsyncStateResolved<T> => {
  return state.resolved;
};

export const isPristine = <T>(
  state: AsyncState<T>,
): state is AsyncStateRejected<T> => {
  return state.pristine;
};

export const isSettled = <T>(
  state: AsyncState<T>,
): state is AsyncStateSettled<T> => {
  return state.settled;
};

/**
 * @description Patch the value of a **resolved** state.
 *
 * @throws {Error} if `state` is not resolved
 */
export const patch = <T>(
  state: AsyncStateResolved<T>,
  patcher: (value: T) => T,
): AsyncStateResolved<T> => {
  if (isResolved(state)) {
    return {
      ...state,
      value: patcher(state.value),
    };
  }
  throw new Error(
    `Can only patch 'resolved' states, this state was ${getStatus(state)}`,
  );
};

export const match = <T, V extends NotFunction>(
  state: AsyncState<T>,
  cases: MatchCases<T, V>,
  defaultValue: V,
): V => {
  const status = getStatus(state);
  if (status in cases) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = cases[status] as any;
    if (status === "resolved") {
      return typeof value === "function" ? value(state.value) : value;
    } else if (status === "rejected") {
      return typeof value === "function" ? value(state.error) : value;
    }
    return value;
  }
  return defaultValue;
};

export const toStateful = <T>(promise: Promise<T>): StatefulPromise<T> => {
  const stateful: StatefulPromise<T> = Object.assign(
    promise,
    create<T>(undefined, { pending: true }),
  ) as any;
  return stateful.then(
    (data) => {
      Object.assign(stateful, resolve(stateful, data));
      return data;
    },
    (error: Error) => {
      Object.assign(stateful, reject(stateful, error));
      throw error;
    },
  );
};
