export const ASYNC_STATE_SYMBOL = "isAsyncState" as const;

export type NotFunction = any & {
  (): never;
  call: never;
};

// polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
export const assign: (typeof Object)["assign"] =
  Object.assign ||
  ((target: any, ...varArgs: any) => {
    if (target === null || target === undefined) {
      throw new TypeError("Cannot convert undefined or null to object");
    }

    const to = Object(target);

    for (let index = 1; index < varArgs.length; index++) {
      const nextSource = varArgs[index];

      if (nextSource !== null && nextSource !== undefined) {
        for (const nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  });
