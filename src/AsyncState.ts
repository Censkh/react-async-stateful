import {
  AsyncStateBase,
  AsyncStateCancelled,
  AsyncStatePending,
  AsyncStatePristine,
  AsyncStateRejected,
  AsyncStateResolved,
  AsyncStateSettled,
  AsyncStateStatus,
  MatchCases,
}                    from "./Types";
import {NotFunction} from "./Utils";

export interface CreateOptions {
  pending?: boolean;
}

export type CreateOptionsPending = CreateOptions & {
  pending: true;
};

const DEFAULT_STATE: AsyncStateBase<any> = {
  defaultValue: undefined,
  error       : undefined,
  pending     : false,
  pendingAt   : null,
  rejected    : false,
  rejectedAt  : null,
  resolved    : false,
  resolvedAt  : null,
  settled     : false,
  settledAt   : null,
  submitType  : undefined,
  value       : undefined,
  cancelled   : false,
  cancelledAt : null,
};

export default class AsyncState<T> implements AsyncStateBase<T> {
  readonly defaultValue: T | undefined = DEFAULT_STATE.defaultValue;
  readonly value: T | undefined = DEFAULT_STATE.value;

  readonly error = DEFAULT_STATE.error;
  readonly pending = DEFAULT_STATE.pending;
  readonly pendingAt = DEFAULT_STATE.pendingAt;
  readonly rejected = DEFAULT_STATE.rejected;
  readonly rejectedAt = DEFAULT_STATE.rejectedAt;
  readonly resolved = DEFAULT_STATE.resolved;
  readonly resolvedAt = DEFAULT_STATE.resolvedAt;
  readonly settled = DEFAULT_STATE.settled;
  readonly settledAt = DEFAULT_STATE.settledAt;
  readonly submitType = DEFAULT_STATE.submitType;
  readonly cancelled = DEFAULT_STATE.cancelled;
  readonly cancelledAt = DEFAULT_STATE.cancelledAt;


  private constructor() {
    // prevents new AsyncState()
  }

  static create<T>(
    defaultValue?: T,
    options: CreateOptionsPending | CreateOptions = {},
  ): AsyncState<T> {
    return Object.assign({}, DEFAULT_STATE, {
      defaultValue,
      value: defaultValue ?? undefined,
      pending: options.pending || false,
    });
  }

  static clone<T>(asyncState: AsyncState<T>): AsyncState<T> {
    return Object.assign({}, asyncState);
  }

  static reset<T>(asyncState: AsyncState<T>): AsyncState<T> {
    return AsyncState.create(asyncState.defaultValue);
  }

  static resolve<T>(asyncState: AsyncState<T>, value: T): AsyncState<T> {
    if (value === undefined) {
      throw new Error(
        "[react-async-stateful] Cannot resolve async asyncState to 'undefined', did you mean 'reset(asyncState)'?",
      );
    }

    return Object.assign({}, asyncState, {
      error     : undefined,
      cancelled : false,
      pending   : false,
      rejected  : false,
      resolved  : true,
      resolvedAt: Date.now(),
      settled   : true,
      settledAt : Date.now(),
      value     : value,
    });
  }

  static reject<T>(asyncState: AsyncState<T>, error: Error): AsyncState<T> {
    return Object.assign({}, asyncState, {
      error     : error,
      cancelled : false,
      pending   : false,
      rejected  : true,
      rejectedAt: Date.now(),
      settled   : true,
      settledAt : Date.now(),
      resolved  : false,
      value     : asyncState.defaultValue ?? undefined,
    });
  }

  static cancel<T>(asyncState: AsyncState<T>): AsyncState<T> {
    return Object.assign({}, asyncState, {
      error      : null,
      cancelled  : true,
      cancelledAt: Date.now(),
      pending    : false,
      rejected   : false,
      settled    : false,
      resolved   : false,
      value      : asyncState.defaultValue ?? undefined,
    });
  }

  static submit<T>(asyncState: AsyncState<T>): AsyncState<T> {
    return Object.assign({}, asyncState, {
      error     : null,
      cancelled : false,
      pending   : true,
      pendingAt : Date.now(),
      rejected  : false,
      resolved  : false,
      settled   : false,
      value     : asyncState.defaultValue ?? undefined,
      submitType: "submit",
    });
  }

  static refresh<T>(asyncState: AsyncState<T>): AsyncState<T> {
    return Object.assign({}, asyncState, {
      cancelled : false,
      pending   : true,
      pendingAt : Date.now(),
      settled   : false,
      submitType: "refresh",
    });
  }

  static getStatus<T>(asyncState: AsyncState<T>): AsyncStateStatus {
    if (AsyncState.isPristine(asyncState)) return "pristine";
    if (asyncState.pending && asyncState.submitType === "refresh") {
      return "refreshing";
    }
    if (asyncState.pending && asyncState.submitType === "submit") {
      return "submitting";
    }
    if (asyncState.resolved) {
      return "resolved";
    }
    if (asyncState.rejected) {
      return "rejected";
    }
    return "invalid";
  }

  static isRejected<T>(asyncState: AsyncState<T>): asyncState is AsyncStateRejected<T> {
    return asyncState.rejected;
  }

  static isPending<T>(asyncState: AsyncState<T>): asyncState is AsyncStatePending<T> {
    return asyncState.pending;
  }

  static isResolved<T>(asyncState: AsyncState<T>): asyncState is AsyncStateResolved<T> {
    return asyncState.resolved;
  }

  static isCancelled<T>(asyncState: AsyncState<T>): asyncState is AsyncStateCancelled<T> {
    return asyncState.cancelled;
  }

  static isPristine<T>(asyncState: AsyncState<T>): asyncState is AsyncStatePristine<T> {
    return !AsyncState.isRejected(asyncState) && !AsyncState.isResolved(asyncState) && !AsyncState.isPending(asyncState);
  }

  static isSettled<T>(asyncState: AsyncState<T>): asyncState is AsyncStateSettled<T> {
    return asyncState.settled;
  }

  /**
   * @description Patch the value of a **resolved** asyncState.
   *
   * @throws {Error} if `asyncState` is not resolved
   */
  static patch<T>(asyncState: AsyncState<T>, func: (value: T) => T): AsyncState<T> {
    if (AsyncState.isResolved(asyncState)) {
      return Object.assign({}, asyncState, {
        value: func(asyncState.value),
      });
    }
    throw new Error(
      `[react-async-stateful] Can only patch 'resolved' states, asyncState was ${AsyncState.getStatus(asyncState)}`,
    );
  }

  static match<T, V extends NotFunction>(asyncState: AsyncState<T>, cases: MatchCases<T, V>, defaultValue: V): V {
    const status = AsyncState.getStatus(asyncState);
    if (status in cases) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = cases[status] as any;
      if (status === "resolved") {
        return typeof value === "function" ? value(asyncState.value) : value;
      } else if (status === "rejected") {
        return typeof value === "function" ? value(asyncState.error) : value;
      }
      return value;
    }
    return defaultValue;
  }
}
