import { AbstractAssemblage, Assemblage } from '../../../src';
import { AbstractEmitterAssemblage } from './emitter.abstract';

@Assemblage()
export class SubscriberAssemblage implements AbstractAssemblage {
  public received = false;

  constructor(private emitter: AbstractEmitterAssemblage) {
    this.emitter.on('init', (value: boolean) => {
      this.received = value;
    });
  }
}
