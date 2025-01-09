import { Assemblage } from '../../../src';
import { EventManager } from '../../../src/events/event-manager';
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
    super();
  }

  public async onInit(): Promise<void> {
    setTimeout(() => {
      this.emit('init', true);
    }, 20);
  }
}
