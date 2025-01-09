import type { Concrete } from '@/types';
import {
  ReflectConfigurationParamIndex,
  ReflectContextParamIndex,
  ReflectDefinitionParamIndex,
  defineCustomMetadata,
  getOwnCustomMetadata,
} from '@/assemblage/reflection';

/**
 * Prepare `Assembler` to inject specific object in a dependency's constructor parameters.
 */
const decoratorFactory = (key: string) => (): ParameterDecorator => {
  return (target: any, _: string | symbol | undefined, index: number) => {
    const paramIndexes: number[] = getOwnCustomMetadata(key, target) || [];
    paramIndexes.push(index);

    // Keep indexes of parameters that are decorated, just in case
    // it has been added multiple times in constructor's parameters.
    defineCustomMetadata(key, paramIndexes, target);
  };
};

const Context = decoratorFactory(ReflectContextParamIndex);
const Configuration = decoratorFactory(ReflectConfigurationParamIndex);
const Definition = decoratorFactory(ReflectDefinitionParamIndex);

export { Context, Configuration, Definition };

export const getContextIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectContextParamIndex, concrete) || [];
};

export const getConfigurationIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectConfigurationParamIndex, concrete) || [];
};

export const getDefinitionIndex = <T>(concrete: Concrete<T>): number[] => {
  return getOwnCustomMetadata(ReflectDefinitionParamIndex, concrete) || [];
};

export const getDecoratedParametersIndexes = <T>(target: Concrete<T>) => {
  // Get parameters indexes decorated with `@Context`, `@Configuration`, `@Definition`.
  const context: number[] = getContextIndex(target) || [];
  const definition: number[] = getDefinitionIndex(target) || [];
  const configuration: number[] = getConfigurationIndex(target) || [];

  return {
    context,
    definition,
    configuration,
  };
};
