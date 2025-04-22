import { describe, it, expect } from 'vitest';
import { proxifyIterable } from './proxy.utils';

describe('ProxyUtils', () => {
  it('should make a class iterable.', () => {
    class RecordClass {
      [key: string]: string | any;

      public collection: Record<string, string> = {
        foo: 'bar',
        baz: 'ack',
      };

      constructor() {
        return proxifyIterable(this, RecordClass);
      }

      public [Symbol.iterator](): Iterator<string> {
        let index = -1;
        const data: string[] = this.collection
          ? Object.values(this.collection)
          : [];

        return {
          next: () => ({
            value: data[++index],
            done: !(index in data),
          }),
        };
      }
    }

    const record = new RecordClass();

    expect(record['foo']).toBe('bar');
    expect(record['baz']).toBe('ack');
    for (const obj of record) {
      expect(Object.values(record.collection).includes(obj)).toBeTruthy();
    }

    class ArrayClass {
      [key: number]: string;

      public collection: string[] = ['foo', 'bar'];

      constructor() {
        return proxifyIterable(this, ArrayClass);
      }

      public [Symbol.iterator](): Iterator<string> {
        let index = -1;
        const data: string[] = this.collection
          ? Object.values(this.collection)
          : [];

        return {
          next: () => ({
            value: data[++index],
            done: !(index in data),
          }),
        };
      }
    }

    const arr = new ArrayClass();

    expect(arr[0]).toBe('foo');
    expect(arr[1]).toBe('bar');

    for (const obj of arr) {
      expect(arr.collection.includes(obj)).toBeTruthy();
    }
  });
});
