import type { Class } from './class.types';

const reservedKeys = <T extends object>(instance: T, ctor: Class<T>) => {
  return [
    // Public methods.
    ...Object.getOwnPropertyNames(ctor.prototype),
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(instance)),
    // Instance's variables.
    ...Object.getOwnPropertyNames(instance),
  ];
};

export const proxifyIterable = <T extends object, U = any>(
  instance: T &
    (
      | {
          [key: number]: U;
          collection: Array<U>;
          [Symbol.iterator]: () => Iterator<U>;
        }
      | {
          [key: string]: U | any;
          collection: Record<string, U>;
          [Symbol.iterator]: () => Iterator<U>;
        }
    ),
  ctor: Class<T>
) => {
  const proxy = new Proxy(instance, {
    // A getter to have the iterator working like an array: `myFileTree[0]`.
    get: function (target: any, name: any) {
      if (name === Symbol.iterator) {
        // for ... of
        return target[Symbol.iterator].bind(target);
      } else if (!reservedKeys(instance, ctor).includes(name)) {
        // If the getter is not an object method or variable,
        // returns the value of the collection at given index or key.
        return target.collection[name];
      }

      return target[name];
    },
    set: function (target: any, prop: string | symbol, value: any) {
      return Reflect.set(target, prop, value);
    },
  });

  return proxy;
};
