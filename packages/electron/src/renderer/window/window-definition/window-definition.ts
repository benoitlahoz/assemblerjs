import { ElectronMetadata } from '@/universal/metadata';
import { buildMetadataKey } from '@assemblerjs/common';

export interface WindowRendererDefinition {
  name: string;
}

export const WindowRendererDefinitionMetadataKey = buildMetadataKey(
  'electron:window',
  'WindowRendererDefinition',
);

export function normalizeWindowRendererDefinition(
  definition: string | WindowRendererDefinition,
): WindowRendererDefinition {
  if (typeof definition === 'string') {
    return { name: definition };
  }

  if (!definition?.name || typeof definition.name !== 'string') {
    throw new Error(
      '@Window requires a valid window name (string or { name: string }).',
    );
  }

  return { name: definition.name };
}

export function getWindowRendererDefinition(
  target: Function,
): WindowRendererDefinition | undefined {
  let current: any = target;

  while (current && current !== Function.prototype) {
    const definition = ElectronMetadata.window.getRendererDefinition(
      current,
    ) as WindowRendererDefinition | undefined;

    if (definition?.name) {
      return definition;
    }

    current = Object.getPrototypeOf(current);
  }

  return undefined;
}

export function resolveWindowRendererName(
  instance: unknown,
): string | undefined {
  if (instance && typeof instance === 'object') {
    const direct = (instance as { windowName?: unknown }).windowName;
    if (typeof direct === 'string' && direct.length > 0) {
      return direct;
    }

    const ctor = (instance as { constructor?: Function }).constructor;
    if (ctor) {
      return getWindowRendererDefinition(ctor)?.name;
    }
  }

  return undefined;
}
