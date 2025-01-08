import { Assemblage } from '../../../src/assemblage/decorator';
import { AbstractLogger } from '../abstractions/logger.abstract';

@Assemblage()
export class BypassLogger implements AbstractLogger {
  public log(...args: any[]) {
    return args;
  }

  public warn(...args: any[]) {
    return args;
  }

  public error(...args: any[]) {
    return args;
  }
}
