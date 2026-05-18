import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Dispose,
} from 'assemblerjs';
import { AbstractHttpAdapter } from '../src';
import { FastifyAdapter } from '../src/fastify';
import { ApiController } from './api/api.controller';
import { Posts, Users } from './db';

describe('API Server Application (Fastify)', () => {
  it('should run server.', async () => {
    @Assemblage({
      provide: [[AbstractHttpAdapter, FastifyAdapter], [ApiController]],
    })
    class App implements AbstractAssemblage {
      constructor(
        public server: AbstractHttpAdapter,
        public api: ApiController,
        @Dispose() public dispose: () => void
      ) {}

      public async onInited(): Promise<void> {
        // FastifyAdapter.listen() is async — await ensures the server is
        // fully ready (plugin lifecycle + port bound) before onInited resolves.
        await (this.server as FastifyAdapter).listen(10001);
      }

      public async fetchUsers(): Promise<void> {
        // Fetch all users.
        let res = await fetch('http://localhost:10001/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(users).toStrictEqual(Users);

        // Fetch user with non-existent id.
        res = await fetch('http://localhost:10001/api/user/id/0');
        expect(res.ok).toBeFalsy();
        expect(res.status).toBe(404);

        // Fetch existing user by its id.
        res = await fetch('http://localhost:10001/api/user/id/1');
        expect(res.ok).toBeTruthy();
        const john = await res.json();
        expect(john).toStrictEqual(Users[0]);

        // Fetch all users for given gender.
        res = await fetch('http://localhost:10001/api/user/gender/non-binary');
        expect(res.ok).toBeTruthy();
        const usersForGender = await res.json();
        expect(usersForGender).toStrictEqual(
          Users.filter((u) => u.gender === 'non-binary')
        );
      }

      public async fetchHead(): Promise<void> {
        // HEAD request — body must be empty but custom header must be present.
        const res = await fetch('http://localhost:10001/api/user/headers', {
          method: 'HEAD',
        });
        expect(res.ok).toBeTruthy();
        const headers = res.headers;
        expect(headers.get('x-powered-by')).toBe('My Super Application');
      }

      public async createUsers(): Promise<void> {
        const lastId = Math.max(...Users.map((user) => user.id));
        const nextId = lastId + 1;

        const newUser = {
          name: 'Arsène Lupin',
          gender: 'male',
        };

        let res = await fetch('http://localhost:10001/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newUser),
        });
        expect(res.ok).toBeTruthy();
        expect(res.status).toBe(201);

        const user = await res.json();
        expect(user).toStrictEqual({ id: nextId, ...newUser });

        res = await fetch('http://localhost:10001/api/user');
        expect(res.ok).toBeTruthy();
        const users = await res.json();
        expect(users).toStrictEqual(Users);
      }

      public async modifyUsers(): Promise<void> {
        const id = 1;

        const modifiedUser = { gender: 'non-binary' };
        let res = await fetch(
          `http://localhost:10001/api/user/modify/${id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(modifiedUser),
          }
        );
        expect(res.ok).toBeTruthy();

        let user = await res.json();
        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');
        expect(user.gender).toBe('non-binary');

        const replacingUser = { name: 'John Jane Doe', gender: 'non-binary' };
        res = await fetch(
          `http://localhost:10001/api/user/replace/${id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(replacingUser),
          }
        );
        expect(res.ok).toBeTruthy();

        user = await res.json();
        expect(user.id).toBe(1);
        expect(user.name).toBe('John Jane Doe');
        expect(user.gender).toBe('non-binary');
      }

      public async fetchPosts(): Promise<void> {
        let res = await fetch('http://localhost:10001/api/post');
        expect(res.ok).toBeTruthy();
        let posts = await res.json();
        expect(posts).toStrictEqual(Posts);

        res = await fetch('http://localhost:10001/api/post/sender/1');
        expect(res.ok).toBeTruthy();
        posts = await res.json();
        expect(posts).toStrictEqual([Posts[0]]);

        res = await fetch('http://localhost:10001/api/post/receiver/1');
        expect(res.ok).toBeTruthy();
        posts = await res.json();
        expect(posts).toStrictEqual([Posts[1]]);
      }

      public async createPosts(): Promise<void> {
        const lastId = Math.max(...Posts.map((post) => post.id));
        const nextId = lastId + 1;

        const newPost = {
          sender: 1,
          receiver: 2,
          content: 'Alea jacta est',
        };

        let res = await fetch('http://localhost:10001/api/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(newPost),
        });
        expect(res.ok).toBeTruthy();
        expect(res.status).toBe(201);

        const post = await res.json();
        expect(post).toStrictEqual({ id: nextId, ...newPost });

        res = await fetch('http://localhost:10001/api/post');
        expect(res.ok).toBeTruthy();
        const posts = await res.json();
        expect(posts).toStrictEqual(Posts);

        // Delete post.
        const initialLength = Posts.length;
        res = await fetch('http://localhost:10001/api/post/delete/1', {
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
      // Fastify's async listen() is awaited inside onInited(), but
      // callHookImmediate does not await the onInited promise. Give Fastify
      // extra time to fully bind the port before starting requests.
      setTimeout(async () => {
        expect(app.server.listening).toBeTruthy();

        // Verify path propagation.
        expect(app.api.users.path).toBe('/api/user');
        expect(app.api.posts.path).toBe('/api/post');

        await app.fetchUsers();
        await app.fetchHead();
        await app.createUsers();
        await app.modifyUsers();

        await app.fetchPosts();
        await app.createPosts();

        await app.dispose();
        expect(app.server).toBeUndefined();

        resolve();
      }, 300);
    });
  }, 10000);
});
