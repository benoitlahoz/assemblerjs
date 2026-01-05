import type { Concrete } from '@assemblerjs/core';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import type { ParameterResolver } from '../types';

/**
 * Resolver for @Dispose decorator.
 */
class DisposeResolver implements ParameterResolver {
  resolve(index: number, injectable: AbstractInjectable<any>, _concrete: Concrete<any>): any {
    return injectable.privateContext.dispose;
  }
}

/**
 * Injects the injectable's dispose function.
 * @returns A parameter decorator
 */
export const Dispose = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Dispose', DisposeResolver);

  return ParameterDecoratorFactory.create<void>({
    name: 'Dispose',
    valueType: 'array', // No parameters needed, just mark indexes
    resolver: DisposeResolver
  });
})();