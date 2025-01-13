import type { Concrete } from '@/common';
import { getOwnCustomMetadata, getParamTypes } from '@/common';
import { ReflectParamValue, getDecoratedParametersIndexes } from '@/decorators';
import { AbstractInjectable } from '@/injectable';

/**
 * Get an array of parameters from an `Injectable` constructor, including decorated ones.
 *
 * @param { Injectable<T> } injectable The `Injectable` to get constructor's parameters.
 * @returns { any[] } An array of passed parameters.
 */
export const resolveParameters = <T>(injectable: AbstractInjectable<T>) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(injectable.concrete);
  const indexes = getDecoratedParametersIndexes(injectable.concrete);

  // Build parameters to pass to instance.
  let i = 0;
  for (const dependency of paramTypes) {
    if (indexes.context.includes(i)) {
      parameters.push(injectable.publicContext);
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

    if (indexes.dispose.includes(i)) {
      parameters.push(injectable.privateContext.dispose);
      i++;
      continue;
    }

    if (indexes.use.includes(i)) {
      const identifiers = getOwnCustomMetadata(
        ReflectParamValue.UseIdentifier,
        injectable.concrete
      );
      const identifier = identifiers[i];
      parameters.push(injectable.privateContext.require(identifier));
      i++;
      continue;
    }

    // Recursively require dependency to pass an instance to constructor.
    parameters.push(injectable.privateContext.require(dependency));

    i++;
  }

  return parameters;
};

/**
 * Get an array of parameters from an `Injectable` constructor, excluding non-dependency ones.
 *
 * @param { AbstractInjectable<T> } injectable The `Injectable` to get constructor's parameters.
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
      indexes.definition.includes(i) ||
      indexes.dispose.includes(i) ||
      indexes.use.includes(i)
    ) {
      i++;
      continue;
    }

    parameters.push(dependency);
    i++;
  }

  return parameters;
};
