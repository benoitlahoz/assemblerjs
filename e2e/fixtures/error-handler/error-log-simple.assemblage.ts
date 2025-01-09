import { Assemblage } from '../../../src';
import { AbstractLogger } from '../logger/logger.abstract';
import { AbstractErrorHandler } from './error-handler.abstract';

@Assemblage()
export class ErrorLog implements AbstractErrorHandler {
  // Logger is injected by entry point assemblage.
  constructor(private logger: AbstractLogger) {}

  public handle(err: Error): void {
    return this.logger.error(err.message);
  }
}
