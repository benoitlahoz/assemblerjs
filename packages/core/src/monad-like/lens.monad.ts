import { AnyFunction } from '@/function.types';
import { Monad } from './monad.abstract';
import { tryCatch } from '@/error.utils';
import { setValueAtPath, valueAtPath } from '@/object.utils';

export class Lens implements Monad<string> {
  /**
   * Create a Lens with key.
   *
   * @param { ...path: PropertyKey[] } path One or more strings, symbols or number that define the path.
   * @returns { Lens } A lens with key converted to string with paths elements separated by dots..
   */
  public static of(...path: PropertyKey[]): Lens {
    return new Lens(path.map((p: PropertyKey) => String(p)).join('.'));
  }

  /**
   * Compose multiple lenses together and create a new Lens from them.
   *
   * @param { ...lenses: Lens[] } lenses The lenses to comose.
   * @returns { Lens } A new Lens.
   */
  public static compose(...lenses: Lens[]): Lens {
    const path = lenses.map((lens: Lens) => lens.key);
    return Lens.of(...path) as Lens;
  }

  private constructor(public readonly key: string) {}

  /**
   * Map the Lens with function returning a key.
   *
   * @param { (key: string) => string | number } fn A function that returns a new key.
   * @returns { Lens } A new lens from this path to the new property key.
   */
  // @ts-expect-error Todo: compatible type with Monad
  public map(fn: (key: string) => string | number): Lens {
    return this.flatMap((v: string) => Lens.of(fn(v)));
  }

  /**
   * Map the Lens with function returning a Lens.
   *
   * @param { (key: string) => Lens } fn A function that returns a Lens.
   * @returns { Lens } A new lens from this path to the passed Lens property key.
   */
  // @ts-expect-error Todo: compatible type with Monad
  public flatMap(fn: (key: string) => Lens): Lens {
    return Lens.of(this.key, fn(this.key).unwrap());
  }

  /**
   * Create a new Lens from this one at given subpath.
   *
   * @param { ...PropertyKey[] } path successive keys passed as arguments.
   * @returns { Lens } A new lens from tjis one to path.
   */
  public at(...path: PropertyKey[]): Lens {
    return Lens.of(
      `${this.key}.${path.map((p: PropertyKey) => String(p)).join('.')}`
    );
  }

  /**
   * Get the value at this Lens path for given object.
   *
   * @param { Record<PropertyKey, T> | T[] } obj An object or array.
   * @returns { T | undefined } The value of the object focused on this lens path.
   */
  public get<T>(obj: Record<PropertyKey, T> | T[]): T {
    return valueAtPath(String(this.key))(obj);
  }

  /**
   * Get the key of this lens.
   *
   * @returns { string } The key for this lens.
   */
  public unwrap(): string {
    return this.key;
  }

  /**
   * Modify the value at this lens path for given object.
   *
   * @param { Record<PropertyKey, T> | T[] } obj An object or array to focus in.
   * @param { unknown } value The new value at this path.
   * @returns { Record<PropertyKey, T> | T[] | undefined } The modified object or undefined
   * if key was not found.
   */
  public modify<T>(
    obj: Record<PropertyKey, T> | T[],
    value: unknown
  ): Record<PropertyKey, T> | T[] | undefined {
    // `setValueAtPath` is pure, just double check this.key is a string.
    const ret = tryCatch(() => setValueAtPath(String(this.key))(obj, value));
    return ret.fold(
      (_) => undefined,
      (result: Record<PropertyKey, T> | T[]) => result
    );
  }

  /**
   * Get a function to modify an object through another applied function.
   *
   * @param { AnyFunction<T> } fn A function that will be applied on call.
   * @returns { (obj: Record<PropertyKey, T> | T[]) =>  Record<PropertyKey, T> | T[] | undefined } A function
   * to apply to object, that returns the modified object or undefined if not found.
   */
  public apply<T, U>(fn: AnyFunction<T, U>): any {
    return (obj: Record<PropertyKey, T> | T[]) => {
      const setValue = setValueAtPath(String(this.key));
      const ret = tryCatch(() => setValue(obj, fn(this.get(obj))));
      return ret.fold(
        (_) => undefined,
        (result: Record<PropertyKey, T> | T[]) => result
      );
    };
  }
}
