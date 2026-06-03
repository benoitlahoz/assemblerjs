import {
  ElectronMetadataStorage,
  getMenuRendererDefinitionMetadata,
} from '@/universal/metadata';
import { resolveWindowRendererName } from '@/renderer/window/window-definition/window-definition';

export interface MenuRendererDefinition {
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
      name: definition,
    };
  }

  if (!definition || typeof definition !== 'object') {
    throw new Error('@Menu requires a valid menu definition.');
  }

  const raw = definition as Record<string, unknown>;
  if (typeof raw.window !== 'undefined') {
    throw new Error(
      '@Menu.window has been removed. Resolve window through @Window or instance windowName.',
    );
  }

  return {
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

    if (definition?.name) {
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

  const directName = (instance as { menuName?: unknown }).menuName;

  if (typeof directName === 'string' && directName.length > 0) {
    return {
      name: directName,
    };
  }

  const ctor = (instance as { constructor?: Function }).constructor;
  if (!ctor) {
    return undefined;
  }

  return getMenuRendererDefinition(ctor);
}

export function resolveMenuWindowName(instance: unknown): string | undefined {
  const direct = resolveWindowRendererName(instance);
  if (direct) {
    return direct;
  }

  if (!instance || typeof instance !== 'object') {
    return undefined;
  }

  const source = instance as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    let candidate: unknown;
    try {
      candidate = source[key];
    } catch {
      continue;
    }

    const nested = resolveWindowRendererName(candidate);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}
