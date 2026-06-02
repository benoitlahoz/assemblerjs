import { getAssemblageDefinition } from 'assemblerjs';
import {
  ElectronMetadataStorage,
  getMenuDefinitionMetadata,
  setMenuDefinitionMetadata,
} from '@/universal/metadata';

export interface MenuDefinition {
  window: string;
  name?: string;
}

export interface NormalizedMenuDefinition {
  window: string;
  name: string;
}

export const MenuDefinitionMetadataKey =
  ElectronMetadataStorage.getKey('MenuDefinition');

export function normalizeMenuDefinition(
  definition: string | MenuDefinition,
): NormalizedMenuDefinition {
  if (typeof definition === 'string') {
    return {
      window: definition,
      name: 'mainMenu',
    };
  }

  if (!definition?.window || typeof definition.window !== 'string') {
    throw new Error('@Menu requires a valid window name.');
  }

  return {
    window: definition.window,
    name:
      definition.name && typeof definition.name === 'string'
        ? definition.name
        : 'mainMenu',
  };
}

/**
 * Marks an assemblage as a managed menu definition.
 */
export function Menu(definition: string | MenuDefinition): ClassDecorator {
  return (target: Function) => {
    setMenuDefinitionMetadata(target, normalizeMenuDefinition(definition));

    const assemblageDefinition = getAssemblageDefinition(target as any);
    if (assemblageDefinition && assemblageDefinition.singleton === undefined) {
      assemblageDefinition.singleton = true;
    }
  };
}

export function getMenuDefinition(
  target: Function,
): NormalizedMenuDefinition | undefined {
  return getMenuDefinitionMetadata(target) as
    | NormalizedMenuDefinition
    | undefined;
}
