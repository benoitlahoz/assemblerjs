import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Body, Fetch, Header, Query, Param, Placeholder, Parse } from '@/index';
import type { FetchStatus } from '@/index';
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

    // If the query is optional, it will be added only if a value is passed.
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

  // Use a runtime path builder.
  private idToken = ':id'

  @Fetch('get', (target: MyDummyUsersService) => `${apiHost}/users/${target.idToken}/carts`)
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

  @Fetch('post', `${apiHost}/users/add`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  })
  public addUserWithBodyDecorator(
    @Body() body: string,
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

  it('should add an user with @Body decorator', async () => {
    const user = {
      firstName: 'Body',
      lastName: 'Decorator',
      age: 30,
    };
    const data = await usersService.addUserWithBodyDecorator(JSON.stringify(user));

    expect(data).toBeDefined();
    expect(data.firstName).toBe(user.firstName);
    expect(data.lastName).toBe(user.lastName);
  });

  it('should add an user with dynamic headers', async () => {
    
    const data = await usersService.addDynamicUser();

    expect(data).toBeDefined();
    expect(data.firstName).toBe(dynamicUser.firstName);
    expect(data.lastName).toBe(dynamicUser.lastName);
  });
});

class AdvancedFetchOptionsService {
  @Fetch('get', 'https://example.test/users')
  async getUsersWithHeader(
    @Header('x-trace-id') traceId: string,
    data?: any,
    err?: Error
  ) {
    if (data && !err) return data;
    throw err;
  }

  @Fetch('get', 'https://example.test/retry', {
    retry: 1,
  })
  async getWithRetry(data?: any, err?: Error) {
    if (data && !err) return data;
    throw err;
  }

  @Fetch('get', 'https://example.test/timeout', {
    timeout: 10,
  })
  async getWithTimeout(data?: any, err?: Error) {
    if (data && !err) return data;
    throw err;
  }
}

describe('Fetch decorator advanced options', () => {
  const service = new AdvancedFetchOptionsService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should inject header values from @Header decorators', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const data = await service.getUsersWithHeader('trace-123');

    expect(data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const calledInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(calledInit?.headers);
    expect(headers.get('x-trace-id')).toBe('trace-123');
  });

  it('should retry once when first response is not ok', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'temporary failure' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const data = await service.getWithRetry();

    expect(data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should fail with timeout when response takes too long', async () => {
    const fetchMock = vi.fn().mockImplementation((_: string, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        const signal = init?.signal;
        const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));

        if (signal?.aborted) {
          onAbort();
          return;
        }

        signal?.addEventListener('abort', onAbort, { once: true });

        setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve(
            new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            })
          );
        }, 50);
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(service.getWithTimeout()).rejects.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
