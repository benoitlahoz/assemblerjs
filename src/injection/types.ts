import type { Abstract, Concrete, Identifier, Tuple } from '@/types';

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
  concrete: Concrete<T>;
  configuration: Record<string, any>;
}
