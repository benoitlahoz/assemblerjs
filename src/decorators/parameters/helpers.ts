import type { Concrete } from '@/common';
import { getOwnCustomMetadata } from '@/assemblage';
import { ReflectParamIndex } from './constants';

const getContextIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectParamIndex.Context, concrete) || [];
};

const getConfigurationIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectParamIndex.Configuration, concrete) || [];
};

const getDefinitionIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectParamIndex.Definition, concrete) || [];
};

const getDisposeIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectParamIndex.Dispose, concrete) || [];
};

const getUseIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectParamIndex.Use, concrete) || [];
};

export const getDecoratedParametersIndexes = <T>(target: Concrete<T>) => {
  // Get indexes of decorated constructor parameters, etc.
  const context: number[] = getContextIndex(target) || [];
  const definition: number[] = getDefinitionIndex(target) || [];
  const configuration: number[] = getConfigurationIndex(target) || [];
  const dispose: number[] = getDisposeIndex(target) || [];
  const use: number[] = getUseIndex(target) || [];

  return {
    context,
    definition,
    configuration,
    dispose,
    use,
  };
};
