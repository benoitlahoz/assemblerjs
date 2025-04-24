import { describe, it, expect } from 'vitest';
import PromiseUtils from './promise.utils';

const { deferred } = PromiseUtils;

describe('PromiseUtils', () => {
  it('should create a deferred promise.', async () => {
    // Declare promise...
    const promise = deferred<number>();
    promise.then((res: number) => expect(res).toBe(1));

    // ...then resolve it.
    promise.resolve(1);
  });
});
