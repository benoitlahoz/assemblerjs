import type { Class } from './class.types';

/**
 * Checks if a class name or contructor's name includes `_default`.
 *
 * @param { Object } klass The class (not instance) to test.
 * @returns { boolean | null } A `boolean` if the class has name or contructor name, or `null` if not.
 */
export const isDefault = (klass: any): boolean | null => {
  if (klass.constructor && klass.constructor.name) {
    return klass.constructor.name.includes('default_');
  } else if (klass.name) {
    return klass.name.includes('default_');
  } else return null;
};

/**
 * Clears all properties and methods from the instance of a class.
 *
 * @param { T extends object } instance The instance to be cleared.
 * @param { Class<T> } klass The base class of the instance.
 */
export const clearInstance = <T extends object>(
  instance: T,
  klass: Class<T>
): void => {
  const objKeys = <T extends object>(instance: T, ctor: Class<T>) => {
    return [
      // Instance's variables.
      ...Object.getOwnPropertyNames(instance),
    ];
  };

  const self = instance as any;
  for (const key of objKeys(instance, klass)) {
    delete self[key];
  }
};

export default {
  isDefault,
  clearInstance,
};
