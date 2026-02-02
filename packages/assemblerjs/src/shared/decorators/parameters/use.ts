import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata } from '@/shared/common';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { DebugLogger } from '@/features/assembler/lib/debug-logger';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import { getParamValueKey } from './helpers';
import type { ParameterResolver } from '../types';

/**
 * Identifier can be a string, symbol, or an abstract class/interface.
 */
export type UseIdentifier = string | symbol | Function;

/**
 * Resolver for @Use decorator.
 */
class UseResolver implements ParameterResolver {
  resolve(index: number, injectable: AbstractInjectable<any>, concrete: Concrete<any>): any {
    const identifiers = getOwnCustomMetadata(getParamValueKey('Use'), concrete);
    const identifier = identifiers[index];
    DebugLogger.getInstance().logInjection('use', {
      target: concrete?.name,
      index,
      identifier: typeof identifier === 'symbol' ? identifier.toString() : identifier,
    });
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
  identifier: UseIdentifier,
  target: any,
  index: number
) => {
  // Call the decorator directly
  Use(identifier)(target, undefined, index);
};

/**
 * Injects an object passed with `string`, `symbol` or abstract class identifier.
 * The identifier can be:
 * - A string: @Use('logger')
 * - A symbol: @Use(Symbol.for('logger'))
 * - An abstract class: @Use(ILogger)
 *
 * @param identifier The identifier of the object to inject
 * @returns A parameter decorator
 */
export const Use = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Use', UseResolver);

  return ParameterDecoratorFactory.create<UseIdentifier>({
    name: 'Use',
    valueType: 'map',
    resolver: UseResolver,
    handler: decorateUse, // Register the handler for constructor-decorator
  });
})();


