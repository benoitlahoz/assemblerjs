import type { Concrete } from '@/types';
import {
  ReflectConfigurationParamIndex,
  ReflectContextParamIndex,
  ReflectDefinitionParamIndex,
  ReflectDisposeParamIndex,
  ReflectUseParamIndex,
} from '@/core/reflection.constants';
import { getOwnCustomMetadata } from '@/core/reflection.helpers';

export const getContextIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectContextParamIndex, concrete) || [];
};

export const getConfigurationIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectConfigurationParamIndex, concrete) || [];
};

export const getDefinitionIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectDefinitionParamIndex, concrete) || [];
};

export const getDisposeIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectDisposeParamIndex, concrete) || [];
};

export const getUseIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectUseParamIndex, concrete) || [];
};

export const getDecoratedParametersIndexes = <T>(target: Concrete<T>) => {
  // Get parameters indexes decorated with `@Context`, `@Configuration`, `@Definition`.
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
