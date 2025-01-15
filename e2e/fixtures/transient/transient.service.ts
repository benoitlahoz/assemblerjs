import { AbstractAssemblage, Assemblage, EventManager } from '../../../src';

@Assemblage({
  singleton: false,
})
export class TransientAssemblage implements AbstractAssemblage {
  constructor() {}
}
