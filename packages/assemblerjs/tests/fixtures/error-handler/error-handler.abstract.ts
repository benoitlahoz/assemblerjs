import { AbstractAssemblage } from '../../../src';

export abstract class AbstractErrorHandler extends AbstractAssemblage {
  public abstract handle(err: Error);
}
