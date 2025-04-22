import { describe, it, expect } from 'vitest';
import { isDefined, isOfType } from './type.validator';
import { pipe } from './function.utils';
import { forOf } from './loop.utils';
import ConditionalUtils from './conditional.utils';

const { switchCase, conditionally } = ConditionalUtils;

describe('ConditionalUtils', () => {
  it('should act as a switch... case.', () => {
    const statements = {
      orange: () => 'It is an Orange',
      apple: () => 'It is newtonian',
      strawberry: () => 'It is red',
    };

    const checkFruits = switchCase<string>(statements);

    expect(checkFruits('orange')).toBe('It is an Orange');
    expect(checkFruits('apple')).toBe('It is newtonian');
    expect(checkFruits('strawberry')).toBe('It is red');
    expect(checkFruits('raspberry')).toBeUndefined();

    const recheckFruits = switchCase<string | undefined>(
      { ...statements, blueberry: () => undefined },
      () => 'It is something else'
    );

    expect(checkFruits('blueberry')).toBeUndefined();
    expect(recheckFruits('raspberry')).toBe('It is something else');
  });

  it('should act as a switch... case given computed statements.', () => {
    const fruits = ['orange', 'apple', 'strawberry'];

    const forEachFruit = forOf(fruits);
    const whatIsYourFruitName = switchCase<string>(
      fruits.reduce(
        (acc: Record<string, (key: string) => string>, curr: string) => {
          acc[curr] = () => `I'm ${curr}.`;
          return acc;
        },
        {}
      ),
      (key: string) => `I'm an unknown ${key}.`
    );

    forEachFruit((fruit: string) =>
      expect(whatIsYourFruitName(fruit)).toBe(`I'm ${fruit}.`)
    );

    expect(whatIsYourFruitName('raspberry').includes('raspberry')).toBeTruthy();
  });

  it('should fork according to condition.', () => {
    const getTypeIfDefined = conditionally({
      if: (value: unknown) => isDefined(value),
      then: (value: unknown) => typeof value,
      else: (value: undefined | null) => value,
    });

    const upperCaseType = conditionally({
      if: (value: unknown) => typeof value === 'string',
      then: (value: string) => value.toUpperCase(),
    });

    expect(getTypeIfDefined(1)).toBe('number');
    expect(getTypeIfDefined('Hello world!')).toBe('string');
    expect(getTypeIfDefined(undefined)).toBeUndefined();
    expect(getTypeIfDefined(null)).toBeNull();

    const upperCaseIfDefined = pipe(getTypeIfDefined, upperCaseType);

    expect(upperCaseIfDefined(1)).toBe('NUMBER');
    expect(upperCaseIfDefined('Hello world!')).toBe('STRING');
    expect(upperCaseIfDefined(undefined)).toBeUndefined();
    expect(upperCaseIfDefined(null)).toBeUndefined(); // Without 'else' option, returns 'undefined'.

    // For the purpose of the example: this could be the 'else' of 'getTypeIfDefined'.

    const throwIfNotDefined = conditionally({
      if: (value: unknown) => !isDefined(value),
      then: () => {
        throw new Error('Value is undefined or null.');
      },
      else: (value: unknown) => value,
    });

    const typeofOrThrow = pipe(getTypeIfDefined, throwIfNotDefined);

    expect(typeofOrThrow(1)).toBe('number');
    expect(typeofOrThrow('Hello world!')).toBe('string');
    expect(() => typeofOrThrow(undefined)).toThrow();

    // Allowed types.
    const isStringOrNumber = isOfType('string', 'number');

    const ifDefined = conditionally({
      if: (value: unknown) => isDefined(value),
      then: (value: unknown) => value,
      else: () => {
        throw new Error('Value is undefined or null.');
      },
    });

    const onNumber = conditionally({
      if: (value: unknown) => isStringOrNumber(value) === 'number',
      then: (value: number) => value * 2,
      else: (value: unknown) => value,
    });

    const onString = conditionally<string>({
      if: (value: unknown) => isStringOrNumber(value) === 'string',
      then: (value: string) => `Hello ${value}!`,
      else: (value: unknown) => value,
    });

    const onOther = conditionally({
      if: (value: unknown) => !isStringOrNumber(value),
      then: (value: unknown) => {
        throw new Error(`${value}: Allowed types are string and number.`);
      },
      else: (value: unknown) => value,
    });

    // Pipe the 4 conditionals.

    const transformValue = pipe(ifDefined, onNumber, onString, onOther);

    expect(() => transformValue(undefined)).toThrow();
    expect(() => transformValue(null)).toThrow();
    expect(transformValue(1)).toBe(2);
    expect(transformValue('world')).toBe('Hello world!');
    expect(() => transformValue({ foo: 'bar' })).toThrow();
  });
});
