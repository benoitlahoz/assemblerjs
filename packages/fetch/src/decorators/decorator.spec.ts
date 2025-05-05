import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Fetch } from './fetch.decorator';
import { Query } from './query.decorator';
import { Param } from './param.decorator';

class MyDummyUsersService {
  @Fetch(
    'get',

    // Queries passed as params will be replaced
    // 'https://dummyjson.com/users?limit=5&skip=10&select=firstName,age'

    // Queries will be added.
    'https://dummyjson.com/users'
  )
  public async getUsers(
    // This will replace the 'limit' query or add it.
    @Query('limit') limit: number,
    @Query('skip') skip: number,
    @Query('select') select: string[],

    data?: any,
    err?: Error
  ): Promise<any> {
    expect(limit).toBe(10);
    expect(skip).toBe(10);
    expect(select).toStrictEqual(['firstName', 'age']);

    if (data && !err) return data;
    throw err;
  }

  @Fetch('get', 'https://dummyjson.com/users/:id/carts')
  public async getUserCart(
    @Param(':id') id: number,
    data?: any,
    err?: Error
  ): Promise<any> {
    expect(id).toBe(6);

    if (data && !err) return data;
    throw err;
  }
}

describe('Fetch decorator', () => {
  const usersService = new MyDummyUsersService();

  it('should get users with given parameters', async () => {
    const limit = 10;
    const skip = 10;
    const data = await usersService.getUsers(limit, skip, ['firstName', 'age']);

    expect(data.users.length).toBe(limit);
    expect(data.users[0].id).toBe(skip + 1);
    expect(Object.keys(data.users[0]).includes('firstName')).toBeTruthy();
    expect(Object.keys(data.users[0]).includes('age')).toBeTruthy();
  });

  it('should get user cart for given user id', async () => {
    const id = 6;
    const data = await usersService.getUserCart(id);

    expect(data.carts).toBeDefined();
  });
});
