import { getOwnCustomMetadata, defineCustomMetadata } from '@/common';
import { ReflectParamIndex, ReflectParamValue } from './constants';

/**
 * Injects an object passed with `string` or `symbol` identifier.
 */
export const Global = (identifier: string | symbol): ParameterDecorator => {
  return (target: any, _: string | symbol | undefined, index: number) => {
    decorateGlobal(identifier, target, index);
  };
};

/**
 * Decorator as a wrapper function.
 */
export const decorateGlobal = (
  identifier: string | symbol,
  target: any,
  index: number
) => {
  // Get existing indexes for this decorator.
  const paramIndexes: number[] =
    getOwnCustomMetadata(ReflectParamIndex.Global, target) || [];
  paramIndexes.push(index);

  defineCustomMetadata(ReflectParamIndex.Global, paramIndexes, target);

  // Get existing identifiers for this decorator.
  const identifiers =
    getOwnCustomMetadata(ReflectParamValue.GlobalIdentifier, target) || {};
  identifiers[index] = identifier;

  // Keep the token passed as identifier.
  defineCustomMetadata(ReflectParamValue.GlobalIdentifier, identifiers, target);
};
