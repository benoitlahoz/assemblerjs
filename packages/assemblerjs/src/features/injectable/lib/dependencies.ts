import type { Concrete } from '@assemblerjs/core';
import { getParamTypes } from '@/shared/common';
import { getDecoratedParametersIndexes } from '@/shared/decorators';
import { AbstractInjectable } from '@/features/injectable';
import { ParameterResolverFactory } from '@/shared/decorators/resolvers';

/**
 * Helper function to determine the decorator type for a given parameter index.
 */
const getDecoratorType = (indexes: ReturnType<typeof getDecoratedParametersIndexes>, index: number): string | null => {
  if (indexes.Context.includes(index)) return 'Context';
  if (indexes.Configuration.includes(index)) return 'Configuration';
  if (indexes.Definition.includes(index)) return 'Definition';
  if (indexes.Dispose.includes(index)) return 'Dispose';
  if (indexes.Use.includes(index)) return 'Use';
  if (indexes.Global.includes(index)) return 'Global';
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
 *
 * @param { Concrete<T> } target The `Concrete` to get constructor's parameters.
 * @returns { any[] } An array of passed parameters.
 */
export const resolveDependencies = <T>(target: Concrete<T>) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(target);
  const indexes = getDecoratedParametersIndexes(target);

  let i = 0;
  for (const dependency of paramTypes) {
    if (
      indexes.Context.includes(i) ||
      indexes.Configuration.includes(i) ||
      indexes.Definition.includes(i) ||
      indexes.Dispose.includes(i) ||
      indexes.Use.includes(i) ||
      indexes.Global.includes(i)
    ) {
      i++;
      continue;
    }

    parameters.push(dependency);
    i++;
  }

  return parameters;
};
