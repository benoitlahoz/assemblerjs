import { defineCustomMetadata, getOwnCustomMetadata } from '@/shared/common';
import { ReflectParamIndex } from './constants';

/**
 * Prepare `Assembler` to inject specific object in a dependency's constructor parameters.
 */
const paramIndexDecoratorFactory = (key: string) => (): ParameterDecorator => {
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
const Context = paramIndexDecoratorFactory(ReflectParamIndex.Context);

/**
 * Injects the assemblage's configuration object.
 */
const Configuration = paramIndexDecoratorFactory(
  ReflectParamIndex.Configuration
);

/**
 * Injects the assemblage's definition object.
 */
const Definition = paramIndexDecoratorFactory(ReflectParamIndex.Definition);

/**
 * Injects the Assembler's 'dispose' method.
 */
const Dispose = paramIndexDecoratorFactory(ReflectParamIndex.Dispose);

export { Context, Configuration, Definition, Dispose };
