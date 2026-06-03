import type { BrowserWindowConstructorOptions, Display } from 'electron';
import { BrowserWindow, screen } from 'electron';
import { WindowIpcChannel } from '@/universal/channels';
import { WindowListener } from '../window-listener/window-listener.decorator';
import { WindowOn } from '../window-listener/window-on.decorator';
import { WindowEmit } from '../window-listener/window-emit.decorator';
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

@WindowListener()
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

  @WindowOn('ready-to-show')
  public onReadyToShow(): void {
    this.center();
  }

  @WindowOn('resize')
  @WindowEmit(WindowIpcChannel.OnBoundsChanged)
  /**
   * Called when the window is resized.
   * The returned payload is emitted automatically by WindowListener.
   */
  public onResize() {
    return this.getBounds();
  }

  @WindowOn('resized')
  @WindowEmit(WindowIpcChannel.OnBoundsChanged)
  /**
   * Called on platforms that expose a post-resize event.
   * Emits bounds to keep renderer geometry streams in sync.
   */
  public onResized() {
    return this.getBounds();
  }

  @WindowOn('move')
  @WindowEmit(WindowIpcChannel.OnBoundsChanged)
  /**
   * Called when the window is moved.
   * The returned payload is emitted automatically by WindowListener.
   */
  public onMove() {
    return this.getBounds();
  }

  @WindowOn('moved')
  @WindowEmit(WindowIpcChannel.OnBoundsChanged)
  /**
   * Called on platforms that expose a post-move event.
   * Emits bounds to keep renderer geometry streams in sync.
   */
  public onMoved() {
    return this.getBounds();
  }

  @WindowOn('enter-full-screen')
  @WindowEmit(WindowIpcChannel.OnEnterFullscreen)
  /**
   * Called when the window enters fullscreen.
   */
  public onEnterFullScreen(): void {}

  @WindowOn('leave-full-screen')
  @WindowEmit(WindowIpcChannel.OnLeaveFullscreen)
  /**
   * Called when the window leaves fullscreen.
   */
  public onLeaveFullScreen(): void {}
}
