import type { BrowserWindowConstructorOptions, Display } from 'electron';
import { BrowserWindow, screen } from 'electron';
import type { TitleBarConfig, TitleBarOptions } from '@/universal/types';
import { getWindowDefinition } from '@/main/window/window-definition/window.decorator';
import type { WindowRouterDefinition } from '@/main/window/window-definition/window.decorator';
import { WindowCommand } from '../window-command/window-command.decorator';
import { buildWindowEventChannel } from '../common/window-channels';

export interface ElectronWindowOptions extends BrowserWindowConstructorOptions {
  definition: {
    name: string;
  };
  router?: WindowRouterDefinition;
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
    router: {
      ...(base.router || {}),
      ...(overrides.router || {}),
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
  private titleBarConfig?: TitleBarConfig;

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
          router: definition.router,
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

    // Apply title bar configuration if enabled
    if (definition?.titleBar?.enabled) {
      const titleBar = definition.titleBar;
      const platform = process.platform as 'darwin' | 'win32' | 'linux';

      if (platform === 'darwin') {
        // macOS: Use titleBarStyle + trafficLightPosition
        resolvedOptions.titleBarStyle = 'hidden';
        resolvedOptions.trafficLightPosition =
          titleBar.trafficLightPosition || { x: 16, y: 16 };
      } else {
        // Windows/Linux: Use titleBarOverlay
        resolvedOptions.titleBarStyle = 'hidden';
        resolvedOptions.titleBarOverlay = {
          color: titleBar.color || '#2f3241',
          symbolColor: titleBar.symbolColor || '#ffffff',
          height: titleBar.height || 40,
        };
      }
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
   * The router configuration of the window.
   */
  public get router(): WindowRouterDefinition | undefined {
    return this.options.router;
  }

  /**
   * Window's current display.
   * @returns { Display } The display.
   */
  public get currentDisplay(): Display {
    const windowBounds = this.getBounds();
    return screen.getDisplayMatching(windowBounds);
  }

  /**
   * Get the unified title bar configuration.
   * Returns undefined if custom title bar is not enabled.
   */
  @WindowCommand('getTitleBarConfig')
  public getTitleBarConfigCommand(): TitleBarConfig | undefined {
    if (!this.titleBarConfig) {
      this.titleBarConfig = this.buildTitleBarConfig();
    }
    return this.titleBarConfig;
  }

  /**
   * Update title bar appearance (unified API).
   * Automatically adapts to the current platform.
   */
  @WindowCommand('setTitleBarOverlay')
  public setTitleBarOverlayCommand(options: TitleBarOptions): void {
    console.log(
      '[MAIN] setTitleBarOverlayCommand called with options:',
      options,
      'platform:',
      process.platform,
    );
    if (process.platform === 'darwin') {
      // macOS: Can't change overlay colors, but we can update height in config
      // This allows the renderer to know the new height when traffic lights move
      if (options.height !== undefined) {
        // Rebuild config to get proper contentArea calculation
        const baseConfig = this.buildTitleBarConfig();
        if (baseConfig) {
          // Override with custom height
          const bounds = this.getBounds();
          const customContentArea = {
            x: baseConfig.insets.left,
            y: baseConfig.insets.top,
            width:
              bounds.width - baseConfig.insets.left - baseConfig.insets.right,
            height:
              options.height - baseConfig.insets.top - baseConfig.insets.bottom,
          };

          this.titleBarConfig = {
            ...baseConfig,
            height: options.height,
            contentArea: customContentArea,
          };
          console.log(
            '[MAIN] Emitting titlebar-changed with new height:',
            this.titleBarConfig.height,
          );
          this.emitTitleBarChanged();
        }
      }
      return;
    }

    // Windows/Linux: Update overlay
    this.setTitleBarOverlay({
      color: options.color,
      symbolColor: options.symbolColor,
      height: options.height,
    });

    // Rebuild config and emit change
    this.titleBarConfig = this.buildTitleBarConfig();
    this.emitTitleBarChanged();
  }

  /**
   * Get the current position of macOS traffic light buttons.
   * Returns undefined on non-macOS platforms.
   */
  @WindowCommand('getWindowButtonPosition')
  public getWindowButtonPositionCommand():
    | { x: number; y: number }
    | undefined {
    if (process.platform !== 'darwin') {
      return undefined;
    }

    // Return configured position from window definition
    // (BrowserWindow.getWindowButtonPosition() doesn't reliably return the configured value)
    const definition = getWindowDefinition(this.constructor as Function);
    const configured = definition?.titleBar?.trafficLightPosition;

    if (configured) {
      return configured;
    }

    // Fallback to BrowserWindow API if no configuration
    return this.getWindowButtonPosition() ?? undefined;
  }

  /**
   * Set the position of macOS traffic light buttons.
   * Only works on macOS. Position is relative to top-left corner.
   */
  @WindowCommand('setWindowButtonPosition')
  public setWindowButtonPositionCommand(position: {
    x: number;
    y: number;
  }): void {
    if (process.platform !== 'darwin') {
      console.warn('setWindowButtonPosition is only supported on macOS');
      return;
    }

    this.setWindowButtonPosition(position);
    // Note: Don't rebuild config here - height will be updated separately via setTitleBarOverlay
  }

  /**
   * Get the current window title.
   */
  @WindowCommand('getTitle')
  public getTitleCommand(): string {
    return this.getTitle();
  }

  /**
   * Set the window title.
   */
  @WindowCommand('setTitle')
  public setTitleCommand(title: string): void {
    this.setTitle(title);
    // Emit title-changed event to renderer
    this.webContents.send(
      buildWindowEventChannel(this.name, 'title-changed'),
      title,
    );
  }

  /**
   * Build the unified title bar config from window options.
   */
  private buildTitleBarConfig(): TitleBarConfig | undefined {
    const definition = getWindowDefinition(this.constructor as Function);
    const titleBarOptions = definition?.titleBar;

    if (!titleBarOptions?.enabled) {
      return undefined;
    }

    const bounds = this.getBounds();
    const platform = process.platform as 'darwin' | 'win32' | 'linux';

    // Platform-specific defaults
    const defaultHeight = platform === 'darwin' ? 52 : 40;
    const height = titleBarOptions.height || defaultHeight;

    // Calculate insets based on platform
    const insets = this.calculateTitleBarInsets(platform);

    // Calculate content area
    const contentArea = {
      x: insets.left,
      y: insets.top,
      width: bounds.width - insets.left - insets.right,
      height: height - insets.top - insets.bottom,
    };

    return {
      enabled: true,
      height,
      color: titleBarOptions.color,
      symbolColor: titleBarOptions.symbolColor,
      insets,
      contentArea,
      platform,
    };
  }

  /**
   * Calculate title bar insets based on platform.
   */
  private calculateTitleBarInsets(platform: 'darwin' | 'win32' | 'linux'): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    if (platform === 'darwin') {
      // macOS: Reserve space for traffic lights on the left
      return { top: 0, right: 0, bottom: 0, left: 80 };
    } else {
      // Windows/Linux: Reserve space for window controls on the right
      const controlsWidth = platform === 'win32' ? 138 : 120;
      return { top: 0, right: controlsWidth, bottom: 0, left: 0 };
    }
  }

  /**
   * Emit title bar changed event to renderer.
   */
  private emitTitleBarChanged(): void {
    if (this.titleBarConfig) {
      const channel = buildWindowEventChannel(this.name, 'titlebar-changed');
      console.log('[MAIN] emitTitleBarChanged - channel:', channel);
      console.log(
        '[MAIN] emitTitleBarChanged - titleBarConfig:',
        JSON.stringify(this.titleBarConfig, null, 2),
      );
      this.webContents.send(channel, this.titleBarConfig);
    } else {
      console.error(
        '[MAIN] emitTitleBarChanged called but titleBarConfig is undefined!',
      );
    }
  }
}
