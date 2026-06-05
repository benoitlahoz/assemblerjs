import { Assemblage } from 'assemblerjs';
import {
  AbstractWindowService,
  IpcResult,
  WindowCommand,
  Window,
  WindowOn,
} from '@assemblerjs/electron/renderer';
import type { WindowBounds } from '@assemblerjs/electron/renderer';
import { shallowRef, type ShallowRef } from 'vue';
import { MainWindowConfig } from '../universal/window.config';

@Window({ name: MainWindowConfig.name })
@Assemblage()
export class MainWindow extends AbstractWindowService {
  public readonly bounds: ShallowRef<WindowBounds | undefined> = shallowRef<WindowBounds>();
  private boundsStreamInitialized = false;

  private cloneBounds(bounds?: WindowBounds): WindowBounds | undefined {
    if (!bounds) {
      return undefined;
    }

    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  private async ensureBoundsStream(): Promise<void> {
    if (this.boundsStreamInitialized) {
      return;
    }

    this.boundsStreamInitialized = true;
    this.bounds.value = this.cloneBounds(await this.getCurrentBounds());
  }

  public async onInit(): Promise<void> {
    await this.ensureBoundsStream();
  }

  public onDispose(): void {
    this.boundsStreamInitialized = false;
  }

  // ========================================
  // Commands (RPC calls to main)
  // ========================================
  // Using @WindowCommand() without parameter infers command name from method name

  @WindowCommand() // Infers 'getCurrentBounds'
  public async getCurrentBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    return this.cloneBounds(bounds);
  }

  @WindowCommand() // Infers 'refreshBounds'
  public async refreshBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand() // Infers 'randomBounds'
  public async randomBounds(@IpcResult() bounds?: WindowBounds): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand() // Infers 'centerWindow'
  public async centerWindow(@IpcResult() bounds?: WindowBounds): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand('setBounds') // Explicit name to match main process
  public async setBounds(
    nextBounds: WindowBounds,
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    void nextBounds;
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand() // Infers 'getDisplayWorkArea'
  public async getDisplayWorkArea(
    @IpcResult() workArea?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    return workArea;
  }

  @WindowCommand() // Infers 'getDisplayBounds'
  public async getDisplayBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    return bounds;
  }

  // ========================================
  // Event Listeners (receive forwards from main)
  // ========================================

  /**
   * Receives 'resize' and 'move' events forwarded by @WindowForward on the main side.
   * Auto-generated channels: 'window:main.resize', 'window:main.move'
   * Updates the reactive bounds state.
   */
  @WindowOn('resize')
  @WindowOn('move')
  public onBoundsChangedEvent(bounds: WindowBounds): void {
    this.bounds.value = this.cloneBounds(bounds);
  }

  /**
   * Receives 'enter-full-screen' events forwarded by @WindowForward('enter-full-screen') on the main side.
   * Auto-generated channel: 'window:main.enter-full-screen'
   */
  @WindowOn('enter-full-screen')
  public async onEnterFullScreenEvent(bounds: WindowBounds): Promise<void> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
  }

  /**
   * Receives 'leave-full-screen' events forwarded by @WindowForward('leave-full-screen') on the main side.
   * Auto-generated channel: 'window:main.leave-full-screen'
   */
  @WindowOn('leave-full-screen')
  public async onLeaveFullScreenEvent(bounds: WindowBounds): Promise<void> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
  }
}
