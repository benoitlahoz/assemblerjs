import {
  ReflectDefinition,
  ReflectIsAssemblageFlag,
  defineCustomMetadata,
  getOwnCustomMetadata,
} from './reflection';
import type { AssemblageDefinition } from './definition';
import { validateDefinition } from './definition';
import { Concrete } from '@/types';

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

export const isAssemblage = <T>(target: Concrete<T>): boolean => {
  return getOwnCustomMetadata(ReflectIsAssemblageFlag, target) || false;
};
