import { Either } from '@/monad-like/either.monad';

/**
 * Functional try / catch.
 *
 * @param { () => T } fn The function to run.
 * @returns { Either<unknown, T> } An `Either` with `Left` as error and `Right` as result of the call of `fn`.
 *
 * @see https://medium.com/weekly-webtips/functional-try-catch-in-javascript-8b9923c3e395
 */
export const tryCatch = <T>(fn: () => T): Either<unknown, T> => {
  try {
    const result: T = fn();
    return Either.Right(result);
  } catch (error: unknown) {
    return Either.Left(error);
  }
};

/**
 * Functional async try / catch.
 *
 * @param { () => Promise<T> } fn The function to run async.
 * @returns { Either<unknown, T> } An `Either` with `Left` as error and `Right` as result of the call of `fn`.
 *
 * @see https://medium.com/weekly-webtips/functional-try-catch-in-javascript-8b9923c3e395
 */

export const asyncTryCatch = async <T>(
  fn: () => Promise<T>
): Promise<Either<unknown, T>> => {
  try {
    const result: T = await fn();
    return Either.Right(result);
  } catch (error: unknown) {
    return Either.Left(error);
  }
};

export default { tryCatch, asyncTryCatch };
