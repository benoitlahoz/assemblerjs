import { AbstractAssemblage } from '../../../src/assemblage/abstract';
import { Assemblage } from '../../../src/assemblage/decorator';
import { AbstractLogger } from '../logger/logger.abstract';

@Assemblage()
export class ErrorLog implements AbstractAssemblage {
  // Logger is injected by entry point assemblage.
  constructor(private logger: AbstractLogger) {}

  public log(err: Error): void {
    return this.logger.error(err.message);
  }
}
