import { Assemblage } from '../../../src';

@Assemblage()
export class Logger {
  public log(message: string): string {
    return `LOG: ${message}`;
  }
}
