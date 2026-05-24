import { Assemblage } from 'assemblerjs';
import {
  AbstractWindowService,
  IpcResult,
  WindowCommand,
  Window,
} from '@assemblerjs/electron/renderer';
import type { WindowBounds } from '@assemblerjs/electron/renderer';
import { shallowRef, type ShallowRef } from 'vue';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';

@Window({ name: MAIN_WINDOW_CONFIG.name })
@Assemblage()
export class MainWindow extends AbstractWindowService {
  public readonly bounds: ShallowRef<WindowBounds | undefined> = shallowRef<WindowBounds>();
  private unsubscribeBoundsChanged?: () => void;
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
    this.bounds.value = this.cloneBounds(await this.getBounds());

    this.unsubscribeBoundsChanged = this.onBoundsChanged((bounds) => {
      const next = this.cloneBounds(bounds);
      this.bounds.value = next;
    });
  }

  public async onInit(): Promise<void> {
    await this.ensureBoundsStream();
  }

  public onDispose(): void {
    this.unsubscribeBoundsChanged?.();
    this.unsubscribeBoundsChanged = undefined;
    this.boundsStreamInitialized = false;
  }

  public override onBoundsChanged(callback: (bounds: WindowBounds) => void): () => void {
    return super.onBoundsChanged(callback);
  }

  @WindowCommand('refreshBounds')
  public async refreshBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand('randomBounds')
  public async randomBounds(@IpcResult() bounds?: WindowBounds): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand('centerWindow')
  public async centerWindow(@IpcResult() bounds?: WindowBounds): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand('setBounds')
  public async setBounds(
    nextBounds: WindowBounds,
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    void nextBounds;
    this.bounds.value = this.cloneBounds(bounds);
    return this.bounds.value;
  }

  @WindowCommand('getDisplayWorkArea')
  public async getDisplayWorkArea(
    @IpcResult() workArea?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    return workArea;
  }

  @WindowCommand('getDisplayBounds')
  public async getDisplayBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    await this.ensureBoundsStream();
    return bounds;
  }
}
