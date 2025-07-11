import 'error-polyfill';
import type { AnyFunction, Callback } from './function.types';
import { tryCatch } from './error.utils';
import { isFunction } from './type.validator';
import { switchCase } from './conditional.utils';

/**
 * Basic noop function.
 */
// eslint-disable-next-line
export const NoOp = (..._: any[]) => {};

/**
 * Basic identity function.
 *
 * @param { ...args: T } arg Arguments to pass.
 * @returns { args:T } Same arguments.
 */
export const Identity = <T>(args: T) => args;

/**
 * Returns a function to call another function only after a given time.
 *
 * @param { AnyFunction<void> } fn The function to call.
 * @param { number } timeout The number in milliseconds to wait before calling the function.
 * @returns { (...args: T[]) => void } The debounced function to call.
 */
export const debounce = <T>(fn: AnyFunction<T, void>, timeout = 300) => {
  let timer: any;
  return (...args: T[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, timeout);
  };
};

/**
 * Returns a function to call another function only after a given time.
 *
 * @param { AnyFunction<void> } fn The function to call.
 * @param { number } timeout The number in milliseconds to wait before calling the function.
 * @returns { { call: (...args: T[]) => void; cancel: () => void; } } An object containing the function to `call`
 * and a function to `cancel`.
 */
export const cancelableDebounce = <T>(
  fn: AnyFunction<T, void>,
  timeout = 300
) => {
  let timer: any;
  return {
    call: (...args: T[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...args);
      }, timeout);
    },
    cancel: () => {
      clearTimeout(timer);
    },
  };
};

/**
 * Returns a function to call asynchronously another function only after a given time.
 *
 * @param { AnyFunction<T> } fn The function to call.
 * @param { number } timeout The number in milliseconds to wait before calling the function.
 * @returns { (...args: T[]) => Promise<T> } The debounced function to call.
 */
export const debounceAsync = <T>(fn: AnyFunction<T>, timeout = 300) => {
  let timer: any;
  return (...args: T[]) => {
    return new Promise<T>((resolve, reject) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const ret = tryCatch(() => {
          return fn(...args);
        });

        return ret.fold(
          (err: unknown) => reject(err),
          (res: T) => resolve(res)
        );
      }, timeout);
    });
  };
};

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

/**
 * Asynchronous version of `pipe`. It also accepts sync functions but must be called with `await`.
 * Pipe the output of one function to the input of another and make them callable with an input parameter.
 * It is executed from left to right.
 *
 * @param { AnyFunction<Promise<T> | AnyFunction<T>>[] } fns The functions to pipe.
 * @returns { (value: T) => Promise<any> } A function to call the pipe with an initial value.
 *
 * @see https://marmelab.com/blog/2018/04/18/functional-programming-2-monoid.html#async-composition
 */
export const pipeAsync = <T = any>(
  ...fns: (AnyFunction<Promise<T>> | AnyFunction<T>)[]
) =>
  (fns as any[]).reduce(
    (nextFn, fn) => async (x: unknown) => fn((await nextFn(x)) as any) as any,
    /*
    (nextFn, fn) => (x: unknown) =>
      new Promise(async (resolve) =>
        resolve(fn((await nextFn(x)) as any) as any)
      ),
      */
    Identity
  );

/**
 * Pipe the output of one function to the input of another and make them callable with an input parameter.
 * It is executed from right to left.
 *
 * @param { AnyFunction<T>[] } fns The functions to compose.
 * @returns { (value: T) => any } A function to call the composition with an initial value.
 *
 * @see https://medium.com/@abbas.ashraf19/javascript-one-liner-utility-functions-enhance-your-code-with-concise-solutions-55800f55bb39
 */
export const compose =
  <T = any>(...fns: AnyFunction<T>[]) =>
  (value: T): any =>
    fns.reduceRight((v, f) => f(v), value);

/**
 * Asynchronous version of `compose`. It also accepts sync functions but must be called with `await`.
 * Pipe the output of one function to the input of another and make them callable with an input parameter.
 * It is executed from right to left.
 *
 * @param { AnyFunction<Promise<T> | AnyFunction<T>>[] } fns The functions to compose.
 * @returns { (value: T) => Promise<any> } A function to call the pipe with an initial value.
 *
 * @see https://marmelab.com/blog/2018/04/18/functional-programming-2-monoid.html#async-composition
 */
export const composeAsync = <T = any>(
  ...fns: (AnyFunction<Promise<T>> | AnyFunction<T>)[]
) =>
  (fns as any[]).reduceRight(
    (nextFn, fn) => async (x: unknown) => fn((await nextFn(x)) as any) as any,
    Identity
  );

