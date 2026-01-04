import { Assemblage } from '../../../src';

@Assemblage()
export class Cache {
  private data = new Map<string, any>();

  public get(key: string): any {
    return this.data.get(key);
  }

  public set(key: string, value: any): void {
    this.data.set(key, value);
  }
}
