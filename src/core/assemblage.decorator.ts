import {
  defineCustomMetadata,
  getOwnCustomMetadata,
} from './reflection.helpers';
import type { AssemblageDefinition } from './assemblage.definition';
import { validateDefinition } from './assemblage.definition';
import { Concrete } from '@/types';
import {
  ReflectDefinition,
  ReflectIsAssemblageFlag,
} from './reflection.constants';

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
