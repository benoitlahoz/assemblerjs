import type { Concrete } from '@/types';
import { validateDefinition } from './assemblage.definition';
import {
  ReflectDefinition,
  ReflectIsAssemblageFlag,
} from './reflection.constants';
import {
  defineCustomMetadata,
  getOwnCustomMetadata,
} from './reflection.helpers';

import type { AssemblageDefinition } from './assemblage.definition';
/**
 * Mark a class as `Assemblage` and cache its definition.
 *
 * @param definition
 * @returns
 */
export const Assemblage = (
  definition?: AssemblageDefinition
): ClassDecorator => {
  const safeDefinition: any = definition ? validateDefinition(definition) : {};

  return <TFunction extends Function>(target: TFunction): TFunction => {
    // Mark as assemblage.
    defineCustomMetadata(ReflectIsAssemblageFlag, true, target);

    // Keep definition passed in decorator.
    defineCustomMetadata(ReflectDefinition, safeDefinition, target);

    return target;
  };
};

/**
 * Check if a given class is an `Assemblage`.
 *
 * @param { Concrete<T> } target The class to test.
 * @returns `true` if the class is an assemblage.
 */
export const isAssemblage = <T>(target: Concrete<T>): boolean => {
  return getOwnCustomMetadata(ReflectIsAssemblageFlag, target) || false;
};

@Assemblage()
/**
 * Helper `Assemblage` that does nothing.
 */
export class NoOpAssemblage {
  constructor() {}
}
