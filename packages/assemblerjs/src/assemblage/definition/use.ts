import { Abstract, Concrete, Identifier, Tuple } from '@/common';

/**
 * Injectable binds an instance of a class to an identifier (abstract or concrete).
 */
export type InstanceInjection<T> = Tuple<[Identifier<T> | string | symbol, T]>;

/**
 * Resolves injection of an already instantiated class or object.
 *
 * @param { InstanceInjection<T> } tuple A tuple of length 2.
 * @returns { Buildable } The result of the registration.
 */
export const resolveInstanceInjectionTuple = <T>(
  tuple: InstanceInjection<T>
) => {
  return {
    identifier: tuple[0] as Abstract<T>,
    concrete: tuple[0] as Concrete<T>,
    instance: tuple[1] as T,
    configuration: {},
  };
};
