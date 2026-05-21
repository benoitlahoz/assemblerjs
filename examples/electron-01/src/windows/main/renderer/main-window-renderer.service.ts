import { Assemblage } from 'assemblerjs';
import {
  AbstractScopedWindowRendererService,
  AbstractWindowRendererService,
  IpcResult,
  WindowCommand,
  WindowListener,
  WindowOn,
} from '@assemblerjs/electron/renderer';
import type { WindowBounds } from '@assemblerjs/electron/renderer';
import { shallowRef, type ShallowRef } from 'vue';
import { MAIN_WINDOW_NAME } from '../universal/main.window.constants';

@WindowListener()
@Assemblage()
export class MainWindowRendererService extends AbstractScopedWindowRendererService {
  protected readonly windowName = MAIN_WINDOW_NAME;
  public readonly bounds: ShallowRef<WindowBounds | undefined> = shallowRef<WindowBounds>();

  constructor(windows: AbstractWindowRendererService) {
    super(windows);
  }

  public async onInit(): Promise<void> {
    this.bounds.value = await this.getBounds();
  }

  public async refreshBounds(): Promise<WindowBounds | undefined> {
    this.bounds.value = await this.requestRefreshBounds();
    return this.bounds.value;
  }

  public async randomBounds(): Promise<WindowBounds | undefined> {
    this.bounds.value = await this.requestRandomBounds();
    return this.bounds.value;
  }

  public async centerWindow(): Promise<WindowBounds | undefined> {
    this.bounds.value = await this.requestCenterWindow();
    return this.bounds.value;
  }

  public async setBounds(nextBounds: WindowBounds): Promise<WindowBounds | undefined> {
    this.bounds.value = await this.requestSetBounds(nextBounds);
    return this.bounds.value;
  }

  public async getDisplayWorkArea(): Promise<WindowBounds | undefined> {
    return await this.requestDisplayWorkArea();
  }

  @WindowCommand('randomBounds')
  private async requestRandomBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return bounds;
  }

  @WindowCommand('refreshBounds')
  private async requestRefreshBounds(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return bounds;
  }

  @WindowCommand('centerWindow')
  private async requestCenterWindow(
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return bounds;
  }

  @WindowCommand('setBounds')
  private async requestSetBounds(
    _nextBounds: WindowBounds,
    @IpcResult() bounds?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return bounds;
  }

  @WindowCommand('getDisplayWorkArea')
  private async requestDisplayWorkArea(
    @IpcResult() workArea?: WindowBounds,
  ): Promise<WindowBounds | undefined> {
    return workArea;
  }

  @WindowOn('boundsChanged')
  private onBoundsChanged(bounds: WindowBounds): void {
    this.bounds.value = bounds;
  }
}
