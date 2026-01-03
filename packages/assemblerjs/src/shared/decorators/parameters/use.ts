import { getOwnCustomMetadata, defineCustomMetadata } from '@/shared/common';
import { ReflectParamIndex, ReflectParamValue } from './constants';

/**
 * Injects an object passed with `string` or `symbol` identifier.
 */
export const Use = (identifier: string | symbol): ParameterDecorator => {
  return (target: any, _: string | symbol | undefined, index: number) => {
    decorateUse(identifier, target, index);
  };
};

/**
 * Decorator as a wrapper function.
 */
export const decorateUse = (
  identifier: string | symbol,
  target: any,
  index: number
) => {
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
