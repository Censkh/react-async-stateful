import type {
  AsyncStateBase,
  AsyncStateCancelled,
  AsyncStatePending,
  AsyncStatePristine,
  AsyncStateRejected,
  AsyncStateResolved,
  AsyncStateSettled,
  AsyncStateStatus,
  DefaultMeta,
  MatchCases,
  Meta,
  MetaUpdate,
} from "./Types";
import { ASYNC_STATE_SYMBOL, type NotFunction } from "./Utils";
import * as Utils from "./Utils";

export interface CreateOptions<M extends Meta = DefaultMeta> {
  pending?: boolean;
  meta?: M;
}

export interface CreateOptionsPending<M extends Meta = DefaultMeta> extends CreateOptions<M> {
  pending: true;
}

const resolveMetaUpdate = <M extends Meta>(meta: M | null, update: MetaUpdate<M> | undefined): M | null => {
  if (update === undefined) {
    return meta;
  }

  if (typeof update === "function") {
    return (update as any)(meta);
  }
  return update;
};

export const DEFAULT_STATE: AsyncStateBase<any> = {
  [ASYNC_STATE_SYMBOL]: true,
  defaultValue: undefined,
  error: undefined,
  pending: false,
  pendingAt: null,
  rejected: false,
  rejectedAt: null,
  resolved: false,
  resolvedAt: null,
  settled: false,
  settledAt: null,
  submitType: undefined,
  value: undefined,
  cancelled: false,
  cancelledAt: null,
  meta: null,
};

export const isAsyncState = (asyncState: any): asyncState is AsyncState<any> => {
  return asyncState?.[ASYNC_STATE_SYMBOL];
};

export class AsyncState<T, M extends Meta = DefaultMeta> implements AsyncStateBase<T, M> {
  // @ts-ignore
  [ASYNC_STATE_SYMBOL]: true;

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

  readonly meta = DEFAULT_STATE.meta as M | null;

  protected constructor() {
    // prevents new AsyncState()
  }

  static create<T, M extends Meta = DefaultMeta>(
    defaultValue?: T,
    options: CreateOptionsPending<M> | CreateOptions<M> = {},
  ): AsyncState<T, M> {
    return Utils.assign({}, DEFAULT_STATE, {
      meta: options.meta || null,
      defaultValue: defaultValue,
      value: defaultValue ?? undefined,
      pending: options.pending || false,
    });
  }

