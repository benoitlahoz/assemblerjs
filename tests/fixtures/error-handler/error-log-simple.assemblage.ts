import { AbstractAssemblage, Assemblage } from '../../../src';
import { AbstractLogger } from '../logger/logger.abstract';

@Assemblage()
export class ErrorLog implements AbstractAssemblage {
  // Logger is injected by entry point assemblage.
  constructor(private logger: AbstractLogger) {}

  public log(err: Error): void {
    return this.logger.error(err.message);
  }
}
