import {
  AbstractAssemblage,
  AssemblerContext,
  getAssemblageContext,
} from 'assemblerjs';
import type { WindowBounds, WindowState } from '@/universal/types';
import { resolveWindowRendererName } from '@/renderer/window/decorators/window-definition';
import {
  AbstractWindowRendererService,
  type WindowSnapshot,
} from './window-renderer.abstract';
import { WindowRendererService } from './window-renderer.service';
import { IpcService } from '@/renderer/ipc/services';

/**
 * Base class for window-specific renderer services.
 *
 * The target window can be provided either by:
 * - `@Window({ name: ... })` (preferred), or
 * - an instance `windowName` property (legacy compatibility).
 *
 * The global renderer window service is resolved lazily from the
 * Assembler context when not explicitly provided via constructor.
 */
export abstract class AbstractScopedWindowRendererService implements AbstractAssemblage {
  private static standaloneWindows?: AbstractWindowRendererService;
  protected readonly windowName?: string;
  private resolvedWindows?: AbstractWindowRendererService;

  constructor(windows?: AbstractWindowRendererService) {
    this.resolvedWindows = windows;
  }

  /**
   * Override this hook to resolve a custom renderer window service token.
   * Return `undefined` to let the base class apply its built-in fallbacks.
   */
  protected resolveWindowsFromContext(
    context: AssemblerContext,
  ): AbstractWindowRendererService | undefined {
    try {
      return context.require(AbstractWindowRendererService);
    } catch {
      try {
        // Fallback for apps that do not bind the abstract token explicitly.
        return context.require(WindowRendererService);
      } catch {
        return undefined;
      }
    }
  }

  protected get windows(): AbstractWindowRendererService {
    if (this.resolvedWindows) {
      return this.resolvedWindows;
    }

    const context = getAssemblageContext(this.constructor);
    if (!context) {
      throw new Error(
        'AbstractScopedWindowRendererService could not resolve Assembler context for renderer window service.',
      );
    }

    this.resolvedWindows = this.resolveWindowsFromContext(context);
    if (!this.resolvedWindows) {
      // Final fallback when no window renderer service is registered in DI.
      if (!AbstractScopedWindowRendererService.standaloneWindows) {
        AbstractScopedWindowRendererService.standaloneWindows =
          new WindowRendererService(new IpcService());
      }

      this.resolvedWindows =
        AbstractScopedWindowRendererService.standaloneWindows;
    }

    return this.resolvedWindows;
  }

  protected resolveWindowName(): string {
    const windowName = resolveWindowRendererName(this);
    if (!windowName) {
      throw new Error(
        "AbstractScopedWindowRendererService requires a window name (via instance 'windowName' or @Window).",
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

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void | Promise<void> {
    return undefined;
  }
}
