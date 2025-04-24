/**
 * Decorator to allow static implementation of abstract classes.
 *
 * @see https://stackoverflow.com/a/43674389/1060921
 */
export function StaticImplements<T>() {
  return <U extends T>(constructor: U) => {
    // eslint-disable-next-line
    constructor;
  };
}
