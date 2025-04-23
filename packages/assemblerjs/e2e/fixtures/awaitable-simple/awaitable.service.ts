import { Await } from '@assemblerjs/core';
import { AbstractAssemblage, Assemblage, EventManager } from '../../../src';

export enum AwaitableChannels {
  Init = 'awaitable:init',
  Ready = 'awaitable:ready',
  Inited = 'awaitable:inited',
  Resolved = 'awaitable:resolved',
}

@Assemblage({
  events: Object.values(AwaitableChannels),
})
export class AwaitableAssemblage
  extends EventManager
  implements AbstractAssemblage
{
  public ready = false;

  public async onInit(): Promise<void> {
    this.emit(AwaitableChannels.Init, AwaitableChannels.Init);

    setTimeout(() => {
      this.ready = true;
      this.emit(AwaitableChannels.Ready, AwaitableChannels.Ready);
    }, 100);

    this.emit(AwaitableChannels.Inited, AwaitableChannels.Inited);
  }

  @Await('ready')
  public async whenReady(): Promise<void> {
    this.emit(AwaitableChannels.Resolved, AwaitableChannels.Resolved);
    return;
  }
}
