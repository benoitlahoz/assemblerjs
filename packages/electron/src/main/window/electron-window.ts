import type {
  BrowserWindowConstructorOptions,
  Display,
  IpcMainInvokeEvent,
} from 'electron';
import { BrowserWindow, screen, webContents } from 'electron';
import { WindowIpcChannel, type IpcReturnType } from '@/universal';
import { IpcHandle, IpcListener, WindowListener, WindowOn } from '@/main';

export interface ElectronWindowOptions extends BrowserWindowConstructorOptions {
  definition: {
    name: string;
  };
}

@WindowListener()
@IpcListener()
export abstract class ElectronWindow extends BrowserWindow {
  /**
   * Send data to all windows listening to a specific channel.
   *
   * @param { string } channel The channel to send data to.
   * @param { any[] } args The data to send.
   */
  public static sendAll(channel: string, ...args: any[]): void {
    const contents = webContents.getAllWebContents();
    for (const webContent of contents) {
      webContent.send(channel, ...args);
    }
  }

  public static getByName(name: string): ElectronWindow | undefined {
    const contents = webContents.getAllWebContents();
    const win = contents
      .map((content) => BrowserWindow.fromWebContents(content))
      .find((win) => win && (win as ElectronWindow).name === name) as
      | ElectronWindow
      | undefined;
    return win;
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
    this.webContents.send(WindowIpcChannel.OnResize, bounds);
  }

  @WindowOn('move')
  /**
   * Called when the window is moved.
   * This method sends the new bounds to the renderer process.
   */
  public onMove(): void {
    const bounds = this.getBounds();
    this.webContents.send(WindowIpcChannel.OnResize, bounds);
  }

  @IpcHandle(WindowIpcChannel.GetBounds)
  /**
   * Get the window's bounds.
   *
   * @param { IpcMainInvokeEvent } _event The IPC event (unused).
   * @param { string } name The window's name.
   * @returns { IpcReturnType } The return value.
   */
  public async onGetBounds(
    _event: IpcMainInvokeEvent,
    name: string
  ): Promise<IpcReturnType> {
    if (name !== this.name) {
      return {
        data: null,
        err: new Error(
          `Window name mismatch: ${name} !== ${this.name} in 'onGetBounds'`
        ),
      };
    }

    return { data: this.getBounds(), err: null };
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
