import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import type { FetchStatus } from './fetch.decorator';
import { Fetch } from './fetch.decorator';
import { Query, Param, Placeholder } from './parameter.decorators';
import { Parse } from './parse.decorator';
import {
  methodNameForType,
  registerMethodName,
  replaceMethodName,
} from '@/utils';

const apiHost = 'https://dummyjson.com';

const dynamicUser = {
  firstName: 'Dynamic',
  lastName: 'Header',
  age: 42,
};

class MyDummyUsersService {
  @Fetch(
    'get',

    // Queries passed as params will be replaced by @Query
    // `${apiHost}/users?limit=5&skip=10&select=firstName,age`

    // Queries will be added by @Query.
    `${apiHost}/users`,

    // RequestInit object.
    {
      mode: 'no-cors',
    }
  )

  // We know we will receive JSON data: avoid mime type checks.
  @Parse('json')
  public async getUsers(
    // This will replace the 'limit' query or add it.

    @Query('limit') limit: number,
    @Query('skip') skip: number,

    // Query can be optional. FIXME: Strange bug.

    @Query('select') select?: string[],

    data?: any,
    err?: Error
  ): Promise<any> {
    expect(limit).toBe(10);
    expect(skip).toBe(10);

    if (data && !err) return data;

    // User could return the error instead of throwing.
    throw err;
  }

  @Fetch('get', `${apiHost}/users/:id/carts`)
  public async getUserCart(
    // Colon was ommitted in the parameter name, decorator will add it.
    @Param('id') id: number,
    data?: any,
    err?: Error,
    status?: FetchStatus,
    path?: string
  ): Promise<any> {
    expect(id).toBe(6);

    if (data && !err) return data;
    throw err;
  }

  @Fetch('get', `${apiHost}/users/:id/%kind`)
  public async getSomethingFromUser(
    @Param(':id') id: number,

    // Placeholder can also be optional.

    @Placeholder('%kind') kind?: string,
    data?: any,
    err?: Error,
    status?: FetchStatus,
    path?: string
  ): Promise<any> {
    expect(id).toBe(6);
    if (data && !err) return data;
    throw err;
  }

  @Fetch('post', `${apiHost}/users/add`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  })
  public addUser(
    body: string,
    data?: any,
    err?: Error,
    status?: FetchStatus,
    path?: string
  ) {
    if (data && !err) return data;
    throw err;
  }

  public getRandomNumber(): number {
    return Math.floor(Math.random() * 100);
  }

  @Fetch('post', `${apiHost}/users/add`, { headers: (target) => {
    const randomNumber = target.getRandomNumber();
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Random-Number': randomNumber.toString(),
    };
  }, body: (target) => {
      // We could also build the body dynamically.
      return '{"firstName":"Dynamic","lastName":"Header","age":42}';
    }
  })
  public async addDynamicUser(
    data?: any,
    err?: Error,
    status?: FetchStatus,
    path?: string
  ) {
    if (data && !err) return data;
    throw err;
  }
}

const usersService = new MyDummyUsersService();

describe('Fetch methods parser', () => {
  it('should register a `fetch` method name for given mime type.', async () => {
    // Fetch decorator will call `await res.text()` instead of `await res.json()`
    expect(() => registerMethodName('application/json', 'text')).not.toThrow();
    expect(methodNameForType('application/json')).toBe('text');

    let data = await usersService.getSomethingFromUser(6);
    expect(data).toBeTypeOf('string');

    // On this method we pass the `Parse` decorator that bypass the registered method name.
    data = await usersService.getUsers(10, 10);
    expect(data.users).toBeDefined();

    // Reset for the rest of the tests.
    expect(() => replaceMethodName('application/json', 'json')).not.toThrow();
  });
});

describe('Fetch decorator', () => {
  it('should get users with given parameters', async () => {
    const limit = 10;
    const skip = 10;
    let data = await usersService.getUsers(limit, skip, ['firstName', 'age']);

    expect(data.users.length).toBe(limit);
    expect(data.users[0].id).toBe(skip + 1);
    expect(Object.keys(data.users[0])).toStrictEqual([
      'id',
      'firstName',
      'age',
    ]);

    data = await usersService.getUsers(limit, skip);
    expect(Object.keys(data.users[0])).not.toStrictEqual([
      'id',
      'firstName',
      'age',
    ]);
  });

  it('should get user cart for given user id', async () => {
    const id = 6;
    const data = await usersService.getUserCart(id);
    expect(data.carts).toBeDefined();
  });

  it('should get something from user for given user id', async () => {
    const id = 6;
    let data = await usersService.getSomethingFromUser(id, 'carts');
    expect(data.carts).toBeDefined();

    data = await usersService.getSomethingFromUser(id, 'todos');
    expect(data.todos).toBeDefined();
    expect(data.todos[0].userId).toBe(id);

    // Without 'kind' defined, we get the full user.
    data = await usersService.getSomethingFromUser(id);
    expect(data.id).toBe(6);
  });

  it('should add an user', async () => {
    const user = {
      firstName: 'Owen',
      lastName: 'Thesaints',
      age: 250,
    };
    let data = await usersService.addUser(JSON.stringify(user));

    expect(data).toBeDefined();
    // NB: unfortunately 'dummyjson' returns an user with empty values.
    expect(data.firstName).toBeDefined();
    expect(data.firstName).toBe(user.firstName);
    expect(data.lastName).toBeDefined();
    expect(data.lastName).toBe(user.lastName);
  });

  it('should add an user with dynamic headers', async () => {
    
    const data = await usersService.addDynamicUser();

    expect(data).toBeDefined();
    expect(data.firstName).toBe(dynamicUser.firstName);
    expect(data.lastName).toBe(dynamicUser.lastName);
  });
});
