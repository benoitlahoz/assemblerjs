import { describe, it, expect } from 'vitest';
import { asyncMap } from '@/loop.utils';
import { Task } from '../monad-like/task.monad';
import { Maybe } from '../monad-like/maybe.monad';
import { Traverse } from './traverse.applicative';

describe('Traverse', () => {
  it('should apply functions to values and collect results', async () => {
    const traverse = Traverse.of([(x: number) => x * 2, (x: number) => x + 1]);
    const results = await traverse.ap([1, 2, 3]);
    expect(results).toEqual([2, 4, 6, 2, 3, 4]);
  });

  it('should handle errors during function application', async () => {
    const traverse = Traverse.of([
      (x: number) => x * 2,
      (_: number) => {
        throw new Error('Test Error');
      },
    ]);
    const results = await traverse.ap([1, 2]);
    expect(results).toEqual([
      2,
      4,
      new Error('Test Error'),
      new Error('Test Error'),
    ]);
  });

  it('should handle async functions', async () => {
    const traverse = Traverse.of([
      async (x: number) => x * 2,
      async (x: number) => x + 1,
    ]);
    const results = await traverse.ap([1, 2]);
    expect(results).toEqual([2, 4, 2, 3]);
  });

  it('should work with Task monad', async () => {
    const task = (x: number) => Task.of(() => 42 + x);
    const traverse = Traverse.of([task]);
    const apply = await traverse.ap([1]);
    const result = await asyncMap(apply)(async (fn) =>
      (await fn.fork()).unwrap()
    );
    expect(result).toEqual([43]);
  });

  it('should work with Maybe monad', async () => {
    const maybeFn = (x: number) => Maybe.of(x > 0 ? x * 2 : null);
    const traverse = Traverse.of([maybeFn]);
    const maybes: Array<Maybe<number | null>> = (await traverse.ap([
      1, -1, 2,
    ])) as Maybe<number | null>[];
    const results = maybes.map((maybe) => maybe.unwrapOr(null));
    expect(results).toEqual([2, null, 4]);
  });

  it('should map functions correctly', () => {
    const traverse = Traverse.of([(x: number) => x * 2, (x: number) => x + 1]);
    const mappedTraverse = traverse.map(
      (fn: Function) => (x: number) => fn(x) + 1
    );
    const results = mappedTraverse.getFunctions().map((fn) => fn(2));
    expect(results).toEqual([5, 4]);
  });

  it('should chain multiple Traverse operations', () => {
    const traverse = Traverse.of([(x: number) => x * 2, (x: number) => x + 1]);
    const chainedTraverse = traverse.chain((fn: Function) =>
      Traverse.of([(x: number) => fn(x) + 3])
    );
    const results = chainedTraverse.getFunctions().map((fn) => fn(2));
    expect(results).toEqual([7, 6]);
  });

  it('should call the function with undefined value if no values are provided', async () => {
    const traverse = Traverse.of([() => 2 * 2, () => 1 + 1]);
    const results = await traverse.ap();
    expect(results).toEqual([4, 2]);
  });

  it('should call the function with undefined value and async functions in input', async () => {
    const traverse = Traverse.of([
      async () =>
        await new Promise<number>((resolve) =>
          setTimeout(() => resolve(2 * 2), 10)
        ),
      async () =>
        await new Promise<number>((resolve) =>
          setTimeout(() => resolve(1 + 1), 20)
        ),
      async () =>
        await new Promise<number | Error>((reject) =>
          setTimeout(() => reject(new Error('Test Error')), 30)
        ),
    ]);
    const results = await traverse.ap();
    expect(results).toEqual([4, 2, new Error('Test Error')]);
  });

  it('should handle empty functions array', async () => {
    const traverse = Traverse.of([]);
    const results = await traverse.ap([1, 2, 3]);
    expect(results).toEqual([]);
  });
});
