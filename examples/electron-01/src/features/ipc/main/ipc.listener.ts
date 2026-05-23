import {
  IpcHandle,
  IpcInvoke,
  IpcListener,
  IpcOn,
  IpcResult,
  IpcSend,
} from '@assemblerjs/electron';
import { IpcChannels } from '@preload/ipc.channels';
import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@IpcListener()
@Assemblage()
export class IpcListenerService implements AbstractAssemblage {
  constructor() {}

  @IpcSend(IpcChannels.Pong)
  @IpcOn(IpcChannels.Ping)
  public onPing(): void {
    console.log('Received ping from renderer process');
    this.logRendererMetrics().catch((error) => {
      console.warn('Renderer metrics unavailable:', (error as Error).message);
    });
  }

  @IpcInvoke(IpcChannels.GetRendererMetrics, { name: 'main' })
  public async logRendererMetrics(
    @IpcResult()
    metrics?: {
      feedback: string;
      averageLatencyMs?: number;
    },
  ): Promise<void> {
    if (!metrics) {
      return;
    }

    console.log('Renderer metrics', metrics);
  }

  @IpcHandle(IpcChannels.GetVersions)
  public async getVersions(): Promise<NodeJS.ProcessVersions> {
    return process.versions;
  }

  @IpcHandle(IpcChannels.GetPlatform)
  public async getPlatform(): Promise<NodeJS.Platform> {
    return process.platform;
  }
}
