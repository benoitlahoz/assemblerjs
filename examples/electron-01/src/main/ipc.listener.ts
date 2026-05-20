import { IpcListener, IpcOn } from '@assemblerjs/electron';
import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@IpcListener()
@Assemblage()
export class IpcListenerService implements AbstractAssemblage {
  constructor() {}

  @IpcOn('ping')
  public onPing(): void {
    console.log('pong');
  }
}
