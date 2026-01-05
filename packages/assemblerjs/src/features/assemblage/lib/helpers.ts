import type { Concrete } from '@assemblerjs/core';
import type { AssemblageDefinition } from '@/features/assemblage';
import type { AssemblerContext } from '@/features/assembler';
import { ReflectFlags, ReflectValue, getOwnCustomMetadata } from '@/shared/common';

/**
 * Check if a given class is an `Assemblage`.
 *
 * @param { Concrete<T> } target The class to test.
 * @returns `true` if the class is an assemblage.
 */
export const isAssemblage = <T>(target: Concrete<T>): boolean => {
  return getOwnCustomMetadata(ReflectFlags.IsAssemblage, target) || false;
};

export const getAssemblageDefinition = <T>(
  target: Concrete<T>
): AssemblageDefinition => {
  return getOwnCustomMetadata(ReflectValue.AssemblageDefinition, target);
};

export const getAssemblageContext = <T>(
  target: Concrete<T> | Function
): AssemblerContext => {
  return getOwnCustomMetadata(ReflectValue.AssemblageContext, target);
};
