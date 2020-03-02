/* eslint-disable @typescript-eslint/no-explicit-any */
import AsyncState from "./AsyncState";

export const unstable__lens = <V, T>(
  state: AsyncState<T>,
  lens: (value: T) => V,
  defaultValue?: V,
): AsyncState<V> => {
  return new Proxy(state, {
    get(target: AsyncState<T>, key: keyof AsyncState<T>): any {
      const original = target[key];
      if (key === "value") {
        if (target.resolved) {
          const value = lens(target.value as any);
          if (value === undefined) {
            throw new Error("Lens cannot resolve to 'undefined'");
          }
          return value;
        } else {
          return defaultValue;
        }
      }
      return original;
    },
  }) as any;
};
