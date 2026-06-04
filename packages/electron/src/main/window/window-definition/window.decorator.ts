import { getAssemblageDefinition } from 'assemblerjs';
import type { BrowserWindowConstructorOptions } from 'electron';
import type { WindowTitleBarConfig } from '@/universal/types';
import {
  ElectronMetadataStorage,
  getWindowDefinitionMetadata,
  setWindowDefinitionMetadata,
} from '@/universal/metadata';
import { WindowListener } from '../window-listener/decorators/window-listener.decorator';

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
  /**
   * Custom title bar configuration (unified API).
   * Automatically adapted to the current platform.
   */
  titleBar?: WindowTitleBarConfig;
}

export interface NormalizedWindowDefinition {
  name: string;
  multiple: boolean;
  router?: WindowRouterDefinition;
  titleBar?: WindowTitleBarConfig;
  options: BrowserWindowConstructorOptions;
}

export const WindowDefinitionMetadataKey =
  ElectronMetadataStorage.getKey('WindowDefinition');

export function normalizeWindowDefinition(
  definition: WindowDefinition,
): NormalizedWindowDefinition {
  const { name, multiple, route, router, titleBar, ...windowOptions } =
    definition;

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
    titleBar,
    options: windowOptions,
  };
}

/**
 * Marks an assemblage as a managed window definition.
 * Lifecycle is managed by WindowController from injected/provided windows.
 *
 * This decorator automatically applies `@WindowListener()`, so event
 * subscriptions declared via `@WindowOn(...)`, `@WindowEmit(...)`, or
 * `@WindowForward(...)` are wired without requiring an explicit
 * class-level `@WindowListener()`.
 *
 * @example
 * ```typescript
 * @Window({ name: 'main', width: 800, height: 600 })
 * @Assemblage()
 * export class MainWindow extends ElectronWindow {
 *   @WindowOn('ready-to-show')
 *   public onReadyToShow(): void {
 *     this.center();
 *   }
 * }
 * ```
 */
export function Window(definition: WindowDefinition): ClassDecorator {
  const listenerDecorator = WindowListener();

  return (target: Function) => {
    setWindowDefinitionMetadata(target, normalizeWindowDefinition(definition));

    // Best-effort: enforce non-singleton when metadata is already available.
    const assemblageDefinition = getAssemblageDefinition(target as any);
    if (assemblageDefinition) {
      assemblageDefinition.singleton = false;
    }

    // Automatically apply @WindowListener to wire @WindowOn/@WindowEmit subscriptions
    const decorated = listenerDecorator(target as any) as Function | void;
    return (decorated || target) as any;
  };
}

export function getWindowDefinition(
  target: Function,
): NormalizedWindowDefinition | undefined {
  return getWindowDefinitionMetadata(target) as
    | NormalizedWindowDefinition
    | undefined;
}
