/**
 * A singleton decorator.
 *
 * @param { T } ctor The original constructor of the class.
 * @returns { T } An instance of original class as a singleton.
 *
 * @template T The type of the original class.
 */
export const Singleton = <T extends new (...args: any[]) => any>(
  ctor: T
): T => {
  let instance: T;

  return class {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }

      instance = new ctor(...args);
      return instance;
    }
  } as T;
};
