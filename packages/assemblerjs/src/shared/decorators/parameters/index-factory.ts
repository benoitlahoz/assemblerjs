import { defineCustomMetadata, getOwnCustomMetadata } from '@/shared/common';

/**
 * Prepare `Assembler` to inject specific object in a dependency's constructor parameters.
 * @deprecated Use ParameterDecoratorFactory instead
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
 * Legacy decorator factory - kept for backward compatibility.
 * @deprecated Use the new decorators from simple-decorators.ts
 */
export const createParamIndexDecorator = paramIndexDecoratorFactory;
