import type { Concrete } from '@assemblerjs/core';
import { ReflectFlags, ReflectValue, defineCustomMetadata } from '@/shared/common';
import type { AssemblageDefinition } from './definition';
import { validateDefinition } from './definition';

/**
 * Mark a class as `Assemblage` and cache its definition.
 *
 * @param { AssemblageDefinition } definition Definition of the assemblage that provides injections, etc.
 * @returns { ClassDecorator } The decorated class.
 */
export const Assemblage = <T>(
  definition?: AssemblageDefinition
): ClassDecorator => {
  return ((target: Concrete<T>): Concrete<T> => {
    return decorateAssemblage(target as any, definition);
  }) as ClassDecorator;
};

/**
 * Manually decorate a class to be an `Assemblage`.
 *
 * @param { Concrete<T> } target The class to decorate.
 * @param { AssemblageDefinition } definition Definition of the assemblage that provides injections, etc.
 * @returns
 */
export const decorateAssemblage = <T>(
  target: Concrete<T>,
  definition?: AssemblageDefinition
) => {
  const safeDefinition: any = validateDefinition(definition || {});

  // Mark as assemblage.
  defineCustomMetadata(ReflectFlags.IsAssemblage, true, target);

  // Keep definition passed in decorator.
  defineCustomMetadata(
    ReflectValue.AssemblageDefinition,
    safeDefinition,
    target
  );

  return target;
};
