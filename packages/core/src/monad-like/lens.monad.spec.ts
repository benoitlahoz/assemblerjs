import { describe, it, expect } from 'vitest';
import { Lens } from './lens.monad';
import { valueAtPath } from '@/object.utils';

const user1 = {
  name: 'Alice',
  credentials: {
    email: 'alice@example.com',
  },
  arr: ['foo', 'bar', { foo: 'bar' }],
  theme: {
    light: ['#fff', '#999'],
    dark: ['#000', '#ccc'],
  },
};

const user2 = {
  name: 'Bob',
  credentials: {
    email: 'bob@example.com',
  },
  arr: ['bar', 'foo'],
  theme: {
    light: ['#fff', '#999'],
    dark: ['#000', '#ccc'],
  },
};

const nestedArrays = [
  [0, [1, 2, [3, 4]]],
  [5, [6, 7, [8, 9]]],
];

describe('Lens', () => {
  it('should instantiate a Lens and get values from it.', () => {
    const name = Lens.of('name');

    expect(name.get(user1)).toBe('Alice');
    // Re-use the same lens for the other object.
    expect(name.get(user2)).toBe('Bob');
  });

  it('should compose lenses.', () => {
    const credentials = Lens.of('credentials');
    const email = Lens.of('email');

    // Compose 2 lenses.
    const composedEmail = Lens.compose(credentials, email);
    expect(composedEmail.get(user1)).toBe('alice@example.com');
    expect(composedEmail.get(user2)).toBe('bob@example.com');

    // Get a new lens for a subproperty..
    const atEmail = credentials.at('email');
    expect(atEmail.get(user1)).toBe('alice@example.com');
    expect(atEmail.get(user2)).toBe('bob@example.com');

    // Get
    const pathEmail = Lens.of('credentials.email');
    expect(pathEmail.get(user1)).toBe('alice@example.com');
    expect(pathEmail.get(user2)).toBe('bob@example.com');

    const argsPathEmail = Lens.of('credentials', 'email');
    expect(argsPathEmail.get(user1)).toBe('alice@example.com');
    expect(argsPathEmail.get(user2)).toBe('bob@example.com');

    const first = Lens.of('arr.0');
    expect(first.get(user1)).toBe('foo');
    expect(first.get(user2)).toBe('bar');

    const firstComposed = Lens.of('arr');
    const secondCompose = Lens.of(0);
    const composedArr = Lens.compose(firstComposed, secondCompose);

    expect(composedArr.get(user1)).toBe('foo');
    expect(composedArr.get(user2)).toBe('bar');

    const arr1 = Lens.of(1);
    const arr2 = Lens.of(1);
    const arr3 = Lens.of(2);
    const composedNested = Lens.compose(arr1, arr2, arr3);

    expect(composedNested.get(nestedArrays)).toStrictEqual([8, 9]);

    const theme = Lens.of('theme');
    const themeFirstLightColor = theme.at('light', 0);
    expect(themeFirstLightColor.get(user1)).toBe('#fff');
  });

  it('should map.', () => {
    const lens = Lens.of('arr')
      .map(() => 2)
      .map(() => 'foo');
    expect(lens.get(user1)).toBe('bar');
  });

  it('should flatMap.', () => {
    const lens = Lens.of('arr')
      .flatMap(() => Lens.of(2))
      .flatMap(() => Lens.of('foo'));
    expect(lens.get(user1)).toBe('bar');
  });

  it('should set or modify a value from Lens.', () => {
    const focusOnNested = Lens.of(1, 1, 2, 0);
    expect(focusOnNested.get(nestedArrays)).toStrictEqual(8);

    const modify = focusOnNested.apply((value: number) => value * 2);
    const newArray = modify(nestedArrays);

    expect(focusOnNested.get(newArray as any)).toStrictEqual(16);
    const otherArray = focusOnNested.modify(nestedArrays, 24);
    expect(valueAtPath(1, 1, 2, 0)(otherArray!)).toBe(24);

    const focus = Lens.of(1, 1, 2, 0, 2); // Doesn't exist in `nestedArrays`.
    expect(focus.modify(nestedArrays, 24)).toBeUndefined();
  });
});
