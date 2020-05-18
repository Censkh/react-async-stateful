import {
  AsyncStateBase,
  AsyncStatePending,
  AsyncStatePristine,
  AsyncStateRefreshing,
  AsyncStateRejected,
  AsyncStateResolved,
  AsyncStateSettled,
  AsyncStateStatus,
  AsyncStateSubmitting,
  AsyncStateSubmitType,
  MatchCases,
}                    from "./Types";
import {NotFunction} from "./Utils";

interface CreateOptions {
  pending?: boolean;
}

type CreateOptionsPending = CreateOptions & {
  pending: true;
};

export default class AsyncState<T> implements AsyncStateBase<T> {
  readonly defaultValue: T | undefined = undefined;
  readonly error: Error | undefined = undefined;
  readonly pending: boolean = false;
  readonly pendingAt: number | null = null;
  readonly rejected: boolean = false;
  readonly rejectedAt: number | null = null;
  readonly resolved: boolean = false;
  readonly resolvedAt: number | null = null;
  readonly settled: boolean = false;
  readonly settledAt: number | null = null;
  readonly submitType: AsyncStateSubmitType | undefined = undefined;
  readonly value: T | undefined = undefined;

  private constructor(info: Partial<AsyncStateBase<T>>) {
    Object.assign(this, info);
  }

  static create<T>(
    defaultValue?: T,
    options: CreateOptionsPending | CreateOptions = {},
  ): AsyncStatePristine<T> {
    return new AsyncState<T>({
      defaultValue,
      pending: options.pending || false,
    }) as any;
  }

  clone(): AsyncState<T> {
    return new AsyncState<T>(this);
  }

  reset(): AsyncStatePristine<T> {
    return AsyncState.create(this.defaultValue);
  }

  resolve(this: AsyncState<T>, value: T): AsyncStateResolved<T> {
    if (value === undefined) {
      throw new Error(
        "Cannot resolve async this to 'undefined', did you mean 'reset(this)'?",
      );
    }

    return new AsyncState({
      ...this,
      error     : undefined,
      pending   : false,
      rejected  : false,
      resolved  : true,
      resolvedAt: Date.now(),
      settled   : true,
      settledAt : Date.now(),
      value     : value,
    }) as any;
  }

  reject(this: AsyncState<T>, error: Error): AsyncStateRejected<T> {
    return new AsyncState<T>({
      ...this,
      error     : error,
      pending   : false,
      rejected  : true,
      rejectedAt: Date.now(),
      settled   : true,
      settledAt : Date.now(),
      resolved  : false,
      value     : this.defaultValue ?? undefined,
    }) as any;
  }

  submit(): AsyncStateSubmitting<T> {
    return new AsyncState<T>({
      ...this,
      pending   : true,
      pendingAt : Date.now(),
      pristine  : false,
      rejected  : false,
      resolved  : false,
      settled   : false,
      value     : this.defaultValue ?? undefined,
      submitType: "submit",
    }) as any;
  }

  refresh(): AsyncStateRefreshing<T> {
    return new AsyncState<T>({
      ...this,
      pristine  : false,
      pending   : true,
      pendingAt : Date.now(),
      settled   : false,
      submitType: "refresh",
    }) as any;
  }

  getStatus(): AsyncStateStatus {
    if (this.isPristine()) return "pristine";
    if (this.pending && this.submitType === "refresh") {
      return "refreshing";
    }
    if (this.pending && this.submitType === "submit") {
      return "submitting";
    }
    if (this.resolved) {
      return "resolved";
    }
    if (this.rejected) {
      return "rejected";
    }
    return "invalid";
  }

  isRejected(): this is AsyncStateRejected<T> {
    return this.rejected;
  }

  isPending(): this is AsyncStatePending<T> {
    return this.pending;
  }

  isResolved(): this is AsyncStateResolved<T> {
    return this.resolved;
  }

  isPristine(): this is AsyncStatePristine<T> {
    return !this.isRejected() && !this.isResolved() && !this.isPending();
  }

  isSettled(): this is AsyncStateSettled<T> {
    return this.settled;
  }

  /**
   * @description Patch the value of a **resolved** this.
   *
   * @throws {Error} if `this` is not resolved
   */
  apply(func: (value: T) => T): AsyncState<T> {
    if (this.isResolved()) {
      return new AsyncState<T>({
        ...this,
        value: func(this.value),
      });
    }
    throw new Error(
      `Can only patch 'resolved' states, this this was ${this.getStatus()}`,
    );
  }

  match<V extends NotFunction>(cases: MatchCases<T, V>, defaultValue: V): V {
    const status = this.getStatus();
    if (status in cases) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = cases[status] as any;
      if (status === "resolved") {
        return typeof value === "function" ? value(this.value) : value;
      } else if (status === "rejected") {
        return typeof value === "function" ? value(this.error) : value;
      }
      return value;
    }
    return defaultValue;
  }
}
