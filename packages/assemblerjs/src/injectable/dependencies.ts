import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata, getParamTypes } from '@/common';
import { ReflectParamValue, getDecoratedParametersIndexes } from '@/decorators';
import { AbstractInjectable } from '@/injectable';

/**
 * Get an array of parameters from an `Injectable` constructor, including decorated ones.
 *
 * @param { Injectable<T> } injectable The `Injectable` to get constructor's parameters.
 * @returns { any[] } An array of passed parameters.
 */
export const resolveInjectableParameters = <T>(
  injectable: AbstractInjectable<T>
) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(injectable.concrete);
  const indexes = getDecoratedParametersIndexes(injectable.concrete);

  // Build parameters to pass to instance.
  let i = 0;
  for (const dependency of paramTypes) {
    if (indexes.Context.includes(i)) {
      parameters.push(injectable.publicContext);
      i++;
      continue;
    }

    if (indexes.Configuration.includes(i)) {
      parameters.push(injectable.configuration);
      i++;
      continue;
    }

    if (indexes.Definition.includes(i)) {
      parameters.push(injectable.definition);
      i++;
      continue;
    }

    if (indexes.Dispose.includes(i)) {
      parameters.push(injectable.privateContext.dispose);
      i++;
      continue;
    }

    if (indexes.Use.includes(i)) {
      const identifiers = getOwnCustomMetadata(
        ReflectParamValue.UseIdentifier,
        injectable.concrete
      );
      const identifier = identifiers[i];
      parameters.push(injectable.privateContext.require(identifier));
      i++;
      continue;
    }

    if (indexes.Global.includes(i)) {
      const identifiers = getOwnCustomMetadata(
        ReflectParamValue.GlobalIdentifier,
        injectable.concrete
      );
      const identifier = identifiers[i];
      parameters.push(injectable.privateContext.global(identifier));
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
