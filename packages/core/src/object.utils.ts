import type { AnyFunction } from './function.types';
import type { Tuple } from './collection.types';
import {
  isArray,
  isDefined,
  isObject,
  isOfType,
  isTypeOf,
} from './type.validator';
import { dedupe, intersection } from './array.utils';

/**
 * Get the value at key of an object.
 *
 * @param { Record<PropertyKey, T> } obj The object to get value from.
 * @returns { (key: PropertyKey) => T } A function to get the value for this object.
 */
export const prop =
  <T>(obj: Record<PropertyKey, T>) =>
  (key: PropertyKey) =>
    obj[key];

/**
 * Get all the methods names of an object.
 *
 * @param { any } obj The object to get the methods from.
 * @returns { string[]  } An `Array` of methods names.
 *
 * @see https://stackoverflow.com/a/40577337/1060921
 */
export const getMethodNames = (obj: any): string[] => {
  if (isOfType('object')(obj)) {
    const methods: Set<string> = new Set();
    while ((obj = Reflect.getPrototypeOf(obj))) {
      const keys = Reflect.ownKeys(obj);
      keys.forEach((k) => methods.add(String(k)));
    }
    return Array.from(methods);
  }
  return [];
};

/**
 * Get an object's property descriptors keys.
 *
 * @param { unknown } obj The object to get keys from.
 * @returns { string[] } An `Array` of descriptors keys.
 */
export const getDescriptorsKeys = (obj: unknown) => {
  return isOfType('object')
    ? Object.keys(Object.getOwnPropertyDescriptors(obj))
    : [];
};

/**
 * Checks if an object has a property descriptor with the given key.
 *
 * @param { any } obj The object to test.
 * @param { string } key The key.
 * @returns { boolean } `true` if the object has a descriptor with this key.
 */
export const hasPropertyDescriptor =
  (obj: any) =>
  (key: string): boolean => {
    return getDescriptorsKeys(obj).includes(key);
  };

/**
 * Checks if an object has a method with given name.
 *
 * @param { any } obj The object to test.
 * @param { string } name The name.
 * @returns { boolean } `true` if the object has a method with this name.
 */
export const hasMethod =
  (obj: any) =>
  (name: string): boolean => {
    return getMethodNames(obj).includes(name);
  };

/**
 * Merges one or more objects.
 *
 * @param { ...Record<PropertyKey, any>[] } objs One or more objects to merge.
 * @returns { Record<PropertyKey, any> } Objects merged in a single object.
 */
export const merge = (...objs: Record<PropertyKey, any>[]) =>
  objs.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (isArray(pVal) && isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = merge(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  });

/**
 * Swap `keys` and `values` of an object.
 *
 * @param { Record<PropertyKey, any> } obj The object.
 * @returns { Record<PropertyKey, any> } The object with swapped keys and values.
 */
export const swap = (obj: Record<PropertyKey, any>) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]));

/**
 * Makes a deep copy of an `object`. Also works with `Date`.
 * Inner functions are kept as is, but all properties' values can
 * be replaced, without losing the values in the original object.
 *
 * @param { any } input Any value. If a value is not an object or a date, original value is returned.
 * @returns { any } The cloned object.
 */
export const deepClone = (input: any) => {
  let output;

  if (typeof input !== 'object' || input === null) {
    // What do to with functions, throw an error?
    output = input;
    return output;
  }

  output = new input.constructor();

  for (const prop in input) {
    // eslint-disable-next-line
    if (input.hasOwnProperty(prop)) {
      const type = typeof input[prop];

      if (type == 'object' && typeof input[prop].getMonth === 'function') {
        // Dates.
        output[prop] = new Date(input[prop].getTime());
      } else if (type == 'object' && input[prop] !== null) {
        // Objects.
        output[prop] = deepClone(input[prop]);
      } else {
        // Primitives or functions.
        output[prop] = input[prop];
      }
    }
  }

  return output;
};

/**
 * Returns a function tochec uf a given object / array is strictly equal to another one.
 *
 * @param { unknown } input An object or array.
 * @returns { (other: unknown) => boolean } A function to test strict equality with another object.
 */
