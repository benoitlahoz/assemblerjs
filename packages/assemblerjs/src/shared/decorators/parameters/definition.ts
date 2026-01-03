import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import type { ParameterResolver } from '../types';

/**
 * Resolver for @Definition decorator.
 */
class DefinitionResolver implements ParameterResolver {
  resolve(_index: number, injectable: AbstractInjectable<any>): any {
    return injectable.definition;
  }
}

/**
 * Injects the injectable's definition object.
 * @returns A parameter decorator
 */
export const Definition = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Definition', DefinitionResolver);

  return ParameterDecoratorFactory.create<void>({
    name: 'Definition',
    valueType: 'array', // No parameters needed, just mark indexes
    resolver: DefinitionResolver
  });
})();