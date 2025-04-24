// https://github.com/baetheus/fun/blob/main/promise.ts

import { Observable } from './observable/observable.module';

export type Deferred<A> = Promise<A> & {
  readonly resolve: (a: A | PromiseLike<A>) => void;
};

export const deferred = <A = never>(): Deferred<A> => {
  let method;
  const promise = new Promise((res) => {
    method = { resolve: async (a: A | PromiseLike<A>) => res(await a) };
  });
  return Object.assign(promise, method);
};

export const wait = (ms: number): Promise<number> & Disposable => {
  const disposable = {} as unknown as Disposable;
  const result = new Promise<number>((res) => {
    let open = true;
    const resolve = () => {
      if (open) {
        open = false;
        res(ms);
      }
    };
    const handle = setTimeout(resolve, ms);
    disposable[Symbol.dispose] = () => {
      if (open) {
        clearTimeout(handle);
        resolve();
      }
    };
  });

  return Object.assign(result, disposable);
};

export const resolve = <A>(a: A | PromiseLike<A>): Promise<A> =>
  Promise.resolve(a);

export const reject = (rejection: unknown): Promise<never> =>
  Promise.reject(rejection);

/**
 * A function that takes an Observable on boolean and resolve when it's value is truthy.
 *
 * @param { Observable<boolean> } bool The observable.
 * @param { boolean } once When set to true, dispose the observable (default to `true`).
 * @returns { Promise<void> } A new Promise.
 */
export const resolveOnTrue = (
  bool: Observable<boolean>,
  once = true
): Promise<void> => {
  return new Promise((resolve) => {
    const onTrue = () => {
      if (once) {
        bool.dispose();
      }
      resolve();
    };

    if (bool.value === true) {
      onTrue();
    } else {
      bool.watch(onTrue);
    }
  });
};

export default {
  deferred,
  wait,
  resolve,
  reject,
  resolveOnTrue,
};
