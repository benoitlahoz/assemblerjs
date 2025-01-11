import type { Abstract, Concrete } from '@/types';
import { isClass, isObject, conditionally, pipe, switchCase } from '@/utils';
import {
  BaseInjection,
  ConfiguredInjection,
  ConcreteConfiguredInjection,
  ConcreteInjection,
  Injection,
  InstanceInjection,
  Buildable,
} from './injection.types';

/**
 * Resolve a `ConcreteInjection`.
 *
 * @param { ConcreteInjection<T> } tuple A tuple of length 1.
 * @returns { Buildable } The result of the registration.
 */
const resolveConcreteInjection = <T>(tuple: ConcreteInjection<T>) => {
  return {
    identifier: tuple[0] as Abstract<T>,
    concrete: tuple[0] as Concrete<T>,
    configuration: {},
  };
};

/**
 * Resolve a `BaseInjection`,  `ConcreteConfiguredInjection`.
 *
 * @param { BaseInjection<T> | ConcreteConfiguredInjection<T> } tuple A tuple of length 2.
 * @returns { Buildable } The result of the registration.
 */
const resolveLengthTwoInjection = <T>(
  tuple: BaseInjection<T> | ConcreteConfiguredInjection<T>
) => {
  const isBaseInjection = () => isClass(tuple[0]) && isClass(tuple[1]);
  const isConfiguredInjection = () => isClass(tuple[0]) && isObject(tuple[1]);

  const fork = () =>
    pipe(
      // Both objects are classes, without configuration.

      conditionally({
        if: () => isBaseInjection(),
        then: () => {
          return {
            identifier: tuple[0] as Abstract<T>,
            concrete: tuple[1] as Concrete<T>,
            configuration: {},
          };
        },
      }),
      // First object is a class, second an instance or configuration.

      conditionally({
        if: () => isConfiguredInjection(),
        then: () => {
          return {
            identifier: tuple[0] as Abstract<T>,
            concrete: tuple[0] as Concrete<T>,
            configuration: tuple[1],
          };
        },
        else: (res: Buildable<T>) => res,
      })
    )();

  return fork();
};

/**
 * Resolve a `ConfiguredInjection`.
 *
 * @param { ConcreteInjection<T> } tuple A tuple of length 3.
 * @returns { Buildable } The result of the registration.
 */
const resolveConfiguredInjection = <T>(tuple: ConfiguredInjection<T>) => {
  return {
    identifier: tuple[0] as Abstract<T>,
    concrete: tuple[1] as Concrete<T>,
    configuration: tuple[2],
  };
};

/**
 * Resolve an `Injection` with a tuple of length 1, 2 or 3.
 *
 * @param { Injection<T> } tuple A tuple of length 1, or 3.
 * @returns { ConfigurableRegistration } The result of the registration.
 */
export const resolveInjectionTuple = <T>(tuple: Injection<T>): Buildable<T> =>
  switchCase(
    {
      1: () => resolveConcreteInjection(tuple as ConcreteInjection<T>),
      2: () =>
        resolveLengthTwoInjection(
          tuple as BaseInjection<T> | ConcreteConfiguredInjection<T>
        ),
      3: () => resolveConfiguredInjection(tuple as ConfiguredInjection<T>),
    },
    () => {
      throw new Error(`Injection tuple must be of length 1, 2 or 3.`);
    }
  )(tuple.length);

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
