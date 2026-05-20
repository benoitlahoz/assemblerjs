import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { IpcListener, IpcInvoke, IpcSend, IpcOn, IpcResult } from '@assemblerjs/electron/renderer';
import { IpcChannels } from '@preload/ipc.channels';

@IpcListener()
@Assemblage()
export class DebugIpcGateway implements AbstractAssemblage {
  @IpcSend(IpcChannels.Ping)
  public sendPing(): void {}

  @IpcOn(IpcChannels.Pong)
  public onPong(): void {
    console.log('Received pong from main process');
  }

  @IpcInvoke(IpcChannels.GetVersions)
  public async getVersions(@IpcResult() versions?: any): Promise<NodeJS.ProcessVersions> {
    return versions;
  }

  @IpcInvoke(IpcChannels.GetPlatform)
  public async getPlatform(@IpcResult() platform: NodeJS.Platform): Promise<NodeJS.Platform> {
    return platform;
  }
}
