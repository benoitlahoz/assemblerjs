import { NoOp } from './function.utils';

/**
 * Returns a function bound to an array or object to execute a function `fn` for each of its entries.
 *
 * @param { Array<any> | Record<any, any> } iterable The `Iterable` for
 * each entry the given function will be executed.
 * @returns { (fn: (value: any, index: number | string | any) => void) } A function to call
 * for each entry.
 */
export const forOf =
  (iterable: Array<any> | Record<any, any>) =>
  (fn: (value: any, index: number | string | any) => void) => {
    const parse = Array.isArray(iterable) ? (i: string) => parseInt(i) : NoOp;

    for (const [index, value] of Object.entries(iterable)) {
      fn(value, parse(index));
    }
  };

/**
 * Returns a function bound to an array or object to execute a function `fn` for
 * each index of an `Array` or property key of an `Object`.
 *
 * @param { Array<any> | Record<any, any> } iterable An `Array` or `Object`.
 * @returns { (fn: (value: U, index: number | string | any) => void) } fn The function to call
 * for each index or key.
 */
export const forIn =
  (iterable: Array<any> | Record<any, any>) =>
  (fn: (index: number | string | any) => void) => {
    const parse = Array.isArray(iterable)
      ? (i: string) => parseInt(i)
      : (i: string) => i;

    for (const index in iterable) {
      fn(parse(index));
    }
  };

export const map =
  (iterable: Array<any> | Record<any, any>) =>
  (fn: (value: any, index: number | string | any) => any) => {
    const results: unknown[] = [];
    const parse = Array.isArray(iterable)
      ? (i: string) => parseInt(i)
      : (i: string) => i;

    for (const [index, value] of Object.entries(iterable)) {
      results.push(fn(value, parse(index)));
    }

    return results;
  };

/**
 * Executes `Promise`s sequentially without returning a result.
 *
 * @param { Array<any> | Record<any, any> } iterable The `Iterable` for
 * each `value` the given `fn` will be executed.
 * @param { (value: any, index: number | string | any) => Promise<void> } fn The action to execute on
 * each iterable's value.
 * @returns { Promise<void> } A `Promise`.
 *
 * @see https://stackoverflow.com/a/43082995
 */
export const asyncForEach =
  (iterable: Array<any> | Record<any, any> | Map<any, any> | Set<any>) =>
  async (
    fn: (value: any, index: number | string | any) => Promise<void>
  ): Promise<void> => {
    for (const [index, value] of iterable.entries()) {
      await fn(value, index);
    }
  };

/**
 * Executes `Promise`s sequentially and returns an array of the results.
 *
 * @param { Array<any> | Record<any, any> } iterable The `Iterable` for
 * each `value` the given `fn` will be executed.
 * @param { (value: any, index: number | string | any) => Promise<void> } fn The action to execute on
 * each iterable's value.
 * @returns { Promise<any> } A `Promise` that resolve with resulting values in an `Array`.
 *
 * @see https://stackoverflow.com/a/43082995
 */
export const asyncMap =
  (iterable: Array<any> | Record<any, any> | Map<any, any> | Set<any>) =>
  async (
    fn: (value: any, index?: number | string) => Promise<any>
  ): Promise<unknown[]> => {
    const results: unknown[] = [];

    for (const [index, value] of iterable.entries()) {
      results.push(await fn(value, index));
    }

    return results;
  };

export default { forOf, forIn, map, asyncForEach, asyncMap };
