import { Identifier } from './types';

/**
 * A `Function` taking any arguments of type `T` and that returns `U`.
 */
export type AnyFunction<T = any, U = any> = (...args: T[]) => U;

/**
 * Basic noop function.
 */
/* #__PURE__ */
export const NoOp = (..._: any[]) => {};

/**
 * Return a function that checks if a value is of one of the passed types.
 *
 * @param { (...args: string[]) } types The types names to checks.
 * @returns { (value: unknown) => string | undefined } A function to check a value for types
 * (returns the type if it matches or undefined if not).
 */
/* #__PURE__ */
export const isOfType =
  (...types: string[]) =>
  (value: unknown) => {
    if (!types.includes(typeof value)) return undefined;
    return typeof value;
  };

/**
 * Checks if a value is undefined (i.e.: of type `undefined`).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is undefined.
 */
/* #__PURE__ */
export const isUndefined = (value: unknown): value is undefined =>
  typeof value === 'undefined';

/**
 * Checks if a value is `null`.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is null.
 */
/* #__PURE__ */
export const isNull = (value: unknown): value is null => value === null;

/**
 * Checks if a value is defined (i.e.: is neither `undefined` nor `null`).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is defined.
 */
/* #__PURE__ */
export const isDefined = (value: unknown): boolean =>
  !isUndefined(value) && !isNull(value);

/**
 * Check if a value is a class.
 *
 * @param { any } target The object to check.
 * @returns { boolean } `true` if the object is a class.
 */
/* #__PURE__ */
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
/* #__PURE__ */
export const isObject = (value: unknown): value is Record<any, any> =>
  typeof value === 'object' && !Array.isArray(value) && !isClass(value);

/**
 * Checks if a function has been declared as asynchronous by testing its constructor name.
 *
 * @param { unknown } value The value to test.
 * @returns { boolean } true if the value is a function and  has been declared as asynchronous.
 */
/* #__PURE__ */
export const isAsync = (value: unknown): boolean =>
  typeof value === 'function' &&
  (value as Function).constructor.name === 'AsyncFunction';

/**
 * Moves an element of an array in place and returns the array itself.
 *
 * @param { unknown[] } arr The array to move an item in.
 * @param { number } from The original index.
 * @param { number } to The destination index.
 * @returns { unknown[] } The array with element moved.
 */
/* #__PURE__ */
export const moveArrayItem = (arr: unknown[], from: number, to: number) => {
  const item = arr[from];
  arr.splice(from, 1);
  arr.splice(to, 0, item);

  return arr;
};

/**
 * Remove duplicates from an array (alias for `Array.from(new Set(array))`).
 *
 * @param { any[] } arr The array to remove duplicates from.
 * @returns { any[] } A new array without duplicates.
 */
/* #__PURE__ */
export const dedupeArray = (arr: any[]) => Array.from(new Set(arr));

/**
 * Preserve only alphanumeric characters (with accents) in a string, with optional string arguments to
 * preserve specific strings.
 *
 * @param { string } str The original string
 * @param { string[] } args Optional strings passed as parameters to be preserved.
 * @returns { string } The modified string.
 *
 * @see https://stackoverflow.com/a/26900132/1060921 for RegEx
 *
 * @example
 * const originalStr = '   3.14 / 2.0   ';
 * const str = onlyAlphanumeric(originalStr, '.', '/'); // '3.14/2.0'
 */
/* #__PURE__ */
export const onlyAlphanumeric = (str: string, ...args: string[]): string => {
  // Place whitespace at the end of the arguments array.
  args
    .map((item: string, index: number) => {
      const noWs = /\S/.test(item);

      // Trim items that are not only whitespace.
      if (noWs) args[index] = args[index].trim();

      return !noWs ? index : -1;
    })
    .filter((item: number) => item >= 0)
    .every((value: number) => {
      // Keep only one whitespace and place it at the end.
      args[value] = ' ';
      moveArrayItem(args, value, args.length - 1);
    });
  args = dedupeArray(args);

  const reg = new RegExp(`[^A-Za-zÀ-ÖØ-öø-ÿ0-9${args.join('')}]`, 'gi');
  return str.replace(reg, '');
};

