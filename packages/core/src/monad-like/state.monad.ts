import { Monad } from '@/monad-like/monad.abstract';
import { Maybe } from './maybe.monad';

export interface StateStatus<T> {
  value: T;
  stack: T[];
  cursor: number;
}

export class State<T> implements Monad<T> {
  /**
   * Creates a `State` with an initial value and optionally existing `stack` and `cursor`.
   *
   * @param { R } value The value to store.
   * @param { R[] } stack An array of values stored by a previous state and to keep in this one (defaults to []).
   * @param { number } cursor A position in the stack to read state value (default to 0).
   * @returns { State<R> } A new `State` containing `value` at the top of its stack.
   */
  public static of<R>(value: R, stack: R[] = [], cursor = 0) {
    return new State(value, [value, ...stack], cursor);
  }

  private constructor(
    public readonly value: T,
    public readonly stack: T[] = [],
    public readonly cursor = 0
  ) {}

  /**
   * Creates a new `State` with the new value and the stack with the new value.
   *
   * @param { R } value The value to push to the State.
   * @returns { State <T> } A new state.
   */
  public modify<R extends T>(value: R): State<T> {
    return State.of<R>(value, [...this.stack] as R[], 0);
  }

  /**
   * Takes a function that returns a value and returns a new state.
   *
   * @param { (value: T) => U } fn The function.
   * @returns { State<T> } The new state.
   */
  public map<U>(fn: (value: T) => U): State<U> {
    return this.flatMap((v: T) =>
      State.of(fn(v), this.stack as unknown[] as U[], 0)
    );
  }

  /**
   * Takes a function that returns a `State`, and returns a new flatten state.
   * Note that the function must take a `stack` as parameter in order to keep it consistent with previous one.
   *
   * @param {  (value: T, stack: T[]) => State<T> } fn The function.
   * @returns { State<T> } The new state.
   */
  public flatMap<U>(fn: (value: T, stack: T[]) => State<U>): State<U> {
    return fn(this.value, [...this.stack]);
  }

  /**
   * Purge the state' stack by keeping only its last value and resetting the stack.
   *
   * @returns { State<T> } A new purged state.
   */
  public purge(): State<T> {
    return State.of(this.value);
  }

  /**
   * Goes 'backward' in the `State` by positionning the cursor one step back and returns a new
   * state with previous value, unmodified stack and cursor augmented by 1. Think of `undo`.
   *
   * @param { number } steps The number of steps to go backward in the stack.
   * @returns { State<T> } A new State.
   */
  public backward(steps = 1): State<T> {
    const canGo = this.canGoBackward(steps);
    return new State(
      canGo
        ? this.stack[this.cursor + steps]
        : this.stack[this.stack.length - 1],
      [...this.stack],
      canGo ? this.cursor + steps : this.stack.length - 1
    );
  }

  /**
   * Goes 'forward' in the `State` by positionning the cursor one step forward and returns a new
   * state with previous value, unmodified stack and cursor diminished by 1. Think of `redo`.
   *
   * @param { number } steps The number of steps to go forward in the stack.
   * @returns { State<T> } A new State.
   */
  public forward(steps = 1): State<T> {
    const canGo = this.canGoForward(steps);
    return new State(
      canGo ? this.stack[this.cursor - steps] : this.stack[0],
      [...this.stack],
      canGo ? this.cursor - steps : 0
    );
  }

  public canGoBackward(steps = 1): boolean {
    return this.stack.length >= this.cursor + steps;
  }

  public canGoForward(steps = 1): boolean {
    return this.cursor - steps >= 0;
  }

  /**
   * Get the `State` value.
   * @returns { T } The value.
   */
  public unwrap(): T {
    return this.value;
  }

  /**
   * Get the state status: `value`, `stack` and `cursor`.
   *
   * @returns { StateStatus<T> } The state's status.
   */
  public get(): StateStatus<T> {
    return {
      value: this.value,
      stack: this.stack,
      cursor: this.cursor,
    };
  }

  /**
   * Get a `Maybe` object from this `State`.
   *
   * @returns { Maybe<T> } A new `Maybe`.
   */
  public toMaybe(): Maybe<T> {
    return Maybe.of(this.value);
  }
}
