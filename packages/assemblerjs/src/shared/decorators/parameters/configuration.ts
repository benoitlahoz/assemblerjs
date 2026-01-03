import type { Concrete } from '@assemblerjs/core';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import { ResolverStore } from '../resolvers';
import type { ParameterResolver } from '../types';

/**
 * Resolver for @Configuration decorator.
 */
class ConfigurationResolver implements ParameterResolver {
  resolve(index: number, injectable: AbstractInjectable<any>, _concrete: Concrete<any>, config?: Record<string, any>): any {
    return config || injectable.configuration;
  }
}

/**
 * Injects the injectable's configuration object.
 * @returns A parameter decorator
 */
export const Configuration = (() => {
  // Register the resolver when the decorator is created
  ResolverStore.register('Configuration', ConfigurationResolver);

  return ParameterDecoratorFactory.create<void>({
    name: 'Configuration',
    valueType: 'array', // No parameters needed, just mark indexes
    resolver: ConfigurationResolver
  });
})();