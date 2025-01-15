import {
  Concrete,
  ReflectFlags,
  ReflectValue,
  defineCustomMetadata,
} from '@/common';
import type { AssemblageDefinition } from './definition';
import { validateDefinition } from './definition';

/**
 * Mark a class as `Assemblage` and cache its definition.
 *
 * @param { AssemblageDefinition } definition Definition of the assemblage that provides injections, etc.
 * @returns { ClassDecorator } The decorated class.
 */
export const Assemblage = (
  definition?: AssemblageDefinition
): ClassDecorator => {
  const safeDefinition: any = definition
    ? validateDefinition(definition)
    : validateDefinition({});

  return <TFunction extends Function>(target: TFunction): TFunction => {
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
};

export const decorateAssemblage = <T>(
  target: Concrete<T>,
  definition?: AssemblageDefinition
) => {
  const safeDefinition: any = definition
    ? validateDefinition(definition)
    : validateDefinition({});

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
