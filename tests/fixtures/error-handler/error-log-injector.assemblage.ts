import { Assemblage } from '../../../src/assemblage/decorator';
import { AbstractErrorHandler } from './error-handler.abstract';
import { AbstractLogger } from '../logger/logger.abstract';
import { BypassLogger } from '../logger/logger-bypass.assemblage';

@Assemblage({
  inject: [[AbstractLogger, BypassLogger]],
  tags: 'tags_test',
})
export class ErrorLogInjector implements AbstractErrorHandler {
  // Logger is injected by this assemblage.
  constructor(private logger: AbstractLogger) {}

  public log(err: Error): void {
    return this.logger.error(err.message);
  }
}
