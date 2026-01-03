import type { Concrete } from '@assemblerjs/core';
import { getOwnCustomMetadata } from '@/shared/common';
import { ParameterDecoratorFactory } from './parameter-decorator-factory';
import type { ParametersDecoratorsIndexes } from '../types';

/**
 * Generates the reflection key for parameter index based on decorator name.
 * Must match the format used by ParameterDecoratorFactory.
 */
export const getParamIndexKey = (decoratorName: string): string => {
  return `assemblage:${decoratorName.toLowerCase()}.param.index`;
};

/**
 * Generates the reflection key for parameter value based on decorator name.
 * Must match the format used by ParameterDecoratorFactory.
 */
export const getParamValueKey = (decoratorName: string): string => {
  return `assemblage:${decoratorName.toLowerCase()}.param.value`;
};

/**
 * Generic function to get parameter indexes for a specific decorator.
 * @param decoratorName The name of the decorator (e.g., 'Context', 'Use', 'Global')
 * @param concrete The concrete class to get indexes from
 * @returns Array of parameter indexes
 */
export const getParameterIndexes = <T>(
  decoratorName: string,
  concrete: Concrete<T>
): number[] => {
  return getOwnCustomMetadata(getParamIndexKey(decoratorName), concrete) || [];
};

/**
 * Generic function to get parameter values for a specific decorator.
 * @param decoratorName The name of the decorator (e.g., 'Context', 'Use', 'Global')
 * @param concrete The concrete class to get values from
 * @returns The stored values (type depends on decorator's valueType configuration)
 */
export const getParameterValues = <T, V = any>(
  decoratorName: string,
  concrete: Concrete<T>
): V => {
  return getOwnCustomMetadata(getParamValueKey(decoratorName), concrete);
};

/**
 * Gets all decorated parameter indexes for registered decorators.
 * Dynamically retrieves indexes for all decorators registered in ParameterDecoratorFactory.
 * @param target The concrete class to inspect
 * @returns Object with indexes for each decorator type
 */
export const getDecoratedParametersIndexes = <T>(
  target: Concrete<T>
): ParametersDecoratorsIndexes => {
  const registeredDecorators = ParameterDecoratorFactory.getRegisteredDecorators();
  const result: ParametersDecoratorsIndexes = {};

  for (const decoratorName of registeredDecorators) {
    result[decoratorName] = getParameterIndexes(decoratorName, target);
  }

  return result;
};
