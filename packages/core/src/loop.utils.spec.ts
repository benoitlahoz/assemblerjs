import { describe, it, expect } from 'vitest';
import type { Tuple } from './collection.types';
import { compose, pipe } from './function.utils';
import LoopUtils from './loop.utils';

const { forOf, forIn, map, asyncForEach, asyncMap } = LoopUtils;

describe('LoopUtils', () => {
  it('should loop sync over objects in iterable.', () => {
    const arr = [1, 2, 3, 4];
    const forOfArr = forOf(arr);
    const forInArr = forIn(arr);
    const mapArr = map(arr);

    forOfArr((value: number, index: number) => {
      expect(value).toBe(arr[index]);
    });

    forInArr((index: number) => {
      expect(index).toBe(arr.indexOf(arr[index]));
    });

    const toTuples = (value: number, index: number) => [index, value];
    const tuples = mapArr(toTuples);

    expect(tuples).toStrictEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]);

    const mapTuples = map(tuples);
    const toObj = (item: Tuple<[number, number]>) => ({
      [item[0]]: item,
    });

    expect(mapTuples(toObj)).toStrictEqual([
      { 0: tuples[0] },
      { 1: tuples[1] },
      { 2: tuples[2] },
      { 3: tuples[3] },
    ]);

    const toArrayOfObjectsOfTuples = pipe(
      (a: any) => map(a)(toTuples),
      (a: any) => map(a)(toObj)
    );

    expect(toArrayOfObjectsOfTuples(arr)).toStrictEqual([
      { 0: tuples[0] },
      { 1: tuples[1] },
      { 2: tuples[2] },
      { 3: tuples[3] },
    ]);

    const toArrayOfObjectsOfTuplesC = compose(
      (a: any) => map(a)(toObj),
      (a: any) => map(a)(toTuples)
    );

    expect(toArrayOfObjectsOfTuplesC(arr)).toStrictEqual([
      { 0: tuples[0] },
      { 1: tuples[1] },
      { 2: tuples[2] },
      { 3: tuples[3] },
    ]);
  });

  it('should loop async sequentially over objects in iterable.', async () => {
    const add = (value: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(value + 2);
        }, Math.random() * 500);
      });
    };

    const initialValues = [1, 2, 3];
    const mapOver = asyncMap(initialValues);

    const res = await mapOver(add);
    expect(res).toStrictEqual([3, 4, 5]);

    let current = 0;
    const addExpect = (value: number, index: number): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(index).toBe(current);
          expect(value).toBe(initialValues[index]);
          current++;
          resolve();
        }, Math.random() * 500);
      });
    };
    const eachOver = asyncForEach(initialValues);
    await eachOver(addExpect);
  });
});
