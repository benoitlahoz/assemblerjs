import type { Concrete } from '@/common';
import { getOwnCustomMetadata } from '@/common';
import type { ParametersDecoratorsIndexes } from '../types';
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

export const getDecoratedParametersIndexes = <T>(
  target: Concrete<T>
): ParametersDecoratorsIndexes => {
  // Get indexes of decorated constructor parameters, etc.
  const Context: number[] = getContextIndex(target) || [];
  const Definition: number[] = getDefinitionIndex(target) || [];
  const Configuration: number[] = getConfigurationIndex(target) || [];
  const Dispose: number[] = getDisposeIndex(target) || [];
  const Use: number[] = getUseIndex(target) || [];

  return {
    Context,
    Definition,
    Configuration,
    Dispose,
    Use,
  };
};
