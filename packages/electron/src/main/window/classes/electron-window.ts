import type { BrowserWindowConstructorOptions, Display } from 'electron';
import { BrowserWindow, screen } from 'electron';
import { getWindowDefinition } from '@/main/window/window-definition/window.decorator';

export interface ElectronWindowOptions extends BrowserWindowConstructorOptions {
  definition: {
    name: string;
  };
}

type ElectronWindowOptionsOverrides = Partial<ElectronWindowOptions>;

const mergeWindowOptions = (
  base: ElectronWindowOptions,
  overrides?: ElectronWindowOptionsOverrides,
): ElectronWindowOptions => {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    definition: {
      ...base.definition,
      ...(overrides.definition || {}),
    },
    webPreferences: {
      ...(base.webPreferences || {}),
      ...(overrides.webPreferences || {}),
    },
  };
};

/**
 * Base window class for all Electron windows.
 *
 * Provides minimal window utilities.
 * Event forwarding and command exposure are the responsibility of user-defined window classes.
 *
 * Users should define their own events and commands using:
 * - `@WindowForward(event)` for forwarding BrowserWindow events to renderer
 * - `@WindowCommand(command)` for exposing RPC methods to renderer
 *
 * @example
 * ```typescript
 * @Window({ name: 'main', width: 800, height: 600 })
 * @Assemblage()
 * export class MainWindow extends ElectronWindow {
 *   // Forward events to renderer
 *   @WindowForward('resize')
 *   public onResize(): Rectangle {
 *     return this.getBounds();
 *   }
 *
 *   // Expose commands for renderer RPC
 *   @WindowCommand('getBounds')
 *   public getBoundsCommand(): Rectangle {
 *     return this.getBounds();
 *   }
 * }
 * ```
 */
export class ElectronWindow extends BrowserWindow {
  private options: ElectronWindowOptions;

  private static getOpenWindows(): ElectronWindow[] {
    return BrowserWindow.getAllWindows().filter(
      (window) => !window.isDestroyed(),
    ) as ElectronWindow[];
  }

  /**
   * Send data to all windows listening to a specific channel.
   *
   * @param { string } channel The channel to send data to.
   * @param { any[] } args The data to send.
   */
  public static sendAll(channel: string, ...args: any[]): void {
    for (const window of this.getOpenWindows()) {
      window.webContents.send(channel, ...args);
    }
  }

  public static getByName(name: string): ElectronWindow | undefined {
    return this.getOpenWindows().find((window) => window.name === name);
  }

  constructor(optionsOverrides?: ElectronWindowOptionsOverrides) {
    const definition = getWindowDefinition(new.target as Function);

    const optionsFromDecorator: ElectronWindowOptions | undefined = definition
      ? {
          definition: {
            name: definition.name,
          },
          ...definition.options,
        }
      : undefined;

    const baseOptions =
      optionsFromDecorator ||
      (optionsOverrides as ElectronWindowOptions | undefined);

    if (!baseOptions) {
      throw new Error(
        'Missing window options. Provide @Window({ name, ... }) metadata or constructor options.',
      );
    }

    const resolvedOptions = mergeWindowOptions(
      baseOptions,
      optionsFromDecorator ? optionsOverrides : undefined,
    );

    if (!resolvedOptions?.definition?.name) {
      throw new Error(
        'Missing window definition name. Provide it via @Window({ name }) or constructor options.',
      );
    }

    super(resolvedOptions);
    this.options = resolvedOptions;
  }

  /**
   * A real 'center' method, overriding the existing one.
   */
  public override center(): void {
    const bounds = this.currentDisplay.bounds;

    const [width, height] = this.getSize();
    const x = Math.floor(bounds.x + (bounds.width - width) * 0.5);
    const y = Math.floor(bounds.y + (bounds.height - height) * 0.5);

    this.setPosition(x, y, false);
  }

  /**
   * The name of the window.
   */
  public get name(): string {
    return this.options.definition.name;
  }

  /**
   * Window's current display.
   * @returns { Display } The display.
   */
  public get currentDisplay(): Display {
    const windowBounds = this.getBounds();
    return screen.getDisplayMatching(windowBounds);
  }
}
