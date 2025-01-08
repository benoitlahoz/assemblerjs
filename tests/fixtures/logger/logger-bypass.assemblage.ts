import { Assemblage } from '../../../src/assemblage/decorator';
import { AbstractLogger } from './logger.abstract';

@Assemblage({
  tags: 'tags_test',
})
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
