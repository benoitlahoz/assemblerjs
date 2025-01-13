import { getOwnCustomMetadata, defineCustomMetadata } from '@/common';
import { ReflectParamIndex, ReflectParamValue } from './constants';

/**
 * Injects an object passed with `string` or `Symbol` identifier.
 */
export const Use = (identifier: string | Symbol): ParameterDecorator => {
  return (target: any, _: string | symbol | undefined, index: number) => {
    // Get existing indexes for this decorator.
    const paramIndexes: number[] =
      getOwnCustomMetadata(ReflectParamIndex.Use, target) || [];
    paramIndexes.push(index);

    defineCustomMetadata(ReflectParamIndex.Use, paramIndexes, target);

    // Get existing identifiers for this decorator.
    const identifiers =
      getOwnCustomMetadata(ReflectParamValue.UseIdentifier, target) || {};
    identifiers[index] = identifier;

    // Keep the token passed as identifier.
    defineCustomMetadata(ReflectParamValue.UseIdentifier, identifiers, target);
  };
};
