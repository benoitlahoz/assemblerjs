import { Assemblage, EventManager } from '../../../src';
import { AbstractEmitterAssemblage } from './emitter.abstract';

@Assemblage({
  events: ['init'],
})
export class EmitterAssemblage
  extends EventManager
  implements AbstractEmitterAssemblage
{
  constructor() {
    // Discouraged: User can add channels' names in 'super' call.
    // They will be added before 'events' definition's property.
    super(/* 'init' */);
  }

  public async onInit(): Promise<void> {
    setTimeout(() => {
      this.emit('init', true);
    }, 20);
  }
}
