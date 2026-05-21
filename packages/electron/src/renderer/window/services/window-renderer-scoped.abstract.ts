import { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import type { WindowBounds, WindowState } from '@/universal/types';
import type {
  AbstractWindowRendererService,
  WindowSnapshot,
} from './window-renderer.abstract';

/**
 * Base class for window-specific renderer services.
 * Subclass this class per window and expose a fixed `windowName`.
 */
export abstract class AbstractScopedWindowRendererService implements AbstractAssemblage {
  protected abstract readonly windowName: string;

  constructor(protected readonly windows: AbstractWindowRendererService) {}

  public async getBounds(): Promise<WindowBounds | undefined> {
    return await this.windows.getBounds(this.windowName);
  }

  public async focus(): Promise<void> {
    await this.windows.focus(this.windowName);
  }

  public async setVisible(visible: boolean): Promise<void> {
    await this.windows.setVisible(this.windowName, visible);
  }

  public async setMinimized(minimized: boolean): Promise<void> {
    await this.windows.setMinimized(this.windowName, minimized);
  }

  public async setMaximized(maximized: boolean): Promise<void> {
    await this.windows.setMaximized(this.windowName, maximized);
  }

  public async restore(): Promise<void> {
    await this.windows.restore(this.windowName);
  }

  public async pin(pinned: boolean): Promise<boolean | undefined> {
    return await this.windows.pin(this.windowName, pinned);
  }

  public snapshot(): WindowSnapshot | undefined {
    return this.windows.snapshot(this.windowName);
  }

  public trackWindow(): () => void {
    return this.windows.trackWindow(this.windowName);
  }

  public onBoundsChanged(callback: (bounds: WindowBounds) => void): () => void {
    return this.windows.onBoundsChanged(this.windowName, callback);
  }

  public onStateChanged(callback: (state: WindowState) => void): () => void {
    return this.windows.onStateChanged(this.windowName, callback);
  }

  public onFullscreenChanged(callback: (active: boolean) => void): () => void {
    return this.windows.onFullscreenChanged(this.windowName, callback);
  }

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void | Promise<void> {
    return undefined;
  }
}
