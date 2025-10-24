import { isDefined, isOfType, isString } from './type.validator';
import { deepClone, valueAtPath } from './object.utils';
import { forIn } from './loop.utils';
import { conditionally, switchCase } from './conditional.utils';

/**
 * Returns a function to get the `length` number of items from the beginning of an array.
 *
 * @param { unknown[] } arr The `Array` to get items from.
 * @returns { (length: number) => unknown[] } A function that returns a new `Array`.
 *
 * @see https://medium.com/@jacobchodubski/10-useful-js-utility-functions-that-save-time-ac0198587d4f
 */
export const first =
  (arr: unknown[]) =>
  (length = 1) =>
    arr.filter((_: unknown, index: number) => index < length);

/**
 * Returns a function to get the `length` number of items from the end of an array.
 *
 * @param { unknown[]} arr The `Array` to get items from.
 * @returns { (length: number) => unknown[] } A function that returns a new `Array`.
 *
 * @see https://medium.com/@jacobchodubski/10-useful-js-utility-functions-that-save-time-ac0198587d4f
 */
export const last =
  (arr: unknown[]) =>
  (length = 1) => {
    return arr.filter(
      (_: unknown, index: number) => index >= arr.length - length
    );
  };

/**
 * Get the first element of an array.
 *
 * @param { T[] } arr The array.
 * @returns { T } The first element of the array.
 */
export const head = <T>(arr: T[]) => arr[0];

/**
 * Get all elements of an array except the first one.
 *
 * @param { T[] } arr The array.
 * @returns { T[] } All elements but the first.
 */
export const tail = <T>(arr: T[]) => arr.slice(1);

/**
 * Returns a function to get an `Array` of values according to a specific path (i.e. a string of keys
 * separated by dot) of array's objects.
 *
 * @param { <Record<PropertyKey, unknown>[] } arr The `Array` of `objects` to get values from.
 * @returns { (path: string) => unknown[] } A function that returns a new `Array`.
 *
 * @example
 * const arr = [
 *   {
 *     name: 'Alice',
 *     age: 32
 *   },
 *   {
 *     name: 'Bob',
 *     age: 56
 *   },
 * ];
 *
 * const getValues = pluck(arr);
 *
 * const names = getValues('name'); // ['Alice', 'Bob']
 * const ages = getValues('age'); // [32, 56]
 *
 * @see https://medium.com/@jacobchodubski/10-useful-js-utility-functions-that-save-time-ac0198587d4f
 */
export const pluck = (arr: Record<PropertyKey, unknown>[]) => (path: string) =>
  arr.map((el: Record<PropertyKey, unknown>) => valueAtPath(path)(el));

/**
 * Returns a function to get an `Array` of values according to a specific path (i.e. a string of keys
 * separated by dot) of array's objects.
 *
 * @param { string } path The path to the property to get values from.
 * @returns { (arr: Record<PropertyKey, unknown>[]) => unknown[] } A function that returns a new `Array`.
 *
 * @example
 * const arr = [
 *   {
 *     name: 'Alice',
 *     age: 32
 *   },
 *   {
 *     name: 'Bob',
 *     age: 56
 *   },
 * ];
 *
 * const getNames = pluckProp('name');
 * const getAges = pluckProp('age');
 *
 * const names = getNames(arr); // ['Alice', 'Bob']
 * const ages = getAges(arr); // [32, 56]
 *
 * @see https://medium.com/@jacobchodubski/10-useful-js-utility-functions-that-save-time-ac0198587d4f
 */
export const pluckProp =
  (path: string) => (arr: Record<PropertyKey, unknown>[]) =>
    arr.map((el: Record<PropertyKey, unknown>) => valueAtPath(path)(el));

/**
 * Removes an item from an array in place if exists.
 *
 * @param { any[] } arr The array.
 * @returns { (item: any) => any[] } A function to remove an item from the array.
 */
export const removeIfDefined = (arr: any[]) => (item: any) => {
  const index = arr.indexOf(item);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
};

/**
 * Moves an element of an array in place and returns the array itself.
 *
 * @param { unknown[] } arr The array to move an item in.
 * @param { number } from The original index.
 * @param { number } to The destination index.
 * @returns { unknown[] } The array with element moved.
 */
export const move = (arr: unknown[], from: number, to: number) => {
  const item = arr[from];
  arr.splice(from, 1);
  arr.splice(to, 0, item);

  return arr;
};

/**
 * Moves an element of an array and returns a copy of the array.
 *
 * @param { unknown[] } arr The array to move an item in.
 * @param { number } from The original index.
 * @param { number } to The destination index.
 * @returns { unknown[] } A copy of the array with element moved.
 */
