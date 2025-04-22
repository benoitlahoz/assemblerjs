import { describe, it, expect } from 'vitest';
import { Memo } from './memo.decorator';

describe('Methods decorators', () => {
  it('should memoize result of a computation.', () => {
    let calls = 0;

    class MyClass {
      @Memo()
      public factorial(n: number): number {
        calls++;
        if (n === 0 || n === 1) return 1;
        return n * this.factorial(n - 1);
      }
    }

    const instance = new MyClass();
    // 2 calls to the function.
    instance.factorial(2);

    // Should not call again but return memoized value.
    instance.factorial(2);
    expect(calls).toBe(2);

    // 4 calls to the function (result doesn't exist).
    instance.factorial(4);
    instance.factorial(4);
    expect(calls).toBe(4);

    // Result exists.
    instance.factorial(2);
    expect(calls).toBe(4);
  });
});
