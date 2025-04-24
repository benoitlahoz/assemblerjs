type ArrayLengthMutationKeys =
  | 'splice'
  | 'push'
  | 'pop'
  | 'shift'
  | 'unshift'
  | number;

type ArrayItems<T extends Array<any>> = T extends Array<infer TItems>
  ? TItems
  : never;

/**
 * Describes a tuple.
 *
 * @see https://stackoverflow.com/a/59906630/1060921
 */
export type Tuple<T extends any[]> = Pick<
  T,
  Exclude<keyof T, ArrayLengthMutationKeys>
> & { [Symbol.iterator]: () => IterableIterator<ArrayItems<T>> };

/**
 * Describes a fixed length `Array`.
 *
 * @see https://stackoverflow.com/a/59906630/1060921
 */
export type FixedLengthArray<
  T,
  L extends number,
  TObj = [T, ...Array<T>]
> = Pick<TObj, Exclude<keyof TObj, ArrayLengthMutationKeys>> & {
  readonly length: L;
  [I: number]: T;
  [Symbol.iterator]: () => IterableIterator<T>;
};

/**
 * Describes a nested record type.
 *
 * @see https://stackoverflow.com/a/76583105
 */
export type NestedRecord<T = any> = { [k: PropertyKey]: T | NestedRecord<T> };
