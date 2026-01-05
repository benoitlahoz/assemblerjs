import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata, getParamTypes } from '@/shared/common';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import { getParamValueKey } from './helpers';
import type { ParameterResolver } from '../types';

/**
 * Resolver for @Optional decorator.
 * Attempts to resolve the dependency but returns a default value (or undefined) 
 * instead of throwing if the dependency is not available.
 */
class OptionalResolver implements ParameterResolver {
  resolve(
    index: number, 
    injectable: AbstractInjectable<any>, 
    concrete: Concrete<any>
  ): any {
    try {
      const paramTypes = getParamTypes(concrete);
      const dependency = paramTypes[index];
      
      // Attempt to resolve the dependency
      return injectable.privateContext.require(dependency);
    } catch {
      // If the dependency doesn't exist, return the default value
      const defaultValues = getOwnCustomMetadata(getParamValueKey('Optional'), concrete);
      
      // Return the default value if provided, otherwise undefined
      return defaultValues?.[index];
    }
  }
}

/**
 * Marks a constructor parameter as optional.
 * If the dependency is not available, the provided default value (or undefined) will be injected.
 * 
 * @param defaultValue Optional default value to use when the dependency is not available.
 *                     If not provided, undefined will be injected.
 * 
 * @example
 * // Without default value - injects undefined if not available
 * class MyService {
 *   constructor(
 *     private logger: Logger,              // Required
 *     @Optional() private cache?: Cache    // Optional - undefined if not available
 *   ) {}
 * }
 * 
 * @example
 * // With default value
 * class MyService {
 *   constructor(
 *     @Optional(new ConsoleLogger()) private logger: Logger,
 *     @Optional(null) private cache: Cache | null
 *   ) {}
 * }
 */
export const Optional = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Optional', OptionalResolver);

  return ParameterDecoratorFactory.create<any>({
    name: 'Optional',
    valueType: 'map', // Use 'map' to store default values by index
    resolver: OptionalResolver,
  });
})();
