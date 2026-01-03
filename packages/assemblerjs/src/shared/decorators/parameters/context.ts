import type { Concrete } from '@assemblerjs/core';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import type { ParameterResolver } from '../types';

/**
 * Resolver for @Context decorator.
 */
class ContextResolver implements ParameterResolver {
  resolve(index: number, injectable: AbstractInjectable<any>, _concrete: Concrete<any>): any {
    return injectable.publicContext;
  }
}

/**
 * Injects the injectable's public context.
 * @returns A parameter decorator
 */
export const Context = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Context', ContextResolver);

  return ParameterDecoratorFactory.create<void>({
    name: 'Context',
    valueType: 'array', // No parameters needed, just mark indexes
    resolver: ContextResolver
  });
})();