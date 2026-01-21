import type { Abstract, Concrete, Tuple } from '@assemblerjs/core';
import {
  conditionally,
  isClass,
  isObject,
  pipe,
  switchCase,
} from '@assemblerjs/core';
import type { Identifier } from '@/shared/common';

/**
 * Injectable binds a concrete class to an abstract class as identifier without configuration.
 */
export type BaseInjection<T> = Tuple<[Abstract<T>, Concrete<T>]>;

/**
 * Injectable binds a concrete class to an abstract class as identifier
 * and provides a configuration object that will be passed to context.
 */
export type ConfiguredInjection<T> = Tuple<
  [Abstract<T>, Concrete<T>, Record<string, any>]
>;

/**
 * Injectable binds a conrete class to itself as identifier.
 */
export type ConcreteInjection<T> = Tuple<[Concrete<T>]>;

/**
 * Injection binds a concrete class to itself as identifier
 * and provides a configuration object that will be passed to context.
 */
export type ConcreteConfiguredInjection<T> = Tuple<
  [Concrete<T>, Record<string, any>]
>;

/**
 * A generic injection tuple.
 */
export type Injection<T> =
  | BaseInjection<T>
  | ConfiguredInjection<T>
  | ConcreteInjection<T>
  | ConcreteConfiguredInjection<T>;

/**
 * Describes a buildable object.
 */
export interface Buildable<T> {
  identifier: Identifier<T>;
  concrete?: Concrete<T>;
  instance?: T;
  factory?: () => T;
  configuration: Record<string, any>;
}


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
