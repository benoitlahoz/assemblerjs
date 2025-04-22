import type { Concrete } from '@assemblerjs/core';
import { ReflectFlags, getOwnCustomMetadata } from '@/common';

/**
 * Check if a given class is an `Assemblage`.
 *
 * @param { Concrete<T> } target The class to test.
 * @returns `true` if the class is an assemblage.
 */
export const isAssemblage = <T>(target: Concrete<T>): boolean => {
  return getOwnCustomMetadata(ReflectFlags.IsAssemblage, target) || false;
};
