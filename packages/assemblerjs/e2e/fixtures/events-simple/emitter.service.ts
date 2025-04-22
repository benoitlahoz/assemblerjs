import { AbstractAssemblage, Assemblage, EventManager } from '../../../src';

@Assemblage({
  events: ['init'],
})
export class EmitterAssemblage
  extends EventManager
  implements AbstractAssemblage
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
