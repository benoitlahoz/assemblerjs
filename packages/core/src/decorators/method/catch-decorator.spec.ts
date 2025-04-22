import { describe, it, expect } from 'vitest';
import { Catch } from './catch.decorator';
import { Result } from '@/monad-like';
import { fail } from 'assert';

describe('Catch Decorator', () => {
  it('should wrap a method in a `Result` or a `Task` to catch error.', async () => {
    class MyClass {
      // Returns a number or an error.
      @Catch()
      public addTwo(value: number): number | Error {
        if (typeof value !== 'number') {
          throw new Error('Not a number.');
        }
        return value + 2;
      }

      // Returns a number or an error.
      @Catch()
      public async addTwoAsync(value: number): Promise<number | Error> {
        return new Promise((resolve, reject) => {
          if (typeof value !== 'number') {
            reject(new Error('Not a number.'));
          }
          resolve(value + 2);
        });
      }

      // Returns a `Result` with number or an error.
      // Note the generic type.
      @Catch({ foldable: true })
      public addTwoFoldable<T = number & Result<number>>(value: number): T {
        if (typeof value !== 'number') {
          throw new Error('Not a number.');
        }
        return (value + 2) as T;
      }

      // Returns a `Result` with number or an error.
      // Note the generic type.
      @Catch({ foldable: true })
      public async addTwoAsyncFoldable<T = number & Result<number>>(
        value: number
      ): Promise<T> {
        return new Promise((resolve, reject) => {
          if (typeof value !== 'number') {
            reject(new Error('Not a number.'));
          }
          resolve((value + 2) as T);
        });
      }
    }

    const instance = new MyClass();
    expect(instance).toBeDefined();

    // @ts-expect-error
    expect(instance.addTwo('foo')).toBeInstanceOf(Error);
    expect(instance.addTwo(2)).toBe(4);

    // @ts-expect-error
    expect(await instance.addTwoAsync('foo')).toBeInstanceOf(Error);
    expect(await instance.addTwoAsync(2)).toBe(4);

    expect(instance.addTwoFoldable(2)).toBeInstanceOf(Result);
    instance.addTwoFoldable(2).fold(
      (_: unknown) => fail('Should not be called.'),
      (res: number) => expect(res).toBe(4)
    );

    expect(await instance.addTwoAsyncFoldable(2)).toBeInstanceOf(Result);
    (await instance.addTwoAsyncFoldable(2)).fold(
      (_: unknown) => fail('Should not be called.'),
      (res: number) => expect(res).toBe(4)
    );
  });
});
