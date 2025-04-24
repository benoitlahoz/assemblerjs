import { Maybe } from '@/monad-like/maybe.monad';

/**
 * Tries to get an element of an `array` at `index`.
 *
 * @param { Array<T> } arr The array to get the element from.
 * @param { number } index The index of the element in the `array`.
 * @returns { Maybe<T> } The element in the `array` at given `index`.
 */
export const elementAt = <T>(arr: Array<T>, index: number): Maybe<T> =>
  Maybe.of(arr[index]);

/**
 * Filters an array of `MayBe` and unwraps its defined (`Some`) values.
 *
 * @param { Maybe<T>[] } arr The array of `MayBe`.
 * @returns { Array<T> } An array of values of type `T`.
 */
export const filterSome = <T>(arr: Array<Maybe<T>>): Array<T> =>
  arr.filter((x: Maybe<T>) => x.isSome()).map((x: Maybe<T>) => <T>x.unwrap());

/**
 * Tries to find an element in an `array` with the given `predicate` function.
 *
 * @param { Array<T> } array The array to find an element in.
 * @param { (value: T, index: number, obj: Array<T>) => boolean } predicate The function to apply
 * to each element of the `array`.
 * @returns { Maybe<T | undefined> } The found element (`Some`) or undefined (`None`).
 */
export const find = <T>(
  array: Array<T>,
  predicate: (value: T, index?: number, obj?: Array<T>) => boolean
): Maybe<T | undefined> => Maybe.of(array.find(predicate));
