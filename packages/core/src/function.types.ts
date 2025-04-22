/**
 * A `Function` taking any arguments of type `T` and returns `U`.
 */
export type AnyFunction<T = any, U = any> = (...args: T[]) => U;

/**
 * A `Function` taking any arguments of type `unknown` and returns `unknown`.
 */
export type UnknownFunction = AnyFunction<unknown, unknown>;

/**
 * Describes an asynchronous `Function`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const AsyncFunction = (async () => {}).constructor;

/**
 * Describes a generator `Function`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const GeneratorFunction = function* () {}.constructor;

/**
 * A `callback` generic type.
 */
export type Callback<A, B> = (err: A, value: B) => void;

/**
 * Describes a predicate.
 */
export type Predicate<T> = AnyFunction<T, boolean>;
