import { Monad } from '@/monad-like/monad.abstract';
import { pipeAsync } from '@/function.utils';
import type { AnyFunction } from '@/function.types';
import { Result } from './result.monad';
import { wait } from '@/promise.utils';

export class Task<S> implements Monad<S> {
  /**
   * Returns a new `Task` that contains the given function.
   *
   * @param { AnyFunction<any, Promise<S>> | AnyFunction<any, S> } fn The function to try.
   * @returns { Task<S> } A new Task.
   */
  public static of<T>(
    fn: AnyFunction<any, Promise<T>> | AnyFunction<any, T>
  ): Task<T> {
    return new Task(fn);
  }

  /**
   * Commpose multiple functions to return a single `Task`.
   *
   * @param { tasks: Task<any>[] } tasks The tasks to compose.
   * @returns { Task<any> } A new `Task` that can be ran via `fork`.
   */
  public static compose(...tasks: Task<any>[]) {
    return tasks.reduce((previousFn, fn) => previousFn.map(fn.unwrap()));
  }

  /**
   * Retries allowed by the `fork` method.
   */
  private retries = 0;

  /**
   * A class that holds a `Promise` or a sync function.
   */
  private constructor(
    private value: AnyFunction<Promise<S>> | AnyFunction<S>
  ) {}

  /**
   * Add a way to cancel a `Promise` if given timeout is reached.
   *
   * @param { Promise<S> } promise The promise to make cancellable.
   * @param { number } ms The number of milliseconds after which to cancel the promise.
   * @param { string } message The message to pass to resulting `Error`.
   * @returns { AnyFunction<Promise<S>> } The promise cancellable.
   *
   * @see https://stackoverflow.com/a/75075448/1060921
   */
  private wrapTimeout(
    promise: Promise<S>,
    ms: number,
    message = 'Timeout'
  ): AnyFunction<Promise<S>> {
    let timer: any;

    const timerPromise = new Promise<any>((_, reject) => {
      timer = setTimeout(() => {
        timer = null;
        reject(new Error(`${message} (${ms}ms)`));
      }, ms);
    });

    // Make sure the timer doesn't keep running if the promise finished first.
    promise.finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    });

    return () => Promise.race([promise, timerPromise]);
  }

  /**
   * Map a function to a new `Task`.
   *
   * @param { AnyFunction<Promise<R>> | AnyFunction<R> } fn The function to map.
   * @returns { Task<R> } A new `Task`.
   */
  public map(fn: AnyFunction<any, Promise<S>> | AnyFunction<any, S>) {
    return this.flatMap(() => Task.of(fn));
  }

  /**
   * Return a new `Task` made of all preceding `Task`s piped from one to the next.
   *
   * @param { AnyFunction<Task<R>> } fn A function returning a `Task`.
   * @returns { Task<R> } A new `Task` bound to this one.
   */
  public flatMap(fn: AnyFunction<any, Task<S>>): Task<S> {
    // Get the underlying function of the Task returned by the function and pipe them.
    return Task.of(pipeAsync(this.value, fn().unwrap()));
  }

  /**
   * Transform
   *
   * @param { number } ms The number of milliseconds to wait for a result.
   * @param { string } message The message to pass to eventual `Error`.
   * @returns { Task<S> } This same `Task` with wrapped value.
   *
   * @unpure
   * @todo: Make pure.
   */
  public timeout(ms: number, message?: string) {
    // Unwrap the underlying promise to pass it to the timeout function.
    this.value = this.wrapTimeout(this.value() as Promise<S>, ms, message);
    return this;
  }

  /**
   * Throw if condition is not met.
   *
   * @param { AnyFunction<boolean> } fn A predicate function.
   * @param { string } message The message to pass to eventual `Error`.
   * @returns { Task<S> } A new `Task`.
   */
  public throw(fn: AnyFunction<any, boolean>, message = 'Canceled'): Task<S> {
    return this.map((val: S) => {
      if (fn(val) === true) return val;
      throw new Error(message);
    });
  }

  /**
   * Run the task.
   *
   * @param { number } retries The number of retries if `fork` fails.
   * @param { number } after The number of milliseconds to wait before retries.
   * @returns { Promise<Result<S, Error>> } The result of the `Task` as `Result`.
   */
  public async fork(retries = 0, after = 0): Promise<Result<S, Error>> {
    try {
      const res = await this.value();
      return Result.Success(res);
    } catch (err: unknown) {
      this.retries = retries;
      if (this.retries > 0) {
        // Retry in case of error.
        await wait(after);
        this.retries--;
        return await this.fork(this.retries);
      }

      return Result.Failure(err as Error);
    }
  }

  /**
   * Unwrap the function nested in the `Task` object.
   *
   * @returns { AnyFunction<Promise<S>> | AnyFunction<S> } The function.
   */
  public unwrap(): AnyFunction<Promise<S>> | AnyFunction<S> {
    return this.value;
  }
}
