import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { IpcListener } from '@assemblerjs/electron/renderer';
import { IpcSend, IpcOn } from '@assemblerjs/electron/renderer';

@IpcListener()
@Assemblage()
export class DebugIpcGateway implements AbstractAssemblage {
  @IpcSend('ping')
  public sendPing(): void {}

  @IpcOn('pong')
  public onPong(): void {
    console.log('Received pong from main process');
  }
}
