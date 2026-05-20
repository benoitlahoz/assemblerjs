import { IpcListener, IpcOn, IpcSend } from '@assemblerjs/electron';
import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@IpcListener()
@Assemblage()
export class IpcListenerService implements AbstractAssemblage {
  constructor() {}

  @IpcOn('ping')
  @IpcSend('pong')
  public onPing(): void {
    console.log('Received ping from renderer process');
  }
}
