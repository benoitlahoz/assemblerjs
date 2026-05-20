import { IpcHandle, IpcListener, IpcOn, IpcSend } from '@assemblerjs/electron';
import { IpcChannels } from '@preload/ipc.channels';
import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@IpcListener()
@Assemblage()
export class IpcListenerService implements AbstractAssemblage {
  constructor() {}

  @IpcOn(IpcChannels.Ping)
  @IpcSend(IpcChannels.Pong)
  public onPing(): void {
    console.log('Received ping from renderer process');
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