export const isStrictEqual =
  (input: unknown) =>
  (other: unknown): boolean => {
    const everyKey = (fn: AnyFunction) =>
      Object.keys(input as Record<PropertyKey, unknown>).every(fn);

    const type = isArray(input)
      ? 'array'
      : isObject(input)
      ? 'object'
      : typeof input;

    switch (type) {
      case 'array':
        return (
          (input as unknown[]).length === (other as unknown[]).length &&
          everyKey((key: number) =>
            isStrictEqual(((input as unknown[]).sort() as any)[key])(
              ((other as unknown[]).sort() as any)[key]
            )
          )
        );

      case 'object':
        return (
          Object.keys(input as Record<PropertyKey, unknown>).length ===
            Object.keys(other as Record<PropertyKey, unknown>).length &&
          everyKey((key: PropertyKey) =>
            isStrictEqual((input as any)[key])((other as any)[key])
          )
        );

      default:
        return input === other;
    }
  };

/**
 * Returns a function to test if two objects keys overlap.
 *
 * @param { unknown } input An unknown input, should be an object to compare.
 * @returns { (other: unknown) => PropertyKey[] | undefined } A function to test if keys of two objects overlap.
 */
export const keysOverlap = (input: unknown) => (other: unknown) => {
  if (
    !isDefined(other) ||
    !isTypeOf(other)(input) ||
    !isOfType('object') ||
    isArray(other)
  )
    return undefined;

  const compareKeys = () => {
    const flattenInput = flatten(input as any);
    const flattenOther = flatten(other as any);

    const intersect = intersection(Object.keys(flattenInput))(
      Object.keys(flattenOther)
    );

    return intersect;
  };

  const keys = compareKeys();
  return keys.length > 0 ? keys : undefined;
};

/**
 * Returns a function to test if two objects values overlap.
 *
 * @param { unknown } input An unknown input, should be an object to compare.
 * @returns { (other: unknown) => unknown[] | undefined } A function to test if values of two objects overlap.
 */
export const valuesOverlap = (input: unknown) => (other: unknown) => {
  if (
    !isDefined(other) ||
    !isTypeOf(other)(input) ||
    !isOfType('object') ||
    isArray(other)
  )
    return undefined;

  const compareValues = () => {
    const flattenInput = flatten(input as any);
    const flattenOther = flatten(other as any);

    const intersect = intersection(Object.values(flattenInput))(
      Object.values(flattenOther)
    );

    return intersect;
  };

  const values = compareValues();
  return values.length > 0 ? values : undefined;
};

/**
 * Returns a function to test if two objects entries overlap, i.e. where both key and value are the same.
 *
 * @param { unknown } input An unknown input, should be an object to compare.
 * @returns { (other: unknown) => unknown[] | undefined } A function to test if entries of two objects overlap.
 */
export const entriesOverlap = (input: unknown) => (other: unknown) => {
  if (
    !isDefined(other) ||
    !isTypeOf(other)(input) ||
    !isOfType('object') ||
    isArray(other)
  )
    return undefined;

  const compareEntries = () => {
    const flattenInput = flatten(input as any);
    const flattenOther = flatten(other as any);

    return Object.entries(flattenInput).filter(
      (entry: Tuple<[PropertyKey, unknown]>) => {
        return (
          // eslint-disable-next-line
          flattenOther.hasOwnProperty(entry[0]) &&
          entry[1] === flattenOther[entry[0]]
        );
      }
    );
  };

  const entries = compareEntries();
  return entries.length > 0
    ? unflatten(Object.fromEntries(entries))
    : undefined;
};

/**
 * Returns a function to test if two objects keys or values overlap, i.e. where a key or a value are the same.
 *
 * @param { unknown } input An unknown input, should be an object to compare.
 * @returns { (other: unknown) => unknown[] | undefined } A function to test if keys or values of two objects overlap.
 */
export const keysOrValuesOverlap = (input: unknown) => (other: unknown) => {
  if (
    !isDefined(other) ||
    !isTypeOf(other)(input) ||
    !isOfType('object') ||
    isArray(other)
  )
    return undefined;

  const compare = () => {
    const inputKeysAndValues = dedupe([
      ...Object.keys(input as any),
      ...Object.values(input as any),
    ]);
    const otherKeysAndValues = dedupe([
      ...Object.keys(other as any),
      ...Object.values(other as any),
    ]);

    return intersection(inputKeysAndValues)(otherKeysAndValues);
  };

  const overlapping = compare();
  return overlapping.length > 0 ? overlapping : undefined;
};

/**
 * Flattens an object by joining its property names until the algorithm find a value that is
 * not an object, or a blocking property that will make it stop the recursion.
 *
 * Slightly adapted from https://stackoverflow.com/a/65883097/1060921
 *
 * @param { Record<PropertyKey, any> } obj The object to flatten.
 * @param { string } blockingProp A property to search in parsed objects,
 * that will block the recursion and keep the next objects unflattened.
 * @returns { Record<string, any> } A flattened object.
 */
