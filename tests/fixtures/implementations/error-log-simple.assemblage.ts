import { AbstractAssemblage } from '../../../src/assemblage/abstract';
import { Assemblage } from '../../../src/assemblage/decorator';
import { AbstractLogger } from '../abstractions/logger.abstract';

@Assemblage()
export class ErrorLog implements AbstractAssemblage {
  constructor(private logger: AbstractLogger) {}

  public throw(err: Error): void {
    return this.logger.error(err.message);
  }
}
