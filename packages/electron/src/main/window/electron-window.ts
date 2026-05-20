import type { BrowserWindowConstructorOptions, Display } from 'electron';
import { BrowserWindow, screen } from 'electron';
import { WindowIpcChannel, type IpcReturnType } from '@/universal';
import { IpcHandle, IpcListener, WindowListener, WindowOn } from '@/main';

export interface ElectronWindowOptions extends BrowserWindowConstructorOptions {
  definition: {
    name: string;
  };
}

@WindowListener()
@IpcListener()
export class ElectronWindow extends BrowserWindow {
  private static getOpenWindows(): ElectronWindow[] {
    return BrowserWindow.getAllWindows().filter(
      (window) => !window.isDestroyed()
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

  constructor(private options: ElectronWindowOptions) {
    super(options);
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
  public showWhenReady(): void {
    this.center();
    this.show();
  }

  @WindowOn('resize')
  /**
   * Called when the window is resized.
   * This method sends the new bounds to the renderer process.
   */
  public onResize(): void {
    const bounds = this.getBounds();
    this.webContents.send(WindowIpcChannel.OnBoundsChanged, bounds);
  }

  @WindowOn('move')
  /**
   * Called when the window is moved.
   * This method sends the new bounds to the renderer process.
   */
  public onMove(): void {
    const bounds = this.getBounds();
    this.webContents.send(WindowIpcChannel.OnBoundsChanged, bounds);
  }

  @IpcHandle(WindowIpcChannel.GetBounds)
  /**
   * Get the window's bounds.
   *
   * @param { string } name The window's name.
   * @returns { IpcReturnType } The return value.
   */
  public async onGetBounds(name: string): Promise<IpcReturnType> {
    const window = ElectronWindow.getByName(name);
    if (!window) {
      return {
        data: null,
        err: new Error(`Window not found: ${name} in 'onGetBounds'`),
      };
    }

    return { data: window.getBounds(), err: null };
  }

  @WindowOn('enter-full-screen')
  /**
   * Called when the window enters fullscreen.
   */
  public onEnterFullScreen(): void {
    this.webContents.send(WindowIpcChannel.OnEnterFullscreen);
  }

  @WindowOn('leave-full-screen')
  /**
   * Called when the window leaves fullscreen.
   */
  public onLeaveFullScreen(): void {
    this.webContents.send(WindowIpcChannel.OnLeaveFullscreen);
  }
}