export const flatten = <T>(
  obj: Record<PropertyKey, any>,
  blockingProp = ''
): Record<PropertyKey, T> => {
  const flattenRecursive = (
    obj: object,
    parentProperty?: string,
    propertyMap: Record<PropertyKey, T> = {}
  ) => {
    for (const [key, value] of Object.entries(obj)) {
      const property = parentProperty ? `${parentProperty}.${key}` : key;

      if (value && typeof value.getTime === 'function') {
        propertyMap[property] = value;
      } else if (
        value &&
        (typeof value === 'object' || typeof value.getTime === 'function') &&
        // eslint-disable-next-line
        !value.hasOwnProperty(blockingProp)
      ) {
        flattenRecursive(value, property, propertyMap);
      } else {
        propertyMap[property] = value;
      }
    }
    return propertyMap;
  };
  return flattenRecursive(obj);
};

/**
 * Unflatten an object which keys contains `.` to plain object.
 *
 * @see https://stackoverflow.com/a/59787588/1060921
 *
 * @param { Record<PropertyKey, any> } obj The object to unflatten.
 * @returns  { Record<PropertyKey, any> } The plain object.
 */
export const unflatten = (
  obj: Record<PropertyKey, any>
): Record<PropertyKey, any> => {
  const result = {};
  for (const i in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, i)) {
      // Just a complicated regex to only match a single dot in the middle of the string.
      const keys = i.match(/(?:^\.+)?(?:\.{2,}|[^.])+(?:\.+$)?/g);
      if (keys)
        keys.reduce((acc: any, e: string, j: number) => {
          return (
            acc[e] ||
            (acc[e] = isNaN(Number(keys[j + 1]))
              ? keys.length - 1 === j
                ? obj[i]
                : {}
              : [])
          );
        }, result);
    }
  }
  return result;
};

/**
 * Returns a function to get the value of a property in an `object` by its path
 * separated by `.`.
 *
 * @see https://stackoverflow.com/a/42459567/1060921
 *
 * @param { ...path: (PropertyKey)[] } path One or more strings or number that define the path.
 * @returns { (obj: Record<PropertyKey, any>) => any } The function to get the value.
 */
export const valueAtPath =
  (...path: PropertyKey[]) =>
  (obj: Record<PropertyKey, any> | any[]) => {
    const joinedPath = path.map((p: PropertyKey) => String(p)).join('.');
    return joinedPath.split('.').reduce(
      // @ts-expect-error Truthiness
      // eslint-disable-next-line
      (o: Record<PropertyKey, any>, k: string) => (({ ...o } || {})[k]),
      {
        ...obj,
      }
    );
  };

/**
 * @deprecated Use `valueAtPath` instead.
 */
export const valueFromPath =
  (obj: Record<PropertyKey, any> | any[]) => (path: string) =>
    path.split('.').reduce(
      // @ts-expect-error Truthiness
      // eslint-disable-next-line
      (o: Record<PropertyKey, any>, k: string) => (({ ...o } || {})[k]),
      { ...obj }
    );

export const setValueAtPath =
  (...path: PropertyKey[]) =>
  (obj: Record<PropertyKey, any> | any[], value: unknown) => {
    const flat = flatten(obj);
    const joinedPath = path.map((p: PropertyKey) => String(p)).join('.');
    flat[joinedPath] = value;
    return unflatten(flat);
  };

/**
 * Compares an `object`s keys and (string) values and returns a new object which neither keys nor values are
 * contained in the second object's keys or values.
 *
 * @param { Record<PropertyKey, any> } obj The object to remove key or value from.
 * @returns { (toRemove: Record<PropertyKey, any>) => Record<PropertyKey, any> } A function that takes as parameter
 * another objects which keys and values will be removed from the original object.
 *
 * @see https://stackoverflow.com/a/75783824/1060921
 */
export const removeStringKeyOrValue =
  (obj: Record<PropertyKey, any>) => (toRemove: Record<PropertyKey, any>) => {
    const props = [
      ...Object.keys(toRemove),
      ...Object.values(toRemove).map(String),
    ];
    const includesValue = (value: string) => props.includes(value);
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([k, v]) => !(includesValue(k) || includesValue(v))
      )
    );
  };

export default {
  prop,
  getMethodNames,
  getDescriptorsKeys,
  hasPropertyDescriptor,
  hasMethod,
  merge,
  swap,
  isStrictEqual,
  keysOverlap,
  valuesOverlap,
  entriesOverlap,
  keysOrValuesOverlap,
  deepClone,
  flatten,
  unflatten,
  valueFromPath,
  valueAtPath,
  setValueAtPath,
  removeStringKeyOrValue,
};
