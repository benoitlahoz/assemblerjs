import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata } from '@/shared/common';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import { getParamValueKey } from './helpers';
import type { ParameterResolver } from '../types';

/**
 * Resolver for @Use decorator.
 */
class UseResolver implements ParameterResolver {
  resolve(index: number, injectable: AbstractInjectable<any>, concrete: Concrete<any>): any {
    const identifiers = getOwnCustomMetadata(getParamValueKey('Use'), concrete);
    const identifier = identifiers[index];
    return injectable.privateContext.require(identifier);
  }
}

/**
 * Legacy function for backward compatibility with constructor-decorator.
 * @param identifier The identifier of the object to inject
 * @param target The target class
 * @param index The parameter index
 */
export const decorateUse = (
  identifier: string | symbol,
  target: any,
  index: number
) => {
  // Call the decorator directly
  Use(identifier)(target, undefined, index);
};

/**
 * Injects an object passed with `string` or `symbol` identifier.
 * @param identifier The identifier of the object to inject
 * @returns A parameter decorator
 */
export const Use = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Use', UseResolver);

  return ParameterDecoratorFactory.create<string | symbol>({
    name: 'Use',
    valueType: 'map',
    resolver: UseResolver,
    handler: decorateUse, // Register the handler for constructor-decorator
  });
})();


