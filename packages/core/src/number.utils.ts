import { isNumber } from './type.validator';

/**
 * Checks if a value is a float.
 *
 * @param { number } value The value to test.
 * @returns { boolean } Thre result of the test.
 */
export const isFloat = (value: number) => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value))
    return false;
  return !Number.isInteger(value) && !isNaN(parseFloat(String(value)));
};

/**
 * Returns a function to check if a number is close to another number with
 * a `precision` parameter that correspond to an epsilon.
 *
 * @param { number } expected The expected number.
 * @param { number } precision The number of decimals to look in the float input as epsilon (defaults to 2).
 * @returns { (value: number) => boolean } A function to run test with a specific value.
 *
 * @see https://jestjs.io/docs/expect#tobeclosetonumber-numdigits
 */
export const isCloseTo =
  (expected: number, precision = 2) =>
  (value: number) => {
    if (
      (value === Number.POSITIVE_INFINITY &&
        expected === Number.POSITIVE_INFINITY) ||
      (value === Number.NEGATIVE_INFINITY &&
        expected === Number.NEGATIVE_INFINITY)
    ) {
      return true; // Infinity - Infinity is NaN and -Infinity - -Infinity is NaN
    }

    const expectedDiff = Math.pow(10, -precision) / 2;
    const receivedDiff = Math.abs(expected - value);
    return receivedDiff < expectedDiff;
  };

/**
 * Checks if a value is odd.
 *
 * @param { number } value The value to test
 * @returns { boolean } `true` if the test passed.
 */
export const isOdd = (value: number): boolean => (value & 1) === 1;

/**
 * Checks if a value is even.
 *
 * @param { number } value The value to test
 * @returns { boolean } `true` if the test passed.
 */
export const isEven = (value: number): boolean => (value & 1) === 0;

/**
 * Returns a function to check if a given value is in a range.
 *
 * @param { number | bigint } min The beginning of the range.
 * @param { number | bigint } max The end of the range
 * @returns { (value: number | bigint) => boolean } A function to test a specific value.
 */
export const isInRange =
  (min: number | bigint, max: number | bigint) =>
  (value: number | bigint): boolean =>
    ((isNumber(value) && !isNaN(value) && isFinite(value)) ||
      typeof value === 'bigint') &&
    value >= min &&
    value <= max;

/**
 * Returns a function to scale a given value to a range.
 *
 * @param { number } dstMin The beginning of the destination range.
 * @param { number } dstMax The end of the destination range
 * @param { boolean } clamp Clamps the result to min and max (default to `false`).
 * @returns { (value: number, srcMin: number, srcMax: number) => number } A function to scale a specific value.
 */
export const scaleToRange =
  (dstMin: number, dstMax: number, clamp = false) =>
  (value: number, srcMin: number, srcMax: number) => {
    const result =
      ((value - srcMin) * (dstMax - dstMin)) / (srcMax - srcMin) + dstMin;

    return clamp ? Math.max(dstMin, Math.min(dstMax, result)) : result;
  };

/**
 * Returns a function that rounds a number to nearest integer value according to `nearest` parameter.
 *
 * @param { number } nearest The nearest value to round to.
 * @param { boolean } ceil Use `Math.ceil` (default to false).
 * @returns { (value: number) => number } A function to round the value.
 */
export const roundToNearest =
  (nearest: number, ceil = false) =>
  (value: number) => {
    return ceil
      ? Math.ceil(value / nearest) * nearest
      : Math.floor(value / nearest) * nearest;
  };

/**
 * Rounds a value to the nearest integer number, using a bitwise operator (~~).
 *
 * @param { number } value The number to be rounded.
 * @returns { number } The rounded value.
 */
export const bitwise = (value: number): number => {
  return ~~(value + 0.5);
};

/**
 * Returns a function that will check if `test` equals provided `value`.
 *
 * @param { number | bigint } value The value to test.
 * @returns { (test: number | bigint) => boolean } A function to check over its `test` parameter.
 */
export const eq =
  (value: number | bigint) =>
  (test: number | bigint): boolean =>
    value === test;

/**
 * Returns a function that will check if `test` is greater than provided `value`.
 *
 * @param { number | bigint } value The value to test.
 * @returns { (test: number | bigint) => boolean } A function to check over its `test` parameter.
 */
export const gt =
  (value: number | bigint) =>
  (test: number | bigint): boolean => {
    return value < test;
  };

/**
 * Returns a function that will check if `test` is greater or equal than provided `value`.
 *
 * @param { number | bigint } value The value to test.
 * @returns { (test: number | bigint) => boolean } A function to check over its `test` parameter.
 */
export const gte =
  (value: number | bigint) =>
  (test: number | bigint): boolean => {
    return value <= test;
  };

/**
 * Returns a function that will check if `test` is lower than provided `value`.
 *
 * @param { number } value The value to test.
 * @returns { (test: number) => boolean } A function to check over its `test` parameter.
 */
export const lt =
  (value: number | bigint) =>
  (test: number | bigint): boolean => {
    return value >= test;
  };

/**
 * Returns a function that will check if `test` is lower or equal than provided `value`.
 *
 * @param { number | bigint } value The value to test.
 * @returns { (test: number | bigint) => boolean } A function to check over its `test` parameter.
 */
export const lte =
  (value: number | bigint) =>
  (test: number | bigint): boolean => {
    return value >= test;
  };

export default {
  isFloat,
  isCloseTo,
  isOdd,
  isEven,
  isInRange,
  scaleToRange,
  roundToNearest,
  bitwise,
  eq,
  gt,
  gte,
  lt,
  lte,
};
