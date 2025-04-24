import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage, Assembler } from '../src';
import { UserModule } from './fixtures/user-fetch/user.module';

describe('FetchUsers', () => {
  it('should fetch users.', async () => {
    @Assemblage({
      inject: [[UserModule]],
      use: [['api', 'https://dummyjson.com']],
    })
    class App {
      constructor(public users: UserModule) {}
    }

    const app: App = Assembler.build(App);
    const users = await app.users.getAll();
    expect(users.length).toBe(30);

    const user = await app.users.getById(1);
    expect(user.lastName).toBe('Johnson');
  });
});
