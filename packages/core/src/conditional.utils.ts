import type { AnyFunction } from './function.types';
import { NoOp } from './function.utils';

export interface ConditionalOptions<T> {
  if: (value: T) => boolean;
  then: (value: T) => unknown;
  else?: (value: T) => unknown;
}

/**
 * Returns a functional `switch`... `case`.
 *
 * @param { Record<string | number, T> } statements An `Object` of properties to be tested
 * and their resulting function.
 * @param { AnyFunction<T> } or An optional `default` function.
 * @returns { (key: string | number, ...args: unknown[]) => T | undefined } The `key` in statements to call.
 * The function returns `undefined` if no default `or` function was provided and the key is not present in statements.
 *
 * @see https://medium.com/chrisburgin/rewriting-javascript-replacing-the-switch-statement-cfff707cf045
 */
export const switchCase =
  <T>(
    statements: Record<string | number, AnyFunction<T>>,
    or?: AnyFunction<any>
  ) =>
  (key: string | number, ...args: T[]): T =>
    statements[key]
      ? statements[key](...args)
      : or
      ? or(key, ...args)
      : (NoOp() as T);

/**
 * Returns a functional `if`... `else`.
 *
 * @param { ConditionalOptions } options `if` / `then` / optional `else` options.
 * @returns { T: any } A conditional function.
 *
 * @see https://itnext.io/if-else-and-try-catch-as-functional-constructs-da5c6a749f8c
 */
export const conditionally =
  <T>(options: ConditionalOptions<T>): any =>
  (value: T) => {
    return options.if(value)
      ? options.then(value)
      : options.else
      ? options.else(value)
      : undefined;
  };

export default {
  switchCase,
  conditionally,
};
