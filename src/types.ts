/**
 * An abstract class.
 */
// export type Abstract<T> = abstract new (...args: any[]) => T;
export interface Abstract<T> extends Function {
  prototype: T;
}

/**
 * A concrete (newable) class.
 */
export interface Concrete<T> extends Function {
  new (...args: any[]): T;
}

/**
 * An identifier can be an abstract or a concrete class.
 */
export type Identifier<T> = Concrete<T> | Abstract<T>;

/**
 * Generic `Array` items.
 */
type ArrayItems<T extends Array<any>> = T extends Array<infer TItems>
  ? TItems
  : never;

/**
 * Methods or keys that mutate an `Array`.
 */
type ArrayLengthMutationKeys =
  | 'splice'
  | 'push'
  | 'pop'
  | 'shift'
  | 'unshift'
  | number;

/**
 * An array of fixed length typed values.
 *
 * @see https://stackoverflow.com/a/59906630/1060921
 */
export type Tuple<T extends any[]> = Pick<
  T,
  Exclude<keyof T, ArrayLengthMutationKeys>
> & {
  [Symbol.iterator]: () => IterableIterator<ArrayItems<T>>;
};