  static clone<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>): AsyncState<T, M> {
    return Utils.assign({}, asyncState);
  }

  static reset<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>): AsyncState<T, M> {
    return AsyncState.create(asyncState.defaultValue);
  }

  static resolve<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
    value: T,
    metaUpdate?: MetaUpdate<M>,
  ): AsyncState<T, M> {
    if (value === undefined) {
      throw new Error(
        "[react-async-stateful] Cannot resolve async asyncState to 'undefined', did you mean 'reset(asyncState)'?",
      );
    }

    return Utils.assign({}, asyncState, {
      error: undefined,
      cancelled: false,
      pending: false,
      rejected: false,
      resolved: true,
      resolvedAt: Date.now(),
      settled: true,
      settledAt: Date.now(),
      value: value,
      elementState: {},
      meta: resolveMetaUpdate(asyncState.meta, metaUpdate),
    });
  }

  static reject<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>, error: Error): AsyncState<T, M> {
    return Utils.assign({}, asyncState, {
      error: error,
      cancelled: false,
      pending: false,
      rejected: true,
      rejectedAt: Date.now(),
      settled: true,
      settledAt: Date.now(),
      resolved: false,
      value: asyncState.defaultValue ?? undefined,
    });
  }

  static cancel<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>): AsyncState<T, M> {
    return Utils.assign({}, asyncState, {
      error: null,
      cancelled: true,
      cancelledAt: Date.now(),
      pending: false,
      rejected: false,
      settled: false,
      resolved: false,
      value: asyncState.defaultValue ?? undefined,
    });
  }

  static submit<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
    options?: {
      pendingAt?: number;
    },
  ): AsyncState<T, M> {
    return Utils.assign({}, asyncState, {
      error: null,
      cancelled: false,
      pending: true,
      pendingAt: Date.now(),
      rejected: false,
      resolved: false,
      settled: false,
      value: asyncState.defaultValue ?? undefined,
      submitType: "submit",
      ...options,
    });
  }

  static refresh<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
    options?: {
      pendingAt?: number;
    },
  ): AsyncState<T, M> {
    return Utils.assign({}, asyncState, {
      cancelled: false,
      pending: true,
      pendingAt: Date.now(),
      settled: false,
      submitType: "refresh",
      ...options,
    });
  }

  /**
   * @description Alias for `refresh`
   *
   * @deprecated - use `refresh` instead
   */
  static pending<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>): AsyncState<T, M> {
    return AsyncState.refresh(asyncState);
  }

  static getStatus<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>): AsyncStateStatus {
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

  static isRejected<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
  ): asyncState is AsyncStateRejected<T, M> {
    return asyncState.rejected;
  }

  static isPending<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
  ): asyncState is AsyncStatePending<T, M> {
    return asyncState.pending;
  }

  static isResolved<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
  ): asyncState is AsyncStateResolved<T, M> {
    return asyncState.resolved;
  }

  static isCancelled<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
  ): asyncState is AsyncStateCancelled<T, M> {
    return asyncState.cancelled;
  }

  static isPristine<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
  ): asyncState is AsyncStatePristine<T, M> {
    return (
      !AsyncState.isRejected(asyncState) && !AsyncState.isResolved(asyncState) && !AsyncState.isPending(asyncState)
    );
  }

  static isSettled<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
  ): asyncState is AsyncStateSettled<T, M> {
    return asyncState.settled;
  }

  /**
   * @description Patch the value of a **resolved** asyncState.
   *
   * @throws {Error} if `asyncState` is not resolved
   */
  static patch<T, M extends Meta = DefaultMeta>(asyncState: AsyncState<T, M>, func: (value: T) => T): AsyncState<T, M> {
    if (AsyncState.isResolved(asyncState)) {
      return Utils.assign({}, asyncState, {
        value: func(asyncState.value),
      });
    }
    throw new Error(
      `[react-async-stateful] Can only patch 'resolved' states, asyncState was ${AsyncState.getStatus(asyncState)}`,
    );
  }

  static map<T, M extends Meta = DefaultMeta, R = T>(
    asyncState: AsyncState<T, M>,
    mapFunc: (value: T) => R,
  ): AsyncState<R, M> {
    const mapped: AsyncState<R, M> = AsyncState.clone(asyncState) as any;
    if (typeof asyncState.defaultValue !== "undefined") {
      Utils.assign(mapped, { defaultValue: mapFunc(asyncState.defaultValue) });
    }
    if (typeof asyncState.value !== "undefined") {
      Utils.assign(mapped, { value: mapFunc(asyncState.value) });
    }
    return mapped;
  }

  static match<T, V extends NotFunction, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
    cases: MatchCases<T, V>,
    defaultValue: V,
  ): V {
    const status = AsyncState.getStatus(asyncState);
    if (status in cases) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = cases[status] as any;
      if (status === "resolved") {
        return typeof value === "function" ? value(asyncState.value) : value;
      }
      if (status === "rejected") {
        return typeof value === "function" ? value(asyncState.error) : value;
      }
      return value;
    }
    return defaultValue;
  }

  static updateMeta<T, M extends Meta = DefaultMeta>(
    asyncState: AsyncState<T, M>,
    metaUpdate: MetaUpdate<M>,
  ): AsyncState<T, M> {
    return Utils.assign({}, asyncState, {
      meta: resolveMetaUpdate(asyncState.meta, metaUpdate),
    });
  }
}

export default AsyncState;
