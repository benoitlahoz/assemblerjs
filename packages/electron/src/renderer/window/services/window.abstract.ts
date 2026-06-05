import {
  AbstractAssemblage,
  AssemblerContext,
  getAssemblageContext,
} from 'assemblerjs';
import type {
  WindowBounds,
  WindowState,
  TitleBarConfig,
  TitleBarOptions,
} from '@/universal/types';
import { resolveWindowRendererName } from '@/renderer/window/window-definition/window-definition';
import {
  AbstractWindowControllerService,
  type WindowSnapshot,
} from './window-controller.abstract';
import { WindowControllerService } from './window-controller.service';
import { IpcService } from '@/renderer/ipc/services';
import {
  buildWindowCommandChannel,
  buildWindowEventChannel,
} from '../common/window-channels';
import { unwrapIpcResult } from '@/renderer/ipc/services/ipc-result.utils';

/**
 * Base class for window-specific renderer services.
 *
 * The target window can be provided either by:
 * - `@Window({ name: ... })` (preferred), or
 * - an instance `windowName` property.
 *
 * The global renderer window controller service is resolved lazily from the
 * Assembler context when not explicitly provided via constructor.
 */
export abstract class AbstractWindowService implements AbstractAssemblage {
  private static standaloneWindows?: AbstractWindowControllerService;
  protected readonly windowName?: string;
  private resolvedWindows?: AbstractWindowControllerService;

  constructor(windows?: AbstractWindowControllerService) {
    this.resolvedWindows = windows;
  }

  /**
   * Override this hook to resolve a custom renderer window controller token.
   * Return `undefined` to let the base class apply its built-in fallbacks.
   */
  protected resolveWindowsFromContext(
    context: AssemblerContext,
  ): AbstractWindowControllerService | undefined {
    try {
      return context.require(AbstractWindowControllerService);
    } catch {
      try {
        return context.require(WindowControllerService);
      } catch {
        return undefined;
      }
    }
  }

  protected get windows(): AbstractWindowControllerService {
    if (this.resolvedWindows) {
      return this.resolvedWindows;
    }

    const context = getAssemblageContext(this.constructor);
    if (!context) {
      throw new Error(
        'AbstractWindowService could not resolve Assembler context for renderer window controller service.',
      );
    }

    this.resolvedWindows = this.resolveWindowsFromContext(context);
    if (!this.resolvedWindows) {
      if (!AbstractWindowService.standaloneWindows) {
        AbstractWindowService.standaloneWindows = new WindowControllerService(
          new IpcService(),
        );
      }

      this.resolvedWindows = AbstractWindowService.standaloneWindows;
    }

    return this.resolvedWindows;
  }

  protected resolveWindowName(): string {
    const windowName = resolveWindowRendererName(this);
    if (!windowName) {
      throw new Error(
        "AbstractWindowService requires a window name (via instance 'windowName' or @Window).",
      );
    }

    return windowName;
  }

  public async getBounds(): Promise<WindowBounds | undefined> {
    return await this.windows.getBounds(this.resolveWindowName());
  }

  public async focus(): Promise<void> {
    await this.windows.focus(this.resolveWindowName());
  }

  public async setVisible(visible: boolean): Promise<void> {
    await this.windows.setVisible(this.resolveWindowName(), visible);
  }

  public async setMinimized(minimized: boolean): Promise<void> {
    await this.windows.setMinimized(this.resolveWindowName(), minimized);
  }

  public async setMaximized(maximized: boolean): Promise<void> {
    await this.windows.setMaximized(this.resolveWindowName(), maximized);
  }

  public async restore(): Promise<void> {
    await this.windows.restore(this.resolveWindowName());
  }

  public async pin(pinned: boolean): Promise<boolean | undefined> {
    return await this.windows.pin(this.resolveWindowName(), pinned);
  }

  public snapshot(): WindowSnapshot | undefined {
    return this.windows.snapshot(this.resolveWindowName());
  }

  public trackWindow(): () => void {
    return this.windows.trackWindow(this.resolveWindowName());
  }

  public onBoundsChanged(callback: (bounds: WindowBounds) => void): () => void {
    return this.windows.onBoundsChanged(this.resolveWindowName(), callback);
  }

