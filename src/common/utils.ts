/**
 * A `Function` taking any arguments of type `T` and that returns `U`.
 */
export type AnyFunction<T = any, U = any> = (...args: T[]) => U;

/**
 * Basic noop function.
 */
export const NoOp = (..._: any[]) => {};

/**
 * Check if a value is a class.
 *
 * @param { any } target The object to check.
 * @returns { boolean } `true` if the object is a class.
 */
export const isClass = (
  target: any
): target is { new (...args: any[]): any } => {
  return (
    target &&
    typeof target === 'function' &&
    typeof target.constructor !== 'undefined'
  );
};

/**
 * Checks if a value is strictly an object (i.e. with properties, not null and not an array).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is an object, not a class and not an array.
 */
export const isObject = (value: unknown): value is Record<any, any> =>
  typeof value === 'object' && !Array.isArray(value) && !isClass(value);

/**
 * Checks if a function has been declared as asynchronous by testing its constructor name.
 *
 * @param { unknown } value The value to test.
 * @returns { boolean } true if the value is a function and  has been declared as asynchronous.
 */
export const isAsync = (value: unknown): boolean =>
  typeof value === 'function' &&
  (value as Function).constructor.name === 'AsyncFunction';

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
 * Pipe the output of one function to the input of another and make them callable with an input parameter.
 * It is executed from left to right.
 *
 * @param { AnyFunction<T>[] } fns The functions to pipe.
 * @returns { (value: T) => any } A function to call the pipe with an initial value.
 *
 * @see https://medium.com/@abbas.ashraf19/javascript-one-liner-utility-functions-enhance-your-code-with-concise-solutions-55800f55bb39
 */
export const pipe =
  <T = any>(...fns: AnyFunction<T>[]) =>
  (value?: T): any =>
    fns.reduce((v, f) => f(v as T), value);

export interface ConditionalOptions<T> {
  if: (value: T) => boolean;
  then: (value: T) => unknown;
  else?: (value: T) => unknown;
}

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
