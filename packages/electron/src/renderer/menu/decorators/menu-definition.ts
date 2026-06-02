import {
  ElectronMetadataStorage,
  getMenuRendererDefinitionMetadata,
} from '@/universal/metadata';

export interface MenuRendererDefinition {
  window: string;
  name: string;
}

export const MenuRendererDefinitionMetadataKey = ElectronMetadataStorage.getKey(
  'MenuRendererDefinition',
);

export function normalizeMenuRendererDefinition(
  definition: string | Partial<MenuRendererDefinition>,
): MenuRendererDefinition {
  if (typeof definition === 'string') {
    return {
      window: definition,
      name: 'mainMenu',
    };
  }

  const window = definition?.window;
  if (!window || typeof window !== 'string') {
    throw new Error('@Menu requires a valid window name.');
  }

  return {
    window,
    name:
      definition.name && typeof definition.name === 'string'
        ? definition.name
        : 'mainMenu',
  };
}

export function getMenuRendererDefinition(
  target: Function,
): MenuRendererDefinition | undefined {
  let current: any = target;

  while (current && current !== Function.prototype) {
    const definition = getMenuRendererDefinitionMetadata(current) as
      | MenuRendererDefinition
      | undefined;

    if (definition?.window) {
      return definition;
    }

    current = Object.getPrototypeOf(current);
  }

  return undefined;
}

export function resolveMenuRendererDefinition(
  instance: unknown,
): MenuRendererDefinition | undefined {
  if (!instance || typeof instance !== 'object') {
    return undefined;
  }

  const directWindow = (instance as { windowName?: unknown }).windowName;
  const directName = (instance as { menuName?: unknown }).menuName;

  if (typeof directWindow === 'string' && directWindow.length > 0) {
    return {
      window: directWindow,
      name:
        typeof directName === 'string' && directName.length > 0
          ? directName
          : 'mainMenu',
    };
  }

  const ctor = (instance as { constructor?: Function }).constructor;
  if (!ctor) {
    return undefined;
  }

  return getMenuRendererDefinition(ctor);
}
