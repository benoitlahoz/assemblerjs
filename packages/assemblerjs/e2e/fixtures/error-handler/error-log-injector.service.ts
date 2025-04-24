import { Assemblage } from '../../../src';
import { AbstractErrorHandler } from './error-handler.abstract';
import { AbstractLogger } from '../logger/logger.abstract';
import { BypassLogger } from '../logger/logger-bypass.service';

@Assemblage({
  inject: [[AbstractLogger, BypassLogger]],
  tags: 'tags_test',
})
export class ErrorLogInjector implements AbstractErrorHandler {
  // Logger is injected by this assemblage.
  constructor(private logger: AbstractLogger) {}

  public handle(err: Error): void {
    return this.logger.error(err.message);
  }
}
