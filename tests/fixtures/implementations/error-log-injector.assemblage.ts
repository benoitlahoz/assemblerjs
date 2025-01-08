import { Assemblage } from '../../../src/assemblage/decorator';
import { AbstractErrorHandler } from '../abstractions/error-handler.abstract';
import { AbstractLogger } from '../abstractions/logger.abstract';
import { BypassLogger } from './logger-bypass.assemblage';

@Assemblage({
  inject: [[AbstractLogger, BypassLogger]],
})
export class ErrorLogInjector implements AbstractErrorHandler {
  constructor(private logger: AbstractLogger) {}

  public throw(err: Error): void {
    return this.logger.error(err.message);
  }
}
