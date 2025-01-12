import { AbstractAssemblage, Assemblage, EventManager } from '../../../src';
import { AwaitableAssemblage } from './awaitable.assemblage';

export enum AwaiterChannels {
  Init = 'awaiter:init',
  Resolved = 'awaiter:resolved',
}

@Assemblage({
  events: Object.values(AwaiterChannels),
})
export class AwaiterAssemblage
  extends EventManager
  implements AbstractAssemblage
{
  constructor(public awaitable: AwaitableAssemblage) {
    super();
  }

  public async onInit(): Promise<void> {
    this.emit(AwaiterChannels.Init, AwaiterChannels.Init);

    await this.awaitable.whenReady();

    this.emit(AwaiterChannels.Resolved, AwaiterChannels.Resolved);
  }
}
