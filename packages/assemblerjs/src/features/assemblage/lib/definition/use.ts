import type { Abstract, Concrete, Tuple } from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';

/**
 * Factory function that returns an instance of type T.
 */
export type Factory<T> = () => T;

/**
 * Injectable binds an instance or factory of a class to an identifier (abstract or concrete).
 * The second element can be either an instance or a factory function that returns an instance.
 */
export type InstanceInjection<T> = Tuple<[Identifier<T> | string | symbol, T | Factory<T>]>;

/**
 * Helper to determine if a value is a factory function (vs an instance).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } True if the value is a function (factory).
 */
export const isFactory = (value: unknown): value is Factory<any> => {
  // Treat only zero-arg functions (typical factory signature) as factories.
  // Functions expecting arguments (e.g., fetch) are considered instances.
  return typeof value === 'function' && value.length === 0 && !isNativeClass(value);
};

/**
 * Helper to check if a function is a native class constructor.
 * Used to distinguish between classes and factory functions.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } True if the value appears to be a class.
 */
const isNativeClass = (value: unknown): boolean => {
  if (typeof value !== 'function') {
    return false;
  }
  
  const stringified = value.toString();
  // Classes have 'class' keyword or inherited from native
  return /^class\s/.test(stringified) || 
         Object.getPrototypeOf(value) === Function.prototype && /^class\s/.test(stringified);
};

/**
 * Resolves injection of an already instantiated class or object, or a factory function.
 *
 * @param { InstanceInjection<T> } tuple A tuple of length 2.
 * @returns { Buildable } The result of the registration.
 */
export const resolveInstanceInjectionTuple = <T>(
  tuple: InstanceInjection<T>
) => {
  const value = tuple[1];
  const isFactoryValue = isFactory(value);
  return {
    identifier: tuple[0] as Abstract<T>,
    concrete: undefined as unknown as Concrete<T>,
    instance: isFactoryValue ? undefined : (value as T),
    factory: isFactoryValue ? (value as Factory<T>) : undefined,
    configuration: {},
  };
};
