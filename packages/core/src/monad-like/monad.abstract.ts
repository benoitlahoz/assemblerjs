export abstract class Monad<T> {
  public abstract map<U extends T>(fn: (value: T) => U): Monad<U>;
  public abstract flatMap<U extends T>(fn: (value: T) => Monad<U>): Monad<U>;
}
