import { getAssemblageDefinition } from 'assemblerjs';
import type { BrowserWindowConstructorOptions } from 'electron';
import {
  ElectronMetadataStorage,
  getWindowDefinitionMetadata,
  setWindowDefinitionMetadata,
} from '@/universal/metadata';

export interface WindowRouterDefinition {
  file?: string;
  dev?: string;
  route?: string;
}

export interface WindowDefinition extends BrowserWindowConstructorOptions {
  name: string;
  multiple?: boolean;
  router?: WindowRouterDefinition;
  /** @deprecated Use router.route instead. */
  route?: string;
}

export interface NormalizedWindowDefinition {
  name: string;
  multiple: boolean;
  router?: WindowRouterDefinition;
  options: BrowserWindowConstructorOptions;
}

export const WindowDefinitionMetadataKey =
  ElectronMetadataStorage.getKey('WindowDefinition');

export function normalizeWindowDefinition(
  definition: WindowDefinition,
): NormalizedWindowDefinition {
  const { name, multiple, route, router, ...windowOptions } = definition;

  const normalizedRouter =
    router || route
      ? {
          ...(router || {}),
          route: router?.route ?? route ?? '/',
        }
      : undefined;

  return {
    name,
    multiple: multiple === true,
    router: normalizedRouter,
    options: windowOptions,
  };
}

/**
 * Marks an assemblage as a managed window definition.
 * Lifecycle is managed by WindowController from injected/provided windows.
 */
export function Window(definition: WindowDefinition): ClassDecorator {
  return (target: Function) => {
    setWindowDefinitionMetadata(target, normalizeWindowDefinition(definition));

    // Best-effort: enforce non-singleton when metadata is already available.
    const assemblageDefinition = getAssemblageDefinition(target as any);
    if (assemblageDefinition) {
      assemblageDefinition.singleton = false;
    }
  };
}

export function getWindowDefinition(
  target: Function,
): NormalizedWindowDefinition | undefined {
  return getWindowDefinitionMetadata(target) as
    | NormalizedWindowDefinition
    | undefined;
}
