import { AbstractAssemblage } from '../../../src/assemblage/abstract';

export abstract class AbstractErrorHandler extends AbstractAssemblage {
  public abstract log(err: Error);
}
