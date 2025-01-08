import { AbstractAssemblage } from '../../../src/assemblage/abstract';

export abstract class AbstractLogger extends AbstractAssemblage {
  public abstract log(...args: any[]);
  public abstract warn(...args: any[]);
  public abstract error(...args: any[]);
}
