import { Concrete } from '@/types';
import { getDecoratedParametersIndexes } from './decorators';
import { getParamTypes } from '@/assemblage/reflection';
import { Injectable } from './injectable';

/**
 * Get an array of parameters from an `Injectable` constructor, including decorated ones.
 *
 * @param { Injectable<T> } injectable The `Injectable` to get constructor's parameters.
 * @returns { any[] } An array of passed parameters.
 */
export const resolveParameters = <T>(injectable: Injectable<T>) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(injectable.concrete);
  const indexes = getDecoratedParametersIndexes(injectable.concrete);

  // Build parameters to pass to instance.
  let i = 0;
  for (const dependency of paramTypes) {
    if (indexes.context.includes(i)) {
      parameters.push(injectable.context);
      i++;
      continue;
    }

    if (indexes.configuration.includes(i)) {
      parameters.push(injectable.configuration);
      i++;
      continue;
    }

    if (indexes.definition.includes(i)) {
      parameters.push(injectable.definition);
      i++;
      continue;
    }

    // Recursively require dependency to pass an instance to constructor.
    parameters.push(injectable.context.require(dependency));

    i++;
  }

  return parameters;
};

/**
 * Get an array of parameters from an `Injectable` constructor, excluding non-dependency ones.
 *
 * @param { Injectable<T> } injectable The `Injectable` to get constructor's parameters.
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
      indexes.context.includes(i) ||
      indexes.configuration.includes(i) ||
      indexes.definition.includes(i)
    ) {
      i++;
      continue;
    }

    parameters.push(dependency);
    i++;
  }

  return parameters;
};
