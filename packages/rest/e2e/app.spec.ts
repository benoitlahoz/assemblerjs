import 'reflect-metadata';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';
import { describe, it, expect } from 'vitest';
import { WebFrameworkAdapter } from '../src';
import { ExpressAdapter } from './server';
import { ApiController } from './api/api.controller';
import { Users } from './db';

describe('API Server Application', () => {
  it('should run server.', async () => {
    @Assemblage({
      inject: [
        // Framework adapter MUST be identified by `WebFrameworkAdapter` abstract class to be used by controllers.
        [WebFrameworkAdapter, ExpressAdapter],
        [ApiController],
      ],
    })
    class App implements AbstractAssemblage {
      constructor(
        public server: WebFrameworkAdapter,
        public api: ApiController,
        @Dispose() public dispose: () => void
      ) {}

      public async onInited(): Promise<void> {
        this.server.listen(9999);
      }

      public async fetchUsers(): Promise<void> {
        // Fetch users.
        let res = await fetch('http://localhost:9999/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(users).toStrictEqual(Users);

        // Fetch user with non-existent id.
        res = await fetch('http://localhost:9999/api/user/0');
        expect(res.ok).toBeFalsy();
        expect(res.status).toBe(404);

        // Fetch existing user by its id.
        res = await fetch('http://localhost:9999/api/user/id/1');
        expect(res.ok).toBeTruthy();
        const john = await res.json();
        expect(john).toStrictEqual(Users[0]);

        // Fetch all users for given gender.
        res = await fetch('http://localhost:9999/api/user/gender/non-binary');
        expect(res.ok).toBeTruthy();
        const usersForGender = await res.json();
        expect(usersForGender).toStrictEqual(
          Users.filter((u: any) => u.gender === 'non-binary')
        );
      }

      public async createUsers(): Promise<void> {
        const lastId = Math.max(...Users.map((user: any) => user.id));
        const nextId = lastId + 1;

        const newUser = {
          name: 'Arsène Lupin',
          gender: 'male',
        };

        let res = await fetch('http://localhost:9999/api/user', {
          method: 'post',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newUser),
        });
        expect(res.ok).toBeTruthy();

        const user = await res.json();
        expect(user).toStrictEqual({
          id: nextId,
          ...newUser,
        });

        res = await fetch('http://localhost:9999/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(users).toStrictEqual(Users);
      }

      public onDispose(): void {
        expect(this.server.listening).toBeFalsy();
      }
    }

    const app = Assembler.build(App);

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        expect(app.server.listening).toBeTruthy();
        await app.fetchUsers();
        await app.createUsers();
        app.dispose();
        expect(app.server).toBeUndefined();

        resolve();
      }, 100);
    });
  });
});
