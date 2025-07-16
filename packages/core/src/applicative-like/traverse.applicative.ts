import { isAsync, isPromise } from '../type.validator';

/**
 * Traverse class implementing applicative functor pattern for arrays
 * Allows applying an array of functions to arrays of values, collecting results
 */
export class Traverse<T, U> {
  /**
   * Creates a new Traverse instance wrapping an array of functions.
   * Handles both sync and async functions.
   * @param functions Array of functions to wrap (sync or async)
   * @returns New Traverse instance
   */
  static of<T, U>(
    functions: Array<(value: T) => U | Promise<U>>
  ): Traverse<T, U | Promise<U>> {
    return new Traverse(functions);
  }

  private constructor(
    private readonly functions: Array<(value: T) => U | Promise<U>>
  ) {}

  /**
   * Applies the wrapped functions to an array of values.
   * Handles both sync and async functions, returning a Promise of all results.
   * @param values Array of values to apply functions to
   * @returns Promise resolving to array of results from applying functions to values
   */
  async ap(values?: T[]): Promise<U[]> {
    const results: U[] = [];
    const valuesToUse = values || [undefined as T];

    for (const fn of this.functions) {
      for (const val of valuesToUse) {
        try {
          let res: U;
          if (isAsync(fn) || isPromise(fn)) {
            res = (await fn(val)) as U;
          } else {
            res = fn(val) as U;
          }
          results.push(res);
        } catch (err) {
          results.push(err as U);
        }
      }
    }

    return results as U[];
  }

  /**
   * Maps a function over the wrapped functions
   * @param fn Function to transform each function
   * @returns New Traverse instance with transformed functions
   */
  map<V>(
    fn: (func: (value: T) => U | Promise<U>) => (value: T) => V | Promise<V>
  ): Traverse<T, V | Promise<V>> {
    return new Traverse(this.functions.map(fn));
  }

  /**
   * Gets the wrapped functions
   * @returns Array of wrapped functions
   */
  getFunctions(): ((value: T) => U | Promise<U>)[] {
    return [...this.functions];
  }

  /**
   * Chains multiple Traverse operations
   * @param fn Function that returns a Traverse instance
   * @returns Flattened Traverse instance
   */
  chain<V>(
    fn: (func: (value: T) => U | Promise<U>) => Traverse<T, V | Promise<V>>
  ): Traverse<T, V | Promise<V>> {
    const results: ((value: T) => V | Promise<V>)[] = [];
    for (const func of this.functions) {
      results.push(
        ...(fn(func).getFunctions() as ((value: T) => V | Promise<V>)[])
      );
    }
    return new Traverse(results);
  }
}