// https://medium.com/@dilanthaprasanjith/using-trampolines-in-javascript-65ff1ee942e
/**
 * Tail call optimization reucursion.
 *
 * @param { (...args: S[]) => T } fn A recursive function with recursion at the end of it.
 * @param { ...S[] } args The arguments to pass to the function.
 * @returns { T } The result of the recursion.
 */
export const trampoline = <T, S = any>(
  fn: (...args: S[]) => T,
  ...args: S[]
): T => {
  let x = fn(...args);
  while (isFunction(x)) {
    x = x();
  }

  return x;
};

/**
 * An async function to wait before resolving an eventual value.
 *
 * @param { number } delay Time to wait in milliseconds.
 * @param { T } value An optional value to pass to the resolver (useful when mapping monads).
 * @returns { Promise<T> } A waiting promise.
 */
export const sleepAsync = <T>(delay: number, value?: T) =>
  new Promise((resolve) => setTimeout(() => resolve(value), delay));

/**
 * Recursively curries a function.
 *
 * @param { AnyFunction } fn The function to curry.
 * @returns { AnyFunction } A curried version of the function.
 *
 * @see https://medium.com/@abbas.ashraf19/javascript-one-liner-utility-functions-enhance-your-code-with-concise-solutions-55800f55bb39
 */
export const curry = (fn: AnyFunction, ...args: any[]) => {
  return fn.length <= args.length
    ? fn(...args)
    : (...more: any[]) => curry(fn, ...args, ...more);
};

/**
 * Uncurries a curried function.
 *
 * @param { AnyFunction } fn The function to uncurry.
 * @returns { AnyFunction } An uncurried version of the function.
 *
 * @see https://stackoverflow.com/a/38657350/1060921
 */
export const uncurry = (fn: AnyFunction) => {
  if (typeof fn !== 'function' || fn.length == 0) return fn;

  return (...args: any[]) => {
    for (const arg of args) {
      if (typeof fn !== 'function') {
        return fn;
      }

      fn = fn(arg);
    }

    return fn;
  };
};

/**
 * Promisify a function having a `callback`.
 *
 * @param { (args: T, cb: Callback<A, B>) } fn The function that has a callback.
 * @returns { ((args: T) => Promise<A>) } A `Promise` based on the given function.
 */
export const promisify =
  <T, A, B>(
    fn: (args: T, cb: Callback<A, B>) => void
  ): ((args: T) => Promise<B>) =>
  (args: T) =>
    new Promise((resolve, reject) => {
      fn(args, (err: A, value: B) => {
        if (err) reject(err);
        else resolve(value);
      });
    });

/**
 * Gets the callee's file path.
 *
 * @returns { string | null } The callee's file path.
 *
 * @see https://stackoverflow.com/a/76037654/1060921
 */
export const getCalleeFilePath = () => {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = ((_: any, frames: any, __: any) => {
    let str = '';

    if (frames.length > 1) str = frames[1].toString();

    return str;
  }) as any;
  const { stack } = new Error();
  Error.prepareStackTrace = orig;

  return stack && stack.length > 0 ? stack : null;
};

/**
 * Gets the caller's name if used in a function.
 *
 * @returns { string | null } The caller function's name.
 *
 * @see https://stackoverflow.com/a/76037654/1060921
 */
export const getCallerName = (): string | undefined => {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const { stack } = new Error();
  Error.prepareStackTrace = orig;

  return stack && stack.length > 1
    ? (stack[2] as any).getFunctionName()
    : undefined;
};

/**
 * Gets the callee function's name.
 *
 * @returns { string | null } The callee function's name.
 *
 * @see https://stackoverflow.com/a/76037654/1060921
 */
export const getCalleeName = (): string | null => {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const { stack } = new Error();
  Error.prepareStackTrace = orig;

  return stack && stack.length > 0 ? (stack[1] as any).getFunctionName() : null;
};

/**
 * Parse arguments of a function according to its length.
 *
 * @param { Record<number, AnyFunction> } length The functions to apply for each length.
 * @param { AnyFunction } or The function to apply if none of the given lengths are found (optional: default to NoOp).
 * @returns { (...args: any[]) => any } A function to parse arguments length.
 */
export const parseArgs =
  (length: Record<number, AnyFunction>, or: AnyFunction = NoOp) =>
  (...args: any[]) => {
    const cases = switchCase(length, or);
    return cases(args.length);
  };

export default {
  NoOp,
  Identity,
  debounce,
  cancelableDebounce,
  debounceAsync,
  pipe,
  pipeAsync,
  compose,
  composeAsync,
  trampoline,
  sleepAsync,
  curry,
  uncurry,
  promisify,
  getCalleeFilePath,
  getCallerName,
  getCalleeName,
  parseArgs,
};
