import { Monad } from './monad.abstract';

// See https://medium.com/@magnusjt/the-io-monad-in-javascript-how-does-it-compare-to-other-techniques-124ef8a35b63

export class IO<T> implements Monad<T> {
  /**
   * Creates a new IO from an effect (a function).
   *
   * @param { (value: U) => U } effect The function to create the IO.
   * @returns { IO<U> } A new IO instance.
   */
  public static of<U>(effect: (value: U) => U): IO<U> {
    return new IO(effect);
  }

  /**
   * Compose multiple IO into one.
   *
   * @param { ...IO<U>[] } ios The IOs to compose together.
   * @returns { IO<U> } A new instance of IO.
   */
  public static compose<U>(...ios: IO<U>[]): IO<U> {
    return ios.reduce((previousIO, currentIO) => {
      return previousIO.map((v: U) => currentIO.eval(v));
    });
  }

  private constructor(private readonly effect: (value: T) => T) {}

  /**
   * Creates a new IO with an effect bound to this effect.
   *
   * @param { (value: T) => U } effect The effect to apply.
   * @returns { IO<U> } A new IO.
   */
  public map<U extends T>(effect: (value: T) => U): IO<U> {
    return IO.of((v: T) => effect(this.effect(v)));
  }

  /**
   * Takes an effect that returns an IO, and return flatten IO.
   *
   * @param { (value: T) => IO<U> } effect The effect to apply.
   * @returns { IO<U> } A new flat IO.
   */
  public flatMap<U extends T>(effect: (value: T) => IO<U>): IO<U> {
    return IO.of((v: U) => effect(this.effect(v)).eval(v));
  }

  /**
   * Evaluate the IO effect.
   *
   * @param { T } input The value to pass as parameter.
   * @returns { T } The result of the evaluation.
   */
  public eval(input: T): T {
    return this.effect(input);
  }
}
