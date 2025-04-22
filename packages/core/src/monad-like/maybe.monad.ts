import { isDefined, isUndefined } from '@/type.validator';
import { Monad } from '@/monad-like/monad.abstract';
import { Either } from '@/monad-like/either.monad';

export class Maybe<T = undefined> implements Monad<T> {
  /**
   * Creates an empty value.
   *
   * @returns { Maybe<T> } A Maybe object with undefined value.
   */
  public static None(): Maybe<never> {
    return new Maybe<never>(undefined);
  }

  /**
   * Creates a non-empty value.
   *
   * @template T The type of the `Maybe` value.
   * @param { T } value The value of type T for the `Maybe` object.
   * @returns { Maybe<T> } A `Maybe` object encapsulating the value of type `T`.
   */
  public static Some<T>(value?: T): Maybe<T> {
    return new Maybe<T>(value);
  }

  /**
   * Creates a Some or None `Maybe` according to given condition.
   *
   * @param { boolean } condition The condition to put a value into `Maybe` or not.
   * @param { T } value The value to put.
   * @returns { Maybe<T> } A new `Maybe` that encapsulates the value.
   */
  public static SomeIf<T>(condition: boolean, value?: T): Maybe<T> {
    return condition ? Maybe.Some(value) : Maybe.None();
  }

  /**
   * Creates a `Maybe` with given value.
   *
   * @template T The type of the `Maybe` value.
   * @param { T } value The value of type T for the `Maybe` object or `undefined` or `null`..
   * @returns { Maybe<T> } A `Maybe` object encapsulating the value of type `T`. Can be `Some` or `None`.
   */
  public static of<T>(value?: T): Maybe<T> {
    return isDefined(value) ? Maybe.Some(value) : Maybe.None();
  }

  /**
   * Optional value for `Maybe` instance.
   */
  private readonly value: T | undefined;

  constructor(value?: T | undefined | null) {
    this.value = value === null ? undefined : value;
  }

  /**
   * Checks if `Maybe` has a value.
   *
   * @returns { boolean } `true` if this Maybe has a value.
   */
  public isSome(): boolean {
    return !isUndefined(this.value);
  }

  /**
   * Checks if `Maybe` doesn't have a value.
   *
   * @returns { boolean } `true` if this Maybe doesn't have a value.
   */
  public isNone(): boolean {
    return isUndefined(this.value);
  }

  /**
   * Applies a function that returns a value to the `Maybe`'s value if present.
   *
   * @param { (value: T) => R } fn The function to apply.
   * @returns { Maybe<R> } A new `Maybe` that encapsulates the result of `fn`.
   */
  public map<R>(fn: (value: T) => R | undefined): Maybe<R> {
    return this.isSome() ? Maybe.of(fn(this.value!)) : Maybe.None();
  }

  /**
   * Apply a function to the `value` if present or return
   * specified default value.
   *
   * @param { (value: T) => R } fn The function to apply.
   * @param { R } defaultValue The default value for `None` result.
   * @returns { Maybe<R> } A new `Maybe` that encapsulates the result of `fn`.
   */
  public mapOr<R>(fn: (value: T) => R, defaultValue: R): Maybe<R> {
    return this.isSome() ? this.map(fn) : Maybe.of(defaultValue);
  }

  /**
   * Applies a function that returns a `Maybe` to this `Maybe`'s value if present.
   *
   * @param { (value: T) => Maybe<R> } fn The function to apply.
   * @returns { Maybe<R> } A new `Maybe` that encapsulates the result of `fn`.
   */
  public flatMap<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
    return this.isSome() ? fn(this.value!) : Maybe.None();
  }

  /**
   * Flattens the `Maybe` instance if its value is a `Maybe` itself.
   *
   * @returns { Maybe<T> } The flattened `Maybe` instance.
   */
  public flatten(): Maybe<T> {
    if (this.value instanceof Maybe) {
      return this.value.flatten();
    }

    return this;
  }

  public orElse<U>(fn: (...args: unknown[]) => U): Maybe<T> | Maybe<U> {
    return this.isSome() ? new Maybe(this.value) : new Maybe(fn());
  }

  /**
   * Returns the value if it exists or an error.
   *
   * @returns { T | Error } The `Maybe`'s value or an `Error`.
   */
  public unwrap(): T | Error {
    if (this.isSome()) return this.value!;
    return new Error("`Maybe` instance doesn't have a value to `unwrap`.");
  }

  /** Returns the `value` if present or specified default value. */
  public unwrapOr<U>(defaultValue: U): T | U {
    return this.isSome() ? this.value! : defaultValue;
  }

  public toEither(): Either<Error, T> {
    return Either.fromMaybe(this);
  }
}
