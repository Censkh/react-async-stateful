export type NotFunction = any & {
  (): never;
  call: never;
};
