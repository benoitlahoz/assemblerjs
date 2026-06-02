import {
  AbstractAssemblage,
  AssemblerContext,
  getAssemblageContext,
} from 'assemblerjs';
import type { WindowBounds, WindowState } from '@/universal/types';
import { resolveWindowRendererName } from '@/renderer/window/window-definition/window-definition';
import {
  AbstractWindowControllerService,
  type WindowSnapshot,
} from './window-controller.abstract';
import { WindowControllerService } from './window-controller.service';
import { IpcService } from '@/renderer/ipc/services';

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

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void | Promise<void> {
    return undefined;
  }
}
