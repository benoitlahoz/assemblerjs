import { AbstractAssemblage } from '../../../src/assemblage/abstract';

export abstract class AbstractErrorHandler extends AbstractAssemblage {
  public abstract throw(err: Error);
}
