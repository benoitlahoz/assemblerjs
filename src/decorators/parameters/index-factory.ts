import { defineCustomMetadata, getOwnCustomMetadata } from '@/common';
import { ReflectParamIndex } from './constants';

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

/**
 * Injects the Assembler's context.
 */
const Context = decoratorFactory(ReflectParamIndex.Context);

/**
 * Injects the assemblage's configuration object.
 */
const Configuration = decoratorFactory(ReflectParamIndex.Configuration);

/**
 * Injects the assemblage's definition object.
 */
const Definition = decoratorFactory(ReflectParamIndex.Definition);

/**
 * Injects the Assembler's 'dispose' method.
 */
const Dispose = decoratorFactory(ReflectParamIndex.Dispose);

export { Context, Configuration, Definition, Dispose };