  public onStateChanged(callback: (state: WindowState) => void): () => void {
    return this.windows.onStateChanged(this.resolveWindowName(), callback);
  }

  public onFullscreenChanged(callback: (active: boolean) => void): () => void {
    return this.windows.onFullscreenChanged(this.resolveWindowName(), callback);
  }

  /**
   * Get the unified title bar configuration.
   * Returns undefined if custom title bar is not enabled.
   */
  public async getTitleBarConfig(): Promise<TitleBarConfig | undefined> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(windowName, 'getTitleBarConfig');
    const result = await this.windows.ipc.invoke(channel);
    return unwrapIpcResult<TitleBarConfig | undefined>(channel, result);
  }

  /**
   * Update title bar appearance (unified API).
   * Works automatically across all platforms.
   */
  public async setTitleBarOverlay(options: TitleBarOptions): Promise<void> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(windowName, 'setTitleBarOverlay');

    const result = await this.windows.ipc.invoke(channel, options);
    console.log('[RENDERER/IPC] setTitleBarOverlay result:', result);
    unwrapIpcResult<void>(channel, result);
  }

  /**
   * Get the position of macOS traffic light buttons.
   * Returns undefined on non-macOS platforms.
   */
  public async getWindowButtonPosition(): Promise<
    { x: number; y: number } | undefined
  > {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(
      windowName,
      'getWindowButtonPosition',
    );
    const result = await this.windows.ipc.invoke(channel);
    return unwrapIpcResult<{ x: number; y: number } | undefined>(
      channel,
      result,
    );
  }

  /**
   * Set the position of macOS traffic light buttons.
   * Only works on macOS.
   */
  public async setWindowButtonPosition(position: {
    x: number;
    y: number;
  }): Promise<void> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(
      windowName,
      'setWindowButtonPosition',
    );
    const result = await this.windows.ipc.invoke(channel, position);
    unwrapIpcResult<void>(channel, result);
  }

  /**
   * Get the current window title.
   */
  public async getTitle(): Promise<string | undefined> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(windowName, 'getTitle');
    const result = await this.windows.ipc.invoke(channel);
    return unwrapIpcResult<string | undefined>(channel, result);
  }

  /**
   * Set the window title.
   */
  public async setTitle(title: string): Promise<void> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(windowName, 'setTitle');
    const result = await this.windows.ipc.invoke(channel, title);
    unwrapIpcResult<void>(channel, result);
  }

  /**
   * Set whether the window should always be on top.
   */
  public async setAlwaysOnTop(flag: boolean): Promise<boolean> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(windowName, 'setAlwaysOnTop');
    const result = await this.windows.ipc.invoke(channel, flag);
    return unwrapIpcResult<boolean>(channel, result) ?? false;
  }

  /**
   * Get whether the window is always on top.
   */
  public async isAlwaysOnTop(): Promise<boolean> {
    const windowName = this.resolveWindowName();
    const channel = buildWindowCommandChannel(windowName, 'isAlwaysOnTop');
    const result = await this.windows.ipc.invoke(channel);
    return unwrapIpcResult<boolean>(channel, result) ?? false;
  }

  /**
   * Listen for title changes.
   * Returns a cleanup function to remove the listener.
   */
  public onTitleChanged(callback: (title: string) => void): () => void {
    const windowName = this.resolveWindowName();
    const channel = buildWindowEventChannel(windowName, 'title-changed');
    return this.windows.ipc.on(channel, callback);
  }

  /**
   * Subscribe to title bar changes.
   * Triggered when overlay is updated or window is resized.
   */
  public onTitleBarChanged(
    callback: (config: TitleBarConfig) => void,
  ): () => void {
    const windowName = this.resolveWindowName();
    const channel = buildWindowEventChannel(windowName, 'titlebar-changed');
    const handler = (_event: any, config: TitleBarConfig) => {
      callback(config);
    };

    this.windows.ipc.on(channel, handler);

    return () => {
      this.windows.ipc.off(channel, handler);
    };
  }

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void | Promise<void> {
    return undefined;
  }
}

// Re-export types for external consumers
export type { WindowBounds, WindowState, TitleBarConfig, TitleBarOptions };
