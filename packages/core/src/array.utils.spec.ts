import { describe, it, expect } from 'vitest';
import ArrayUtils from './array.utils';

const {
  first,
  last,
  head,
  tail,
  pluck,
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
} = ArrayUtils;

const arr1 = [0, 1, 2, 3, 4, 5, 6];
const arr2 = [
  {
    id: 1,
    name: 'Alice',
    age: 30,
    credentials: { email: 'alice@example.com' },
  },
  {
    id: 6,
    name: 'Charlie',
    age: 35,
    credentials: { email: 'charlie@example.com' },
  },
  { id: 12, name: 'Bob', age: 25, credentials: { email: 'bob@example.com' } },
];
const arr3 = [
  { id: 1, category: 'Work', title: 'Task 1' },
  { id: 4, category: 'Personal', title: 'Task 4' },
  { id: 3, category: 'Work', title: 'Task 3' },
  { id: 2, category: 'Personal', title: 'Task 2' },
];
const arr4 = [undefined, null, 3.14];
const arr5 = [1, 3, 12];

describe('Array utilities.', () => {
  it('should return array with first value.', () => {
    expect(first(arr1)()).toStrictEqual([0]);
  });

  it('should return array with last value.', () => {
    expect(last(arr1)()).toStrictEqual([6]);
  });

  it('should return array with 3 first values.', () => {
    expect(first(arr1)(3)).toStrictEqual([0, 1, 2]);
  });

  it('should return array with 3 last values.', () => {
    expect(last(arr1)(3)).toStrictEqual([4, 5, 6]);
  });

  it('should return array with all values.', () => {
    expect(first(arr1)(30)).toStrictEqual(arr1);
  });

  it('should return array with all values.', () => {
    expect(last(arr1)(30)).toStrictEqual(arr1);
  });

  it('should return empty array.', () => {
    expect(first(arr1)(-1)).toStrictEqual([]);
  });

  it('should return empty array.', () => {
    expect(last(arr1)(-1)).toStrictEqual([]);
  });

  it('should return the first element of an array.', () => {
    expect(head([1, 2, 3])).toBe(1);
    expect(head([])).toBeUndefined();
  });

  it('should return all elements of an array except the first.', () => {
    expect(tail([1, 2, 3])).toStrictEqual([2, 3]);
    expect(tail([])).toStrictEqual([]);
  });

  it('should return an array of names.', () => {
    expect(pluck(arr2)('name')).toStrictEqual(['Alice', 'Charlie', 'Bob']);
  });

  it('should return an array of nested values.', () => {
    expect(pluck(arr2)('credentials.email')).toStrictEqual([
      'alice@example.com',
      'charlie@example.com',
      'bob@example.com',
    ]);
  });

  it('should return an array of ages.', () => {
    expect(pluck(arr2)('age')).toStrictEqual([30, 35, 25]);
  });

  it('should return the intersection betwween arrays.', () => {
    expect(intersection(arr1)(arr5)).toStrictEqual([1, 3]);
    expect(intersection(arr1)(arr5).length).toBe(2);
  });

  it('should return the difference betwween arrays.', () => {
    expect(difference(arr1)(arr5)).toStrictEqual([0, 2, 4, 5, 6]);
    expect(difference(arr1)(arr5).length).toBe(5);
  });

  it('should return the symmetric difference betwween arrays.', () => {
    expect(symmetricDifference(arr1)(arr5)).toStrictEqual([0, 2, 4, 5, 6, 12]);
    expect(symmetricDifference(arr1)(arr5).length).toBe(6);
  });

  it('should return an array of defined values.', () => {
    expect(toDefined(arr4)().length).toBe(1);
    expect(toDefined(arr4)().includes(3.14)).toBeTruthy();
  });

  it('should return the concatenation of arrays with only defined values.', () => {
    expect(pushDefined(arr1)(...arr4).length).toBe(8);
    expect(pushDefined(arr1)(...arr4).includes(3.14)).toBeTruthy();
  });

  it('should move items in array.', () => {
    const arr = [1, 2, 3, 4, 1, 1, 1];
    expect(move(arr, 0, arr.length - 1)).toStrictEqual([2, 3, 4, 1, 1, 1, 1]);
    // Now first element is 2
    expect(moved(arr, 0, arr.length - 1)).toStrictEqual([3, 4, 1, 1, 1, 1, 2]);

    // Now first element is 3, get the copied version of the function.
    const copy = moved(arr, 0, arr.length);
    expect(copy).not.toStrictEqual(arr);
  });

  it('should return a deduped array.', () => {
    const arr = [1, 2, 3, 4, 1, 1, 1];
    expect(dedupe(arr).length).toBe(4);
  });

  it('should return a deduped array of objects.', () => {
    // 4 times same 'x': result should be of length 4
    // 3 times same 'y': result should be of length 5

    const obj1 = [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 3 },
      { x: 1, y: 4 },
      { x: 1, y: 5 },
      { x: 1, y: 6 },
    ];

    const dedupeObj1 = dedupeForPath(obj1);
    expect(dedupeObj1('x').length).toBe(4);
    expect(dedupeObj1('y').length).toBe(5);

    const obj2 = [
      { x: { value: 1 }, y: { value: 2 } },
      { x: { value: 2 }, y: { value: 2 } },
      { x: { value: 3 }, y: { value: 2 } },
      { x: { value: 4 }, y: { value: 3 } },
      { x: { value: 1 }, y: { value: 4 } },
      { x: { value: 1 }, y: { value: 5 } },
      { x: { value: 1 }, y: { value: 6 } },
    ];

    const dedupeObj2 = dedupeForPath(obj2);
    expect(dedupeObj2('x.value').length).toBe(4);
    expect(dedupeObj2('y.value').length).toBe(5);
  });

  it('should shuffle array', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    expect(shuffled(arr, 'durstenfeld')).not.toStrictEqual(arr); // 'durstenfeld' is default.
    expect(shuffled(arr, 'fisher-yates')).not.toStrictEqual(arr);
    expect(shuffled(arr, 'schwartzian')).not.toStrictEqual(arr);
  });

  it('should zip and unzip arrays.', () => {
    const keys = ['one', 'two', 'three'];
    const values = [1, 2, 3];

    expect(zip(keys, values)).toStrictEqual([
      ['one', 1],
      ['two', 2],
      ['three', 3],
    ]);

    expect(zip(keys, [...values, 4])).toStrictEqual([
      ['one', 1],
      ['two', 2],
      ['three', 3],
      [undefined, 4],
    ]);

    expect(zip([...keys, 'four'], values)).toStrictEqual([
      ['one', 1],
      ['two', 2],
      ['three', 3],
      ['four', undefined],
    ]);

    expect(zip(keys, values, [4, 5, 6])).toStrictEqual([
      ['one', 1, 4],
      ['two', 2, 5],
      ['three', 3, 6],
    ]);

    const zipped = zip(keys, values);
    expect(unzip(zipped)).toStrictEqual([keys, values]);

    const [unzippedKeys, unzippedValues] = unzip(zipped);
    expect(unzippedKeys).toStrictEqual(keys);
    expect(unzippedValues).toStrictEqual(values);
  });

  it('should return objects grouped by key.', () => {
    const groupArr3 = groupedBy(arr3);

    const categoryGroups: Record<string, any> = groupArr3('category');
    const idGroups: Record<string, any> = groupArr3('id');

    expect(Object.keys(categoryGroups).length).toBe(2);
    expect(Object.keys(categoryGroups).includes('Work')).toBeTruthy();

    expect(Object.keys(idGroups).length).toBe(4);
    expect(Object.keys(idGroups).includes('1')).toBeTruthy();
  });

  it('should return array with objects sorted by key.', () => {
    const sortArr2 = sortedBy(arr2);
    const sortedByName = sortArr2('name');
    const sortedById = sortArr2('id');

    expect(sortedByName.length).toBe(arr2.length);
    expect(pluck(sortedByName)('name')).toStrictEqual([
      'Alice',
      'Bob',
      'Charlie',
    ]);
    expect(pluck(sortedById)('name')).toStrictEqual([
      'Alice',
      'Charlie',
      'Bob',
    ]);

    const sortArr3 = sortedBy(arr3);
    const sortedByTitle = sortArr3('title');
    expect(pluck(sortedByTitle)('title')).toStrictEqual([
      'Task 1',
      'Task 2',
      'Task 3',
      'Task 4',
    ]);
  });

  it('should return an array of chunks arrays.', () => {
    const toChunks = chunks(arr1);

    expect(toChunks(2).length).toBe(4);
    expect(toChunks(2)[0]).toStrictEqual([0, 1]);

    expect(toChunks(1).length).toBe(arr1.length);
  });

  it('should return an object with index as keys while preserving inner objects.', () => {
    expect(
      toObject([1, 2, 3, [4, 5, 6], { foo: 'bar', baz: ['foo', 'bar'] }])
    ).toStrictEqual({
      '0': 1,
      '1': 2,
      '2': 3,
      '3': { '0': 4, '1': 5, '2': 6 },
      '4': { foo: 'bar', baz: { '0': 'foo', '1': 'bar' } },
    });
  });
});
