import { describe, it, expect } from 'vitest';
import ObjectUtils from './object.utils';

const {
  prop,
  getDescriptorsKeys,
  getMethodNames,
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
  valueAtPath,
  setValueAtPath,
  removeStringKeyOrValue,
} = ObjectUtils;

const fn = () => console.log('Hello world!');
const date = new Date();
const items = [
  {
    name: 'foo',
    values: [1, 2, 3],
  },
  {
    name: 'bar',
    values: [
      {
        foo: 'bar',
      },
      2,
      date,
    ],
  },
];

const obj1 = {
  title: 'Title',
  fn,
  items,
};

describe('ObjectUtils', () => {
  it('should get value for key.', () => {
    expect(prop(obj1)('title')).toBe('Title');
  });

  it('should get property descriptors keys and methods names.', () => {
    class MyClass {
      constructor(public foo: any) {
        this.foo;
      }

      public getFoo() {
        return this.foo;
      }
    }

    const obj2 = new MyClass('bar');

    expect(getDescriptorsKeys(obj2).includes('foo')).toBeTruthy();
    expect(hasPropertyDescriptor(obj2)('foo')).toBeTruthy();
    expect(hasPropertyDescriptor(obj2)('getFoo')).toBeFalsy();

    expect(getMethodNames(obj2).includes('getFoo')).toBeTruthy();
    expect(hasMethod(obj2)('getFoo')).toBeTruthy();
    expect(hasMethod(obj2)('foo')).toBeFalsy();
  });

  it('should deep clone an object.', () => {
    const clone = deepClone(obj1);

    expect(obj1).toStrictEqual(clone);
    expect(obj1).toEqual(clone);

    obj1.title = 'New Title';
    expect(obj1.title).not.toEqual(clone.title);

    // Function can't be cloned...
    expect(obj1.fn).toEqual(clone.fn);
    // ... but we can replace it in the object.
    obj1.fn = () => console.log('Bye world!');
    expect(obj1.fn).not.toEqual(clone.fn);

    // Inner arrays are cloned, no reference is kept in the cloned object.
    obj1.items[0].values[2] = 3.14;
    expect(obj1.items[0].values[2]).not.toEqual(clone.items[0].values[2]);
  });

  it('should deep clone an object that takes parameters in constructor.', () => {
    class MyClass {
      constructor(public foo: any) {
        this.foo;
      }

      public getFoo() {
        return this.foo;
      }
    }

    const obj2 = new MyClass('bar');
    const clone = deepClone(obj2);

    expect(obj2).toStrictEqual(clone);
    expect(obj2).toEqual(clone);

    obj2.foo = 'baz';
    expect(obj2).not.toStrictEqual(clone);
    expect(obj2).not.toEqual(clone);

    expect(obj2.getFoo()).toBe('baz');
    expect(clone.getFoo()).toBe('bar');
  });

  it('should merge objects', () => {
    const merged = merge(
      {
        x: 0,
      },
      {
        y: 1,
      },
      {
        z: 2,
      },
      {
        y: 4, // Will replace first met 'y'
      }
    );

    expect(merged).toStrictEqual({
      x: 0,
      y: 4,
      z: 2,
    });
  });

  it('should swap keys and values of an object.', () => {
    const swapped = swap({
      x: 0,
      y: 4,
      z: 2,
    });

    expect(Object.keys(swapped).length).toBe(3);
    expect(Object.keys(swapped).includes('0')).toBeTruthy();
    expect(Object.keys(swapped).includes('4')).toBeTruthy();
    expect(Object.keys(swapped).includes('2')).toBeTruthy();
    expect(Object.values(swapped).includes('x')).toBeTruthy();
    expect(Object.values(swapped).includes('y')).toBeTruthy();
    expect(Object.values(swapped).includes('z')).toBeTruthy();
  });

  it('should flatten an object', () => {
    const flattened = flatten(obj1);
    expect(flattened['items.1.values.0.foo']).toBe('bar');
  });

  it('should unflatten an object', () => {
    const flattened = flatten(obj1);
    expect(unflatten(flattened).items[1].values[0].foo).toBe('bar');
  });

  it('should get value of an object property by path.', () => {
    expect(valueAtPath('items.1.values.0.foo')(obj1)).toBe('bar');
  });

  it('should set value of an object property by path.', () => {
    const transformed = setValueAtPath('items.1.values.0.foo')(
      obj1,
      'Lorem Ipsum'
    );
    expect(valueAtPath('items.1.values.0.foo')(transformed)).toBe(
      'Lorem Ipsum'
    );
  });

  it('should compare two objects.', () => {
    expect(
      isStrictEqual({ foo: 'bar', baz: 'sum' })({ baz: 'sum', foo: 'bar' })
    ).toBeTruthy();

    expect(isStrictEqual([0, 1])([1, 0])).toBeTruthy();
    expect(isStrictEqual([0, 1])([1, 0, 2])).toBeFalsy();
  });

  it('should return `true` if keys of objects overlap.', () => {
    const simpleObj = { foo: 'bar', ack: 'sum' };

    expect(keysOverlap(simpleObj)({ ...simpleObj })).toStrictEqual([
      'foo',
      'ack',
    ]);
    expect(keysOverlap(simpleObj)({ ...simpleObj, baz: 'foo' })).toBeTypeOf(
      'object'
    );
    expect(keysOverlap(simpleObj)({ baz: 'foo' })).toBeUndefined();

    // Will not throw, instead returns false.
    expect(keysOverlap(simpleObj)(['foo'])).toBeUndefined();
    expect(keysOverlap(simpleObj)(3.14)).toBeUndefined();

    // No keys.
    expect(keysOverlap({})({})).toBeFalsy();

    // Works with nested objects too.
    const user1 = {
      name: 'Alice',
      credentials: {
        email: 'alice@example.com',
      },
      params: {
        theme: {
          color: '#fff',
          use: {
            one: 'two',
            two: 'three',
          },
        },
      },
    };

    const user2 = {
      name: 'Bob',
      credentials: {
        email: 'bob@example.com',
      },
      params: {
        theme: {
          color: '#ccc',
          use: {
            four: 'five',
            five: 'six',
          },
        },
      },
    };

    expect(Array.isArray(keysOverlap(user1)(user2))).toBeTruthy();
    expect(
      keysOverlap(user1.params.theme.use)(user2.params.theme.use)
    ).toBeUndefined();
  });

  it('should return `true` if any value of one object is the same as any other value of other.', () => {
    const simpleObj = { foo: 'bar', ack: 'sum' };

    expect(
      Array.isArray(valuesOverlap(simpleObj)({ ...simpleObj }))
    ).toBeTruthy();
    expect(valuesOverlap(simpleObj)({ ...simpleObj, baz: 'foo' })).toBeTypeOf(
      'object'
    );
    expect(valuesOverlap(simpleObj)({ baz: 'foo' })).toBeUndefined();

    // Will not throw, instead returns undefined.
    expect(valuesOverlap(simpleObj)(['foo'])).toBeUndefined();
    expect(valuesOverlap(simpleObj)(3.14)).toBeUndefined();

    // No keys.
    expect(valuesOverlap({})({})).toBeUndefined();

    // Works with nested objects too.
    const user1 = {
      name: 'Alice',
      credentials: {
        email: 'alice@example.com',
      },
      params: {
        theme: {
          color: '#fff',
          use: {
            one: 'two',
            two: 'three',
          },
        },
      },
    };

    const user2 = {
      name: 'Bob',
      credentials: {
        email: 'bob@example.com',
      },
      params: {
        theme: {
          color: '#ccc',
          use: {
            four: 'five',
            five: 'six',
          },
        },
      },
    };

    expect(valuesOverlap(user1)(user2)).toBeUndefined(); // Objects share the same keys but no value.
    expect(
      valuesOverlap(user1.params.theme.use)(user2.params.theme.use)
    ).toBeFalsy(); // Objects don't share any value.

    // Add the same function to the two objects.
    const fn = () => 'foo';

    (user1 as any).fn = fn;
    (user2 as any).fn = fn;
    expect(valuesOverlap(user1)(user2)).toStrictEqual([fn]); // An array with overlapping values.
  });

  it('should return `true` if any entry of one object is the same as any other entry of other.', () => {
    const simpleObj = { foo: 'bar', ack: 'sum' };

    expect(entriesOverlap(simpleObj)({ ...simpleObj })).toBeTypeOf('object');

    expect(
      entriesOverlap(simpleObj)({ ...simpleObj, baz: 'foo' })
    ).toStrictEqual(simpleObj);

    expect(entriesOverlap(simpleObj)({ baz: 'foo' })).toBeUndefined();

    // Will not throw, instead returns undefined.
    expect(entriesOverlap(simpleObj)(['foo'])).toBeUndefined();
    expect(entriesOverlap(simpleObj)(3.14)).toBeUndefined();

    // No keys.
    expect(entriesOverlap({})({})).toBeUndefined();

    // Works with nested objects too.
    const user1 = {
      name: 'Alice',
      credentials: {
        email: 'alice@example.com',
      },
      params: {
        theme: {
          color: '#fff',
          use: {
            one: 'two',
            two: 'three',
          },
        },
      },
    };

    const user2 = {
      name: 'Bob',
      credentials: {
        email: 'bob@example.com',
      },
      params: {
        theme: {
          color: '#ccc',
          use: {
            four: 'five',
            five: 'six',
          },
        },
      },
    };

    expect(entriesOverlap(user1)(user2)).toBeUndefined(); // Objects share the same keys but no value.
    expect(
      entriesOverlap(user1.params.theme.use)(user2.params.theme.use)
    ).toBeUndefined(); // Objects don't share any entry.

    // Add the same function to the two objects.
    const fn = () => 'foo';

    (user1 as any).fn = fn;
    (user2 as any).fn = fn;
    expect(entriesOverlap(user1)(user2)).toBeTypeOf('object');

    enum ListenerChannelsOne {
      One = 'channel:one',
    }

    enum ListenerChannelsTwo {
      Three = 'channel:one',
      Two = 'channel:two',
    }

    enum ListenerChannelsThree {
      Four = 'Three',
    }

    const overlappingOneAndTwo =
      keysOrValuesOverlap(ListenerChannelsOne)(ListenerChannelsTwo); // channel:one
    const overlappingTwoAndThree = keysOrValuesOverlap(ListenerChannelsTwo)(
      ListenerChannelsThree
    ); // Three
    const overlappingOneAndThree = keysOrValuesOverlap(ListenerChannelsOne)(
      ListenerChannelsThree
    ); // undefined

    expect(overlappingOneAndTwo).toStrictEqual(['channel:one']);
    expect(overlappingTwoAndThree).toStrictEqual(['Three']);
    expect(overlappingOneAndThree).toBeUndefined();
  });

  it('should remove overlapping keys or values from objects.', () => {
    const obj2 = {
      foo: 'bar',
      baz: 'sum',
    };

    const obj3 = {
      baz: 'hop',
    };

    const obj4 = {
      sum: 'ack',
    };

    const removeFromObj2 = removeStringKeyOrValue(obj2);
    const removeFromObj3 = removeStringKeyOrValue(obj3);

    expect(removeFromObj2(obj3)).toStrictEqual({ foo: 'bar' });
    expect(removeFromObj2(obj4)).toStrictEqual({ foo: 'bar' });
    expect(removeFromObj3(obj4)).toStrictEqual({ baz: 'hop' });
  });
});
