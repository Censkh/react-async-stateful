import AsyncState, { type CreateOptions, type CreateOptionsPending, DEFAULT_STATE } from "./AsyncState";
import * as Utils from "./Utils";

export interface AsyncStateGroupOptions<T extends K, K> {
  getKey: (key: K) => string;
  defaultValues?: T[];
}

export class AsyncStateGroup<T extends K, K> extends AsyncState<Record<string, T>> {
  readonly elementState: Record<string, AsyncState<T>> = {};

  protected constructor(readonly options: AsyncStateGroupOptions<T, K>) {
    super();
  }

  static createGroup<T extends K, K>(
    options: AsyncStateGroupOptions<T, K> & (CreateOptionsPending | CreateOptions),
  ): AsyncStateGroup<T, K> {
    const defaultValue: Record<string, T> = {};
    if (options.defaultValues) {
      for (const value of options.defaultValues) {
        defaultValue[options.getKey(value)] = value;
      }
    }

    return Utils.assign({}, DEFAULT_STATE, {
      defaultValue: defaultValue,
      value: defaultValue,
      pending: options.pending || false,
      options: options,
      elementState: {},
    }) as any;
  }

  protected static getElement<T extends K, K>(group: AsyncStateGroup<T, K>, key: K): AsyncState<T> | undefined {
    return group.elementState[group.options.getKey(key)];
  }

  static getOrCreateElement<T extends K, K>(group: AsyncStateGroup<T, K>, key: K): AsyncState<T> {
    const element = AsyncStateGroup.getElement(group, key);
    if (element) {
      return element;
    }
    return AsyncState.create();
  }

  static setElement<T extends K, K>(group: AsyncStateGroup<T, K>, key: K, state: AsyncState<T>): AsyncStateGroup<T, K> {
    const keyId = group.options.getKey(key);
    return Utils.assign({}, group, {
      elementState: Utils.assign({}, group.elementState, {
        [keyId]: state,
      }),
    });
  }

  static resetElement<T extends K, K>(asyncStateGroup: AsyncStateGroup<T, K>, key: K): AsyncStateGroup<T, K> {
    const state = AsyncStateGroup.getOrCreateElement(asyncStateGroup, key);

    return AsyncStateGroup.setElement(asyncStateGroup, key, AsyncState.reset(state));
  }

  static resolveElement<T extends K, K>(
    asyncStateGroup: AsyncStateGroup<T, K>,
    key: K,
    value: T,
  ): AsyncStateGroup<T, K> {
    const keyId = asyncStateGroup.options.getKey(key);
    const state = AsyncStateGroup.getOrCreateElement(asyncStateGroup, key);

    return Utils.assign({}, asyncStateGroup, {
      value: Utils.assign({}, asyncStateGroup.value, {
        [keyId]: value,
      }),
      elementState: Utils.assign({}, asyncStateGroup.elementState, {
        [keyId]: AsyncState.resolve(state, value),
      }),
    });
  }

  static rejectElement<T extends K, K>(
    asyncStateGroup: AsyncStateGroup<T, K>,
    key: K,
    error: Error,
  ): AsyncStateGroup<T, K> {
    const state = AsyncStateGroup.getOrCreateElement(asyncStateGroup, key);

    return AsyncStateGroup.setElement(asyncStateGroup, key, AsyncState.reject(state, error));
  }

  static cancelElement<T extends K, K>(asyncStateGroup: AsyncStateGroup<T, K>, key: K): AsyncStateGroup<T, K> {
    const state = AsyncStateGroup.getOrCreateElement(asyncStateGroup, key);

    return AsyncStateGroup.setElement(asyncStateGroup, key, AsyncState.cancel(state));
  }

  static submitElement<T extends K, K>(asyncStateGroup: AsyncStateGroup<T, K>, key: K): AsyncStateGroup<T, K> {
    const state = AsyncStateGroup.getOrCreateElement(asyncStateGroup, key);

    return AsyncStateGroup.setElement(asyncStateGroup, key, AsyncState.submit(state));
  }

  static refreshElement<T extends K, K>(asyncStateGroup: AsyncStateGroup<T, K>, key: K): AsyncStateGroup<T, K> {
    const state = AsyncStateGroup.getOrCreateElement(asyncStateGroup, key);

    return AsyncStateGroup.setElement(asyncStateGroup, key, AsyncState.refresh(state));
  }
}

export default AsyncStateGroup;
