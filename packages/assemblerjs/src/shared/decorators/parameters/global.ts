import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata } from '@/shared/common';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { DebugLogger } from '@/features/assembler/lib/debug-logger';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import { getParamValueKey } from './helpers';
import type { ParameterResolver } from '../types';


/**
 * Resolver for @Global decorator.
 */
class GlobalResolver implements ParameterResolver {
  resolve(index: number, injectable: AbstractInjectable<any>, concrete: Concrete<any>): any {
    const identifiers = getOwnCustomMetadata(getParamValueKey('Global'), concrete);
    const identifier = identifiers[index];
    DebugLogger.getInstance().logInjection('global', {
      target: concrete?.name,
      index,
      identifier: typeof identifier === 'symbol' ? identifier.toString() : identifier,
    });
    return injectable.privateContext.global(identifier);
  }
}

/**
 * Legacy function for backward compatibility with constructor-decorator.
 * @param identifier The identifier of the global object to inject
 * @param target The target class
 * @param index The parameter index
 */
export const decorateGlobal = (
  identifier: string | symbol,
  target: any,
  index: number
) => {
  // Call the decorator directly
  Global(identifier)(target, undefined, index);
};


/**
 * Injects a global object by its identifier.
 * @param identifier The identifier of the global object to inject
 * @returns A parameter decorator
 */
export const Global = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Global', GlobalResolver);

  return ParameterDecoratorFactory.create<string | symbol>({
    name: 'Global',
    valueType: 'map',
    resolver: GlobalResolver,
    handler: decorateGlobal, // Register the handler for constructor-decorator
  });
})();

