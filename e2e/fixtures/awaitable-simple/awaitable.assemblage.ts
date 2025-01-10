import { Assemblage, Awaitable, EventManager } from '../../../src';
import { AbstractEmitterAssemblage } from '../events-simple/emitter.abstract';

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
  implements AbstractEmitterAssemblage
{
  public ready = false;

  public async execute(): Promise<void> {
    this.emit(AwaitableChannels.Init, AwaitableChannels.Init);

    setTimeout(() => {
      this.ready = true;
      this.emit(AwaitableChannels.Ready, AwaitableChannels.Ready);
    }, 100);

    this.emit(AwaitableChannels.Inited, AwaitableChannels.Inited);
  }

  @Awaitable('ready')
  public async whenReady(): Promise<void> {
    this.emit(AwaitableChannels.Resolved, AwaitableChannels.Resolved);
    return;
  }
}
