import { Monad } from '@/monad-like/monad.abstract';
import { switchCase } from '@/conditional.utils';
import { pipe } from '@/function.utils';
import type { AnyFunction } from '@/function.types';
import { Maybe } from './maybe.monad';
import { Either } from './either.monad';

export enum FailureSuccessKeys {
  Failure = '__$$@mobiusz/core:failure$$__',
  Success = '__$$@mobiusz/core:success$$__',
}

export type Success<S> = { kind: FailureSuccessKeys.Success; successValue: S };
export type Failure<F = Error> = {
  kind: FailureSuccessKeys.Failure;
  failureValue: F;
};

export type ResultValue<S, F = Error> = Failure<F> | Success<S>;

export class Result<S, F = Error> implements Monad<S> {
  /**
   * Creates a `Result` with a `Failure` value.
   *
   * @param { F } value A `Failure` value.
   * @returns { Result<S, F = Error> } A new instance of Result.
   */
  public static Failure<S, F = Error>(value: F) {
    return new Result<S, F>({
      kind: FailureSuccessKeys.Failure,
      failureValue: value,
    });
  }

  /**
   * Creates a `Result` with a `Success` value.
   *
   * @param { S } value A `Success` value.
   * @returns { Result<S, F> } A new instance of Result.
   */
  public static Success<S, F = Error>(value: S) {
    return new Result<S, F>({
      kind: FailureSuccessKeys.Success,
      successValue: value,
    });
  }

  /**
   * Returns a function to run another given function inside a try... catch..
   * and return a new `Result`.
   *
   * @param { AnyFunction<T> } fn The function to try.
   * @returns { () => Result<S, F> } A function that returns a new instance of `Result`.
   *
   * @todo Check Async functions and run accordingly.
   */
  public static of<T>(
    fn: AnyFunction<any, T>
  ): AnyFunction<any, Result<T, Error>> {
    return (...args: any[]) => {
      try {
        const value = fn(...args);
        return Result.Success<T>(value);
      } catch (err: unknown) {
        return Result.Failure<T>(err as Error);
      }
    };
  }

  /**
   * Commpose multiple functions to return a result.
   *
   * @param { ...fns: AnyFunction<T>[] } fns The function
   * @returns
   */
  public static compose(...fns: AnyFunction[]) {
    const wrappedFns = fns.map((f: any) => {
      return (value: any) => {
        const ret = Result.of(f)(value);
        return ret.fold(
          (err: unknown) => err,
          (v: any) => v
        );
      };
    });
    return (value: any) => Result.of(pipe(...wrappedFns))(value);
  }

  /**
   * An implementation of the `Result` monad.
   * `Result` seems similar to `Either` but implements a try... catch... static method
   * and a `recover` method (similar to Either's fold).
   * `Result` stores the resulting value passed on creation, either with `try` or with
   * `Success` and `Failure`.
   */
  private constructor(public readonly value: ResultValue<S, F>) {}

  /**
   * Checks if `this` instance is `Failure`.
   *
   * @returns { boolean } true if this instance of `Result` is `Failure`.
   */
  public isFailure(): boolean {
    return this.value.kind === FailureSuccessKeys.Failure;
  }

  /**
   * Checks if `this` instance is `Success`.
   *
   * @returns { boolean } true if this instance of `Result` is `Success`.
   */
  public isSuccess(): boolean {
    return this.value.kind === FailureSuccessKeys.Success;
  }

  /**
   * Maps the `Result` to `Success` value only according to the given function.
   *
   * @param { (r: S) => T } fn The function used for mapping.
   * @returns { Result<T, F> } A new 'success' `Result`.
   */
  public map<T>(fn: (r: S) => T): Result<T, F> {
    try {
      return this.flatMap((r) => Result.Success(fn(r)));
    } catch (err: unknown) {
      return Result.Failure(err as F);
    }
  }

  /**
   * Apply a function to the `value` if present or return
   * specified default value.
   *
   * @param { (value: T) => R } fn The function to apply.
   * @param { R } defaultValue The default value for `None` result.
   * @returns { Maybe<R> } A new `Maybe` that encapsulates the result of `fn`.
   */
  public mapOr<T>(fn: (value: S) => T, defaultValue: T): Result<T, F> {
    return this.isSuccess() ? this.map(fn) : Result.Success(defaultValue);
  }

  /**
   * Flattens a 'success' `Result`.
   *
   * @param { (right: S) => Result<T, F> } fn The function used to flatten this Either instance.
   * @returns { Result<T, F> } A new instance of `Either`.
   */
  public flatMap<T>(fn: (right: S) => Result<T, F>): Result<T, F> {
    return this.fold(
      (failureValue: F) => Result.Failure(failureValue),
      (successValue: S) => fn(successValue)
    );
  }

  /**
   * Folds the `Result` instance with a function
   * in case of `Failure` and another one in case of `Success`.
   *
   * @param { (failure: F) => T } failureFn The function to run in case of a `Failure` value.
   * @param { ((success: S) => T)  | undefined } successFn Optional : the function to run in case of a `Success` value.
   * @returns { T | undefined } The result of the function.
   */
  public fold<T>(
    failureFn: (failure: F) => T,
    successFn: (success: S) => T
  ): T {
    const typeCase = switchCase({
      [FailureSuccessKeys.Failure]: () =>
        failureFn((this.value as Failure<F>).failureValue),
      [FailureSuccessKeys.Success]: () =>
        successFn((this.value as Success<S>).successValue),
    });

    return typeCase(this.value.kind);
  }

  /**
   * Get the value of this result.
   *
   * @returns { S | F } The `Success` or `Failure` value of this `Result`.
   */
  public unwrap(): (S | F) | Result<S, F> {
    return this.isSuccess()
      ? (this.value as Success<S>).successValue
      : (this.value as Failure<F>).failureValue;
  }

  /**
   * Get the value of this result if successful or a default value.
   *
   * @returns { S } The `Success` value of this `Result` or aa default value.
   */
  public unwrapOr(defaultValue: S): S {
    return this.isSuccess()
      ? (this.value as Success<S>).successValue
      : defaultValue;
  }

  public flatten(): Result<S, F> {
    if (this.unwrap() instanceof Result)
      return (this.unwrap() as Result<S, F>).flatten();

    return this;
  }

  /**
   * Converts `Result` to a `Maybe`. If result is a failure, Maybe is just `None`
   * without preserving the error's value. Otherwise, it's `Some` with the `Success` value.
   *
   * @returns { Maybe<T> } A new `Maybe` from the `Result`.
   */
  public toMaybe<S>(): Maybe<S> {
    return this.fold(
      (_) => Maybe.None(),
      (value: any) => Maybe.Some(value)
    );
  }

  /**
   * Converts `Result` to an `Either`. `Failure` value will be `Left`
   * while `Success` value will be `Right`.
   *
   * @returns { Either<F, S> } A new `Either` from the `Result`.
   */
  public toEither(): Either<F, S> {
    return this.fold(
      (value: F) => Either.Left(value),
      (value: S) => Either.Right(value)
    );
  }
}
