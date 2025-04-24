import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FunctionUtils from './function.utils';
import type { Callback } from './function.types';

const {
  NoOp,
  Identity,
  debounce,
  debounceAsync,
  pipe,
  pipeAsync,
  compose,
  composeAsync,
  trampoline,
  curry,
  uncurry,
  promisify,
  getCalleeFilePath,
  getCalleeName,
  getCallerName,
  parseArgs,
} = FunctionUtils;

let debounceResult = 0;
const spies = {
  NoOp,
  Identity,
  debouncedCallback: (x: number) => {
    debounceResult = x * 2;
  },
  runDebounced: (callback: (x: number) => void, ms: number) =>
    debounce(callback, ms),
  asyncDebouncedCallback: (x: number) => x * 2,
  runAsyncDebounced: (callback: (x: number) => number, ms: number) =>
    debounceAsync(callback, ms),
};

describe('FunctionUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should use NoOp.', () => {
    const spy = vi.spyOn(spies, 'NoOp');

    expect(spy.getMockName()).toEqual('NoOp');
    expect(spies.NoOp()).toBeUndefined();
    expect(spy).toHaveBeenCalled();
  });

  it('should use Identity.', () => {
    const spy = vi.spyOn(spies, 'Identity');

    expect(spy.getMockName()).toEqual('Identity');
    expect(spies.Identity(1)).toBe(1);
    expect(spy).toHaveBeenCalled();
  });

  it('should debounce a callback.', () => {
    const delay = 300;

    const spyDebounce = vi.spyOn(spies, 'runDebounced');
    const spyDebounceCallback = vi.spyOn(spies, 'debouncedCallback');

    const debounced = spies.runDebounced(spies.debouncedCallback, delay);

    debounced(2);

    expect(spyDebounce).toBeCalled();
    expect(spyDebounceCallback).not.toBeCalled();

    vi.advanceTimersByTime(delay);

    expect(debounceResult).toBe(4);

    expect(spyDebounceCallback).toHaveBeenCalled();
  });

  it('should asynchonously debounce a callback that returns a result.', async () => {
    vi.useRealTimers();
    const delay = 300;

    const spyDebounce = vi.spyOn(spies, 'runAsyncDebounced');
    const spyDebounceCallback = vi.spyOn(spies, 'asyncDebouncedCallback');

    const debounced = spies.runAsyncDebounced(
      spies.asyncDebouncedCallback,
      delay
    );

    const res = await debounced(2);

    expect(spyDebounce).toHaveBeenCalled();
    expect(spyDebounceCallback).toHaveBeenCalled();
    expect(res).toBe(4);
  });

  it('should pipe functions.', () => {
    const add = (x: number) => x + 2;
    const multBy2 = (x: number) => x * 2;
    const divBy4 = (x: number) => x / 4;

    const doIt = pipe(add, multBy2, divBy4);
    expect(doIt(1)).toBe(1.5);
    expect(doIt(2)).toBe(2);
    expect(doIt(3)).toBe(2.5);

    const doItAgain = pipe(doIt, multBy2);
    expect(doItAgain(1)).toBe(3);
    expect(doItAgain(2)).toBe(4);
    expect(doItAgain(3)).toBe(5);
  });

  it('should compose functions.', () => {
    const add = (x: number) => x + 2;
    const multBy2 = (x: number) => x * 2;
    const divBy4 = (x: number) => x / 4;

    const doIt = compose(divBy4, multBy2, add);
    expect(doIt(1)).toBe(1.5);
    expect(doIt(2)).toBe(2);
    expect(doIt(3)).toBe(2.5);

    const doItAgain = compose(multBy2, doIt);
    expect(doItAgain(1)).toBe(3);
    expect(doItAgain(2)).toBe(4);
    expect(doItAgain(3)).toBe(5);
  });

  it('should pipe asynchronous functions.', async () => {
    vi.useRealTimers();

    const add = (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x + 2), 100));
    const multBy2 = (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x * 2), 100));
    const divBy4 = (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x / 4), 100));

    const doIt = pipeAsync(add, multBy2, divBy4);
    expect(await doIt(1)).toBe(1.5);
    expect(await doIt(2)).toBe(2);
    expect(await doIt(3)).toBe(2.5);

    const doItAgain = pipeAsync(doIt, multBy2);
    expect(await doItAgain(1)).toBe(3);
    expect(await doItAgain(2)).toBe(4);
    expect(await doItAgain(3)).toBe(5);
  });

  it('should compose asynchronous functions.', async () => {
    vi.useRealTimers();

    const add = (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x + 2), 100));
    const multBy2 = (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x * 2), 100));
    const divBy4 = (x: number) =>
      new Promise((resolve) => setTimeout(() => resolve(x / 4), 100));

    const doIt = composeAsync(divBy4, multBy2, add);
    expect(await doIt(1)).toBe(1.5);
    expect(await doIt(2)).toBe(2);
    expect(await doIt(3)).toBe(2.5);

    const doItAgain = composeAsync(multBy2, doIt);
    expect(await doItAgain(1)).toBe(3);
    expect(await doItAgain(2)).toBe(4);
    expect(await doItAgain(3)).toBe(5);
  });

  it('should compute fibonacci (trampoline).', () => {
    const fibo = (x: number, a: number = 0) => {
      if (x < 2) return a;

      // Main recursive call is at the end of the function.
      return () => fibo(x - 1, x + a);
    };

    expect(trampoline(fibo, 30000)).toBe(450014999);
  });

  it('should fetch data via a pipe of asynchronous functions.', async () => {
    const fetchJoke = async (n: number) =>
      fetch(`https://v2.jokeapi.dev/joke/Any?idRange=${n}`);
    const toJson = async (res: Response) => res.json();
    const parseJoke = (json: Record<string, any>) => json.joke;

    const getJoke = pipeAsync<number & Response>(fetchJoke, toJson, parseJoke);
    expect(await getJoke(23)).toBe(
      'The glass is neither half-full nor half-empty, the glass is twice as big as it needs to be.'
    );
  });

  it('should curry and uncurry functions.', () => {
    const add = (x: number, y: number) => x + y;
    const curriedAdd = curry(add);

    expect(typeof curriedAdd).toBe('function');
    expect(typeof curriedAdd(1)).toBe('function');
    expect(curriedAdd(1)(1)).toBe(2);

    const other = (x: number, y: number, z: number) => (x + y) * z;
    const curriedOther = curry(other);

    expect(typeof curriedOther).toBe('function');
    expect(typeof curriedOther(1)).toBe('function');
    expect(typeof curriedOther(1)(1)).toBe('function');
    expect(curriedOther(1)(1)(2)).toBe(4);

    const originalAdd = uncurry(curriedAdd);
    expect(originalAdd(1, 1)).toBe(2);

    const originalOther = uncurry(curriedOther);
    expect(originalOther(1, 1, 2)).toBe(4);
  });

  it('should promisify a function that expect a callback', () => {
    const fnWithCallback = (
      value: boolean,
      callback: Callback<string | null, boolean>
    ) => {
      if (value === true) {
        callback(null, value);
      } else {
        callback('An error', value);
      }
    };

    fnWithCallback(true, (err: unknown, value: boolean) => {
      expect(err).toBeNull();
      expect(value).toBeTruthy();
    });

    fnWithCallback(false, (err: unknown, value: boolean) => {
      expect(err).toBe('An error');
      expect(value).toBeFalsy();
    });

    const promise = promisify(fnWithCallback);
    promise(false).catch((err: unknown) => expect(err).toBe('An error'));
    promise(true).then((result: boolean) => expect(result).toBeTruthy());
  });

  it('should get caller function name, current function name and current file path.', () => {
    const fn = () => {
      return {
        callee: getCalleeName(),
        caller: getCallerName(),
      };
    };

    const launchFn = () => {
      return {
        fn: fn(),
        launchFn: {
          callee: getCalleeName(),
          caller: getCallerName(),
        },
      };
    };

    expect(getCalleeName()).toBeNull();
    expect(getCallerName()).toBeNull();

    expect(launchFn()).toStrictEqual({
      fn: {
        callee: fn.name,
        caller: launchFn.name,
      },
      launchFn: {
        callee: launchFn.name,
        caller: null,
      },
    });

    expect(getCalleeFilePath()?.startsWith('/')).toBeTruthy();
    expect(
      getCalleeFilePath()?.includes('function.utils.spec.ts')
    ).toBeTruthy();
  });

  it('should parse arguments in a function.', () => {
    const argsLengthFns = {
      1: () => 'one',
      3: () => 'three',
    };

    const switchArgsLength = parseArgs(argsLengthFns, () => 'unknown');
    expect(switchArgsLength('foo')).toBe('one');
    expect(switchArgsLength('foo', 'bar', 'baz')).toBe('three');
    expect(switchArgsLength('foo', 'bar')).toBe('unknown');
  });
});