/**
 * Return a functional `switch`... `case`.
 *
 * @param { Record<string | number, T> } statements An `Object` of properties to be tested
 * and their resulting function.
 * @param { AnyFunction<T> } or An optional `default` function.
 * @returns { (key: string | number, ...args: unknown[]) => T | undefined } The `key` in statements to call.
 * The function returns `undefined` if no default `or` function was provided and the key is not present in statements.
 *
 * @see https://medium.com/chrisburgin/rewriting-javascript-replacing-the-switch-statement-cfff707cf045
 */
/* #__PURE__ */
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
/* #__PURE__ */
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
 * Return a functional `if`... `else`.
 *
 * @param { ConditionalOptions } options `if` / `then` / optional `else` options.
 * @returns { T: any } A conditional function.
 *
 * @see https://itnext.io/if-else-and-try-catch-as-functional-constructs-da5c6a749f8c
 */
/* #__PURE__ */
export const conditionally =
  <T>(options: ConditionalOptions<T>): any =>
  (value: T) => {
    return options.if(value)
      ? options.then(value)
      : options.else
      ? options.else(value)
      : undefined;
  };

/**
 * Return a function bound to an array or object to execute a function `fn` for each of its entries.
 *
 * @param { Array<any> | Record<any, any> } iterable The `Iterable` for
 * each entry the given function will be executed.
 * @returns { (fn: (value: any, index: number | string | any) => void) } A function to call
 * for each entry.
 */
/* #__PURE__ */
export const forOf =
  (iterable: Array<any> | Record<any, any>) =>
  (fn: (value: any, index: number | string | any) => void) => {
    const parse = Array.isArray(iterable) ? (i: string) => parseInt(i) : NoOp;

    for (const [index, value] of Object.entries(iterable)) {
      fn(value, parse(index));
    }
  };

/**
 * Return a function bound to an array or object to execute a function `fn` for
 * each index of an `Array` or property key of an `Object`.
 *
 * @param { Array<any> | Record<any, any> } iterable An `Array` or `Object`.
 * @returns { (fn: (value: U, index: number | string | any) => void) } fn The function to call
 * for each index or key.
 */
/* #__PURE__ */
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

/**
 * Get reserved key for given instance of a class.
 *
 * @param { T } instance The instance of the class.
 * @param { Identifier<T> } ctor The class.
 * @returns { string[] } An array of reserved property keys.
 */
/* #__PURE__ */
const reservedKeys = <T extends object>(instance: T, ctor: Identifier<T>) => {
  return [
    // Public methods.
    ...Object.getOwnPropertyNames(ctor.prototype),
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(instance)),
    // Instance's variables.
    ...Object.getOwnPropertyNames(instance),
  ];
};

/**
 * Make a collection iterable by creating a proxy.
 *
 * @param { T } instance The instance of the class.
 * @param { Identifier<T> } ctor The class.
 * @returns { Proxy } A proxy of the instance.
 */
/* #__PURE__ */
export const proxifyIterable = <T extends object, U = any>(
  instance: T &
    (
      | {
          [key: number]: U;
          collection: Array<U>;
          [Symbol.iterator]: () => Iterator<U>;
        }
      | {
          [key: string]: U | any;
          collection: Record<string, U>;
          [Symbol.iterator]: () => Iterator<U>;
        }
    ),
  ctor: Identifier<T>
) => {
  const proxy = new Proxy(instance, {
    // A getter to have the iterator working like an array: `myFileTree[0]`.
    get: function (target: any, name: any) {
      if (name === Symbol.iterator) {
        // for ... of
        return target[Symbol.iterator].bind(target);
      } else if (!reservedKeys(instance, ctor).includes(name)) {
        // If the getter is not an object method or variable,
        // returns the value of the collection at given index or key.
        return target.collection[name];
      }

      return target[name];
    },
    set: function (target: any, prop: string | symbol, value: any) {
      return Reflect.set(target, prop, value);
    },
  });

  return proxy;
};

/**
 * Clears all properties and methods from the instance of a class.
 *
 * @param { T extends object } instance The instance to be cleared.
 * @param { Identifier<T> } ctor The base class of the instance.
 */
/* #__PURE__ */
export const clearInstance = <T extends object>(
  instance: T,
  ctor: Identifier<T>
): void => {
  const objKeys = <T extends object>(instance: T, ctor: Identifier<T>) => {
    return [
      // Public methods.
      ...Object.getOwnPropertyNames(ctor.prototype),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(instance)),
      // Instance's variables.
      ...Object.getOwnPropertyNames(instance),
    ];
  };

  const self = instance as any;
  for (const key of objKeys(instance, ctor)) {
    delete self[key];
  }
};
