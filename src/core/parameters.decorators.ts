import {
    ReflectConfigurationParamIndex, ReflectContextParamIndex, ReflectDefinitionParamIndex,
    ReflectDisposeParamIndex, ReflectUseParamIndex, ReflectUseToken
} from '@/core/reflection.constants';
import { defineCustomMetadata, getOwnCustomMetadata } from '@/core/reflection.helpers';

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
const Context = decoratorFactory(ReflectContextParamIndex);

/**
 * Injects the assemblage's configuration object.
 */
const Configuration = decoratorFactory(ReflectConfigurationParamIndex);

/**
 * Injects the assemblage's definition object.
 */
const Definition = decoratorFactory(ReflectDefinitionParamIndex);

/**
 * Injects the Assembler's 'dispose' method.
 */
const Dispose = decoratorFactory(ReflectDisposeParamIndex);

/**
 * Injects an object passed with `string` or `Symbol` identifier.
 */
const Use = (identifier: string | Symbol): ParameterDecorator => {
  return (target: any, _: string | symbol | undefined, index: number) => {
    // Get existing indexes for this decorator.
    const paramIndexes: number[] =
      getOwnCustomMetadata(ReflectUseParamIndex, target) || [];
    paramIndexes.push(index);

    // Keep indexes of parameters that are decorated, just in case
    // it has been added multiple times in constructor's parameters.
    defineCustomMetadata(ReflectUseParamIndex, paramIndexes, target);

    // Get existing identifiers for this decorator.
    const identifiers = getOwnCustomMetadata(ReflectUseToken, target) || {};
    identifiers[index] = identifier;

    // Keep the token passed as identifier.
    defineCustomMetadata(ReflectUseToken, identifiers, target);
  };
};

export { Context, Configuration, Definition, Dispose, Use };
