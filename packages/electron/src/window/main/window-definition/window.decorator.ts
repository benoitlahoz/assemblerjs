import { getAssemblageDefinition } from 'assemblerjs';
import type { BrowserWindowConstructorOptions } from 'electron';
import type { WindowTitleBarConfig } from '@/common/types';
import { ElectronMetadata } from '@/common/metadata';
import { buildMetadataKey } from '@assemblerjs/common';
import { WindowListener } from '../window-listener/window-listener.decorator';

export interface WindowRouterDefinition {
  file?: string;
  dev?: string;
  route?: string;
}

export interface WindowDefinition extends BrowserWindowConstructorOptions {
  name: string;
  multiple?: boolean;
  router?: WindowRouterDefinition;
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

export const WindowDefinitionMetadataKey = buildMetadataKey(
  'electron:window',
  'WindowDefinition',
);

export function normalizeWindowDefinition(
  definition: WindowDefinition,
): NormalizedWindowDefinition {
  const { name, multiple, router, titleBar, ...windowOptions } = definition;

  const normalizedRouter = router
    ? {
        ...router,
        route: router.route ?? '/',
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
    ElectronMetadata.window.setDefinition(
      target,
      normalizeWindowDefinition(definition),
    );

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
  return ElectronMetadata.window.getDefinition(target) as
    | NormalizedWindowDefinition
    | undefined;
}
