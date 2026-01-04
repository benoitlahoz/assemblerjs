import type { Concrete } from '@assemblerjs/core';
import { getParamTypes } from '@/shared/common';
import { getDecoratedParametersIndexes } from '@/shared/decorators';
import { AbstractInjectable } from '@/features/injectable';
import { ParameterResolverFactory } from '@/shared/decorators/resolvers';

// Cache for resolved dependencies to avoid repeated reflection calls
const dependenciesCache = new WeakMap<Function, any[]>();

/**
 * Helper function to determine the decorator type for a given parameter index.
 * Now uses dynamic decorator registration instead of hardcoded names.
 */
const getDecoratorType = (indexes: ReturnType<typeof getDecoratedParametersIndexes>, index: number): string | null => {
  for (const [decoratorName, decoratorIndexes] of Object.entries(indexes)) {
    if (decoratorIndexes.includes(index)) {
      return decoratorName;
    }
  }
  return null;
};

/**
 * Get an array of parameters from an `Injectable` constructor, including decorated ones.
 *
 * @param { Injectable<T> } injectable The `Injectable` to get constructor's parameters.
 * @param { Record<string, any> } configuration Optional configuration to override the injectable's configuration.
 * @returns { any[] } An array of passed parameters.
 */
export const resolveInjectableParameters = <T>(
  injectable: AbstractInjectable<T>,
  configuration?: Record<string, any>
) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(injectable.concrete);
  const indexes = getDecoratedParametersIndexes(injectable.concrete);

  // Build parameters to pass to instance.
  for (let i = 0; i < paramTypes.length; i++) {
    const decoratorType = getDecoratorType(indexes, i);

    if (decoratorType) {
      // Use the appropriate resolver for decorated parameters
      const resolver = ParameterResolverFactory.getResolver(decoratorType);
      parameters.push(resolver.resolve(i, injectable, injectable.concrete, configuration));
    } else {
      // Recursively require dependency to pass an instance to constructor.
      parameters.push(injectable.privateContext.require(paramTypes[i]));
    }
  }

  return parameters;
};

/**
 * Get an array of parameters from an `Concrete` constructor, excluding non-dependency ones.
 * Uses cache to avoid repeated reflection calls for the same concrete class.
 *
 * @param { Concrete<T> } target The `Concrete` to get constructor's parameters.
 * @returns { any[] } An array of passed parameters.
 */
export const resolveDependencies = <T>(target: Concrete<T>) => {
  // Check cache first
  if (dependenciesCache.has(target)) {
    return dependenciesCache.get(target)!;
  }

  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(target);
  const indexes = getDecoratedParametersIndexes(target);

  let i = 0;
  for (const dependency of paramTypes) {
    // Check if this parameter has any decorator
    const hasDecorator = Object.values(indexes).some(decoratorIndexes => decoratorIndexes.includes(i));
    
    if (hasDecorator) {
      i++;
      continue;
    }

    parameters.push(dependency);
    i++;
  }

  // Cache the result
  dependenciesCache.set(target, parameters);

  return parameters;
};
