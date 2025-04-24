import { Monad } from './monad.abstract';
import { Maybe } from './maybe.monad';
import { switchCase } from '@/conditional.utils';

enum LeftRightKeys {
  Left = '__$$@mobiusz/core:left$$__',
  Right = '__$$@mobiusz/core:right$$__',
}

type Left<L> = { kind: LeftRightKeys.Left; leftValue: L };
type Right<R> = { kind: LeftRightKeys.Right; rightValue: R };

type EitherValue<L, R> = Left<L> | Right<R>;

export class Either<L, R> implements Monad<R> {
  /**
   * Creates an `Either` with a `Left` value.
   *
   * @param { L } value A `Left` value.
   * @returns { Either<L, R> } A new instance of Either.
   */
  public static Left<L, R>(value: L) {
    return new Either<L, R>({
      kind: LeftRightKeys.Left,
      leftValue: value,
    });
  }

  /**
   * Creates an `Either` with a `Right` value.
   *
   * @param { R } value A `Right` value.
   * @returns { Either<L, R> } A new instance of Either.
   */
  public static Right<L, R>(value: R) {
    return new Either<L, R>({
      kind: LeftRightKeys.Right,
      rightValue: value,
    });
  }

  /**
   * Creates an `Either` with given value.
   *
   * @param { L | R } value A `Right` or `Left` value.
   * @returns { Either<L, R> } A new instance of Either.
   */
  public static of<L, R>(value?: L | R) {
    return value
      ? new Either<L, R>({
          kind: LeftRightKeys.Right,
          rightValue: value as R,
        })
      : new Either<L, R>({
          kind: LeftRightKeys.Left,
          leftValue: value as L,
        });
  }

  /**
   * Creates an `Either` with a `Maybe`'s value.
   *
   * @param { maybe: Maybe<R | undefined> } maybe The `Maybe` to convert to `Either`.
   * @returns { Either<undefined, R> } A new instance of Either.
   */
  public static fromMaybe<R>(maybe: Maybe<R | Error>): Either<Error, R> {
    const value: R | Error = maybe.flatten().unwrap();
    return value instanceof Error ? Either.Left(value) : Either.Right(value);
  }

  /**
   * An `Either` implementation adapted from https://xurxodev.com.
   *
   * @param { EitherValue<L, R> } value The value to put in the `Either`.
   *
   * @see https://xurxodev.com/either-en-typescript/
   */
  private constructor(private readonly value: EitherValue<L, R>) {}

  /**
   * Checks if `this` instance is `Left`.
   *
   * @returns { boolean } true if this instance of `Either` is `Left`.
   */
  public isLeft(): boolean {
    return this.value.kind === LeftRightKeys.Left;
  }

  /**
   * Checks if `this` instance is `Right`.
   *
   * @returns { boolean } true if this instance of `Either` is `Right`.
   */
  public isRight(): boolean {
    return this.value.kind === LeftRightKeys.Right;
  }

  /**
   * Folds the `Either` instance with a function
   * in case of `Left` and another one in case of `Right`.
   *
   * @param { (left: L) => T } leftFn The function to run in case of a `Left` value.
   * @param { (right: R) => T } rightFn The function to run in case of a `Right` value.
   * @returns { T } The result of the function.
   */
  public fold<T, U>(leftFn: (left: L) => T, rightFn: (right: R) => T): T | U {
    return switchCase<T | U>({
      [LeftRightKeys.Left]: () => leftFn((this.value as Left<L>).leftValue),
      [LeftRightKeys.Right]: () => rightFn((this.value as Right<R>).rightValue),
    })(this.value.kind);
  }

  /**
   * Maps the `Either` to `Right` value only according to the given function.
   *
   * @param { (r: R) => T } fn The function used for mapping.
   * @returns { Either<L, T> } A new 'right' `Either`.
   */
  public map<T>(fn: (r: R) => T): Either<L, T> {
    return this.flatMap((r) => Either.Right(fn(r)));
  }

  /**
   * Flattens a 'right' `Either`.
   *
   * @param { (right: R) => Either<L, T> } fn The function used to flatten this Either instance.
   * @returns { Either<L, T> } A new instance of `Either`.
   */
  public flatMap<T>(fn: (right: R) => Either<L, T>): Either<L, T> {
    return this.fold(
      (leftValue: L) => Either.Left(leftValue),
      (rightValue: R) => fn(rightValue)
    );
  }

  /**
   * Gets the value of `Either` or throws an Error.
   *
   * @param { Error } error The `Error` to throw.
   * @returns { R } The 'right' value of this `Either` instance.
   */
  public getOrThrow(error?: Error): R {
    const throwFn = () => {
      if (error) {
        error.message += `: ${this.value}`;
        throw error;
      }
      throw Error('An error has occurred in `Either`: ' + this.value);
    };

    return this.fold(
      () => throwFn(),
      (rightValue) => rightValue
    );
  }

  /**
   * Gets the value of `Either` or returns a default value.
   *
   * @param { R } defaultValue The value to return in case `Either` is `Left`.
   * @returns { R } The value of this instance of `Either` or the default value.
   */
  public getOrElse(defaultValue: R): R {
    return this.fold(
      () => defaultValue,
      (someValue) => someValue
    );
  }

  /**
   * Gets the value of `Either` or map left value.
   *
   * @param { (left: L) => any } fn The function to run in case `Either` is `Left`.
   * @returns { L | R } The value of this instance of `Either` or the result of the function.
   */
  public getOrMap(fn: (left: L) => any): L | R {
    return this.fold(
      (value: L) => fn(value),
      (someValue: R) => someValue
    );
  }
}
