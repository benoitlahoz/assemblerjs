import { AbstractAssemblage, Assemblage, EventManager } from '../../../src';
import { EmitterAssemblage } from './emitter.assemblage';

@Assemblage()
export class SubscriberAssemblage implements AbstractAssemblage {
  public received = false;

  constructor(private emitter: EmitterAssemblage) {
    this.emitter.on('init', (value: boolean) => {
      this.received = value;
    });
  }
}
