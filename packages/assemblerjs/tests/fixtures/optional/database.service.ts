import { Assemblage } from '../../../src';

@Assemblage()
export class Database {
  public query(sql: string): string {
    return `Query: ${sql}`;
  }
}
