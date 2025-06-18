import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';
import { WebFrameworkAdapter, ExpressAdapter } from '../src';
import { ApiController } from './api/api.controller';
import { Posts, Users } from './db';

describe('API Server Application', () => {
  it('should run server.', async () => {
    @Assemblage({
      inject: [
        // Framework adapter MUST be identified by `WebFrameworkAdapter` abstract class to be used by controllers.
        [WebFrameworkAdapter, ExpressAdapter],
        [ApiController],
      ],
      adapter: WebFrameworkAdapter,
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
        //  Get allowed methods.
        let res = await fetch('http://localhost:9999/api/user', {
          method: 'OPTIONS',
        });
        expect(res.ok).toBeTruthy();
        const options = await res.text();
        expect(
          options.includes('GET') &&
            options.includes('HEAD') &&
            options.includes('POST')
        ).toBeTruthy();

        // Fetch users.
        res = await fetch('http://localhost:9999/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(users).toStrictEqual(Users);

        // Try 'HEAD' method for a path that only set headers.
        res = await fetch('http://localhost:9999/api/user/headers', {
          method: 'HEAD',
        });
        expect(res.ok).toBeTruthy();
        const headers = res.headers;
        expect(headers.get('x-powered-by')).toBe('My Super Application');

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
          method: 'POST',
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

      public async modifyUsers(): Promise<void> {
        const id = 1;
        const modifiedUser = {
          gender: 'non-binary',
        };

        let res = await fetch(`http://localhost:9999/api/user/modify/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(modifiedUser),
        });
        expect(res.ok).toBeTruthy();

        let user = await res.json();
        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');
        expect(user.gender).toBe('non-binary');

        const replacingUser = {
          name: 'John Jane Doe',
          gender: 'non-binary',
        };

        res = await fetch(`http://localhost:9999/api/user/replace/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(replacingUser),
        });
        expect(res.ok).toBeTruthy();

        user = await res.json();
        expect(user.id).toBe(1);
        expect(user.name).toBe('John Jane Doe');
        expect(user.gender).toBe('non-binary');
      }

      public async fetchPosts(): Promise<void> {
        let res = await fetch('http://localhost:9999/api/post');
        expect(res.ok).toBeTruthy();
        let posts = await res.json();
        expect(posts).toStrictEqual(Posts);

        res = await fetch('http://localhost:9999/api/post/sender/1');
        expect(res.ok).toBeTruthy();
        posts = await res.json();
        expect(posts).toStrictEqual([Posts[0]]);

        res = await fetch('http://localhost:9999/api/post/receiver/1');
        expect(res.ok).toBeTruthy();
        posts = await res.json();
        expect(posts).toStrictEqual([Posts[1]]);
      }

      public async createPosts(): Promise<void> {
        const lastId = Math.max(...Posts.map((post: any) => post.id));
        const nextId = lastId + 1;

        const newPost = {
          sender: 1,
          receiver: 2,
          content: 'Alea jacta est',
        };

        let res = await fetch('http://localhost:9999/api/post', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newPost),
        });
        expect(res.ok).toBeTruthy();

        const post = await res.json();
        expect(post).toStrictEqual({
          id: nextId,
          ...newPost,
        });

        res = await fetch('http://localhost:9999/api/post');
        expect(res.ok).toBeTruthy();
        const posts = await res.json();
        expect(posts).toStrictEqual(Posts);

        // Delete post.
        const initialLength = Posts.length;
        res = await fetch('http://localhost:9999/api/post/delete/1', {
          method: 'DELETE',
        });

        expect(res.ok).toBeTruthy();

        const deleted = await res.json();
        expect(deleted.id).toBe(1);
        expect(Posts.length).toBe(initialLength - 1);
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
        await app.modifyUsers();

        await app.fetchPosts();
        await app.createPosts();

        app.dispose();
        expect(app.server).toBeUndefined();

        resolve();
      }, 100);
    });
  });
});