export const moved = (arr: any[], from: number, to: number) => {
  const copy = [...arr];
  const item = copy[from];
  copy.splice(from, 1);
  copy.splice(to, 0, item);

  return copy;
};

export type ArrayShuffleAlgo = 'fisher-yates' | 'durstenfeld' | 'schwartzian';

// https://stackoverflow.com/a/2450976/1060921
const fisherYates = <T>(arr: T[]) => {
  const array = [...arr];

  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

// https://stackoverflow.com/a/12646864/1060921
const durstenfeld = <T>(arr: T[]) => {
  const array = [...arr];

  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

// https://stackoverflow.com/a/46545530/1060921
const schwartzian = <T>(arr: T[]) =>
  arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export const shuffled = <T>(
  arr: T[],
  algo: ArrayShuffleAlgo = 'durstenfeld'
): T[] => {
  const chooseAlgorithm = switchCase({
    'fisher-yates': () => fisherYates(arr),
    durstenfeld: () => durstenfeld(arr),
    schwartzian: () => schwartzian(arr),
  });

  return chooseAlgorithm(algo) as T[];
};

/**
 * Returns a function to get an `Array` of only defined value (i.e.: not `null` or `undefined`).
 *
 * @param { unknown[]} arr The `Array` to get items from.
 * @returns { () => any[] } A function that returns a new `Array` with only defined values.
 */
export const toDefined = (arr: unknown[]) => (): any[] =>
  [...arr].filter(
    (value: unknown) => value !== null && typeof value !== 'undefined'
  );

/**
 * Returns a function to push only defined value (i.e.: not `null` or `undefined`) in an `Array`.
 * If the original array contains undefined values, they will not be deleted.
 *
 * @param { unknown[]} arr The `Array` to push items to.
 * @returns { (...args: unknown[]) => unknown[] } A function that returns a new `Array` with original array values
 * and only defined values from args.
 */
export const pushDefined =
  (arr: unknown[]) =>
  (...args: unknown[]) =>
    [
      ...arr,
      ...[
        ...args.filter(
          (val: unknown) => val !== null && typeof val !== 'undefined'
        ),
      ],
    ];

/**
 * Remove duplicates from an array (alias for `Array.from(new Set(array))`).
 *
 * @param { any[] } arr The array to remove duplicates from.
 * @returns { any[] } A new array without duplicates.
 */
export const dedupe = (arr: any[]) => Array.from(new Set(arr));

/**
 * Returns a function to remove duplicate in an array of objects according to the property's path.
 *
 * @param { Record<PropertyKey, any>[] } arr An array of objects.
 * @returns { (path: string) => Record<PropertyKey, any>[] } A function to dedupe the array according to `path` parameter.
 */
export const dedupeForPath =
  (arr: Record<PropertyKey, any>[]) => (path: string) => {
    const attributeGetter = (obj: Record<PropertyKey, any>) =>
      valueAtPath(path)(obj);

    // Get values for each path of each object in array.
    const map = arr.map((item) => attributeGetter(item));

    // Filter according to index of each object.
    return arr.filter(
      (obj, index) => map.indexOf(attributeGetter(obj)) === index
    );
  };

/**
 * Zip arrays in one array containing arrays of values of each array.
 *
 * @param { unknown[][] } arrays Arrays to zip.
 * @returns { unknown[][] } An array of arrays.
 *
 * @example
 * zip([['a', 'b'], [1, 2], [true, false]]);
 * // => [['a', 1, true], ['b', 2, false]]
 */
export const zip = (...arrays: unknown[][]): unknown[][] => {
  const maxLength = Math.max(...arrays.map((x) => x.length));

  return Array.from({ length: maxLength }).map((_, i) =>
    Array.from({ length: arrays.length }, (_, k) => arrays[k][i])
  );
};

/** Unzip an array of arrays in multiple arrays.
 *
 * @param { unknown[][] } arr The array to unzip.
 * @returns { unknown[][] } An array of arrays.
 *
 * @example
 * unzip([['a', 1, true], ['b', 2, false]]);
 * // => [['a', 'b'], [1, 2], [true, false]]
 */
export const unzip = (arr: unknown[][]) =>
  arr.reduce(
    (acc: any[], val: unknown[]) => (
      val.forEach((v: unknown, i: number) => acc[i].push(v)), acc
    ),
    Array.from({
      length: Math.max(...arr.map((x) => x.length)),
    }).map((_) => [])
  );

/**
 * Returns a function to compute the intersection with an `Array`.
 *
 * @param { unknown[] } arr The array to compute intersection with.
 * @returns { (withArr: unknown[]) => unknown[] } The function taking a second array in argument.
 *
 * @see https://stackoverflow.com/a/33034768/1060921
 */
export const intersection = (arr: unknown[]) => (withArr: unknown[]) => {
  const arrOne = [...arr];
  const arrTwo = [...withArr];

  return arrOne.filter((x) => arrTwo.includes(x));
};

/**
 * Returns a function to compute the difference with an `Array`.
 *
 * @param { unknown[] } arr The array to compute difference with.
 * @returns { (withArr: unknown[]) => unknown[] } The function taking a second array in argument.
 *
 * @see https://stackoverflow.com/a/33034768/1060921
 */
export const difference = (arr: unknown[]) => (withArr: unknown[]) => {
  const arrOne = [...arr];
  const arrTwo = [...withArr];

  return arrOne.filter((x) => !arrTwo.includes(x));
};

/**
 * Returns a function to compute the symmetric difference with an `Array`.
 *
 * @param { unknown[] } arr The array to compute symmetric difference with.
 * @returns { (withArr: unknown[]) => unknown[] } The function taking a second array in argument.
 *
 * @see https://stackoverflow.com/a/33034768/1060921
 */
export const symmetricDifference = (arr: unknown[]) => (withArr: unknown[]) => {
  const arrOne = [...arr];
  const arrTwo = [...withArr];

  return difference(arrOne)(arrTwo).concat(
    arrTwo.filter((x) => !arrOne.includes(x))
  );
};

/**
 * Returns a function to group an `Array` of objects by a specific key.
 *
 * @param { Record<PropertyKey, unknown>[] } arr The array of objects to group by key.
 * @returns { (key: PropertyKey) => Record<string, Record<PropertyKey, unknown>[]> } The function to group the array with.
 *
 * @see https://medium.com/@jacobchodubski/10-useful-js-utility-functions-that-save-time-ac0198587d4f
 */
export const groupedBy =
  (arr: Record<PropertyKey, unknown>[]) => (key: PropertyKey) =>
    deepClone(arr).reduce(
      (
        group: Record<PropertyKey, unknown>,
        element: Record<PropertyKey, unknown>
      ) => {
        const keyValue: string = element[key] as string;
        return {
          ...group,
          [keyValue]: [...((group[keyValue] as unknown[]) ?? []), element],
        };
      },
      {}
    );

/**
 * Returns a function to sort an `Array` of objects by a specific key value. Always descending.
 * Use `Array.reverse` to go ascending.
 *
 * @param { Record<PropertyKey, unknown>[] } arr The array of objects to sort by key value.
 * @returns { (key: PropertyKey) => Record<string, Record<PropertyKey, unknown>[]> } The function to sort the array with.
 *
 * @todo Generic type instead of Record.
 */
export const sortedBy =
  (arr: Record<PropertyKey, unknown>[]) => (key: PropertyKey) => {
    const array = deepClone(arr);

    const compare = (a: any, b: any) => {
      let left: any = a[key];
      let right: any = b[key];

      if (isString(left) && isString(right)) {
        left = left.toLowerCase();
        right = right.toLowerCase();
      }

      if (left < right) {
        return -1;
      }
      if (left > right) {
        return 1;
      }
      return 0;
    };

    return array.toSorted(compare);
  };

/**
 * Returns a function that split an `Array` into an array of chunks arrays with deeply cloned items.
 *
 * @param { unknown[] } arr The array to split.
 * @returns { (size: number) => unknown[][] } The function to split the original array with.
 */
export const chunks = (arr: unknown[]) => (size: number) => {
  if (size <= 0) return [[...arr]];

  const chunks: unknown[] = [];
  for (let i = 0; i <= arr.length; i += size) {
    const chunk = deepClone(arr.slice(i, i + size));

    if (chunk.length > 0) chunks.push(chunk);
  }

  return chunks;
};

/**
 * Recursively reads an array and convert it to an object with index as key,
 * while preserving nested objects.
 *
 * @param { unknown[] } arr The array to convert.
 * @returns { Record<PropertyKey, unknown> } An object.
 */
export const toObject = (arr: unknown[]) => {
  let obj: any = new Object();

  const iterate = forIn(arr);

  const convert = conditionally({
    if: () => isDefined(isOfType('object')(arr)),

    then: () => {
      iterate((keyOrIndex: string | number) => {
        obj[keyOrIndex] = toObject(arr[keyOrIndex as any] as unknown[]);
      });

      return obj;
    },

    else: () => {
      obj = arr;
      return obj;
    },
  });

  return convert();
};

export default {
  first,
  last,
  head,
  tail,
  pluck,
  pluckProp,
  removeIfDefined,
  move,
  moved,
  shuffled,
  toDefined,
  pushDefined,
  dedupe,
  dedupeForPath,
  zip,
  unzip,
  intersection,
  difference,
  symmetricDifference,
  groupedBy,
  sortedBy,
  chunks,
  toObject,
  fisherYates,
  durstenfeld,
  schwartzian,
};
