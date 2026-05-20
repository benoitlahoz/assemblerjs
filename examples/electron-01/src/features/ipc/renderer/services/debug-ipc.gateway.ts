import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { IpcListener } from '@assemblerjs/electron/renderer';
import { IpcSend, IpcOn } from '@assemblerjs/electron/renderer';
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
}
