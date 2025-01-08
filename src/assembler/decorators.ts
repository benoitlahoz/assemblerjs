import {
  ReflectConfigurationParamIndex,
  ReflectContextParamIndex,
  ReflectMetadataParamIndex,
} from '@/common/constants';
import {
  defineCustomMetadata,
  getOwnCustomMetadata,
} from '@/common/reflection';

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
const Metadata = decoratorFactory(ReflectMetadataParamIndex);

export { Context, Configuration, Metadata };
