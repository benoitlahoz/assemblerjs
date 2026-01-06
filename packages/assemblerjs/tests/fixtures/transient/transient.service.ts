import { AbstractAssemblage, Assemblage } from '../../../src';

@Assemblage({
  singleton: false,
})
export class TransientAssemblage implements AbstractAssemblage {
  constructor() {}
}
