import { describe, it, expect } from 'vitest';
import TypesUtils from './type.validator';

const {
  isString,
  isSymbol,
  isNumber,
  isBoolean,
  isObject,
  isFunction,
  isArray,
  isDate,
  isPromise,
  isAsync,
  isUndefined,
  isNull,
  isDefined,
  isOfType,
  isTypeOf,
  isInstanceOf,
  hasCtor,
  hasSuper,
} = TypesUtils;

describe('TypesUtils', () => {
  it('should check if value is a string', () => {
    expect(isString('String')).toBeTruthy();
    expect(isString(1)).toBeFalsy();
  });

  it('should check if value is a symbol', () => {
    expect(isSymbol(Symbol('String'))).toBeTruthy();
    expect(isSymbol('String')).toBeFalsy();
  });

  it('should check if value is a number', () => {
    expect(isNumber(1)).toBeTruthy();
    expect(isNumber('String')).toBeFalsy();
  });

  it('should check if value is a boolean', () => {
    expect(isBoolean(false)).toBeTruthy();
    expect(isBoolean(0)).toBeFalsy();
    expect(isBoolean(1)).toBeFalsy();
  });

  it('should check if value is an array', () => {
    expect(isArray({})).toBeFalsy();
    expect(isArray([])).toBeTruthy();
  });

  it('should check if value is an object with properties', () => {
    expect(isObject({})).toBeTruthy();
    expect(isObject([])).toBeFalsy();
  });

  it('should check if value is a date', () => {
    expect(isDate(new Date())).toBeTruthy();
    expect(isDate(Date.now())).toBeFalsy();
  });

  it('should check if value is a function, a promise, an async function', () => {
    const fn = async function () {
      return true;
    };

    const fnArrow = async () => {
      return true;
    };

    const promise = new Promise((resolve) => resolve(true));

    expect(isFunction(() => {})).toBeTruthy();
    expect(isFunction(fn)).toBeTruthy();
    expect(isFunction(fnArrow)).toBeTruthy();
    expect(isFunction([])).toBeFalsy();

    expect(isPromise(promise)).toBeTruthy();
    expect(isPromise(() => {})).toBeFalsy();
    expect(isPromise(fn)).toBeFalsy();
    expect(isPromise(fnArrow)).toBeFalsy();

    // @ts-ignore
    expect(isAsync(promise)).toBeFalsy();
    expect(isAsync(() => {})).toBeFalsy();
    expect(isAsync(fn)).toBeTruthy();
    expect(isAsync(fnArrow)).toBeTruthy();
  });

  it('should check if value is an array', () => {
    expect(isArray([])).toBeTruthy();
    expect(isArray({})).toBeFalsy();
  });

  it('should check if value is defined, undefined or null', () => {
    expect(isUndefined(undefined)).toBeTruthy();
    expect(isUndefined(null)).toBeFalsy();
    expect(isNull(null)).toBeTruthy();
    expect(isNull(undefined)).toBeFalsy();
    expect(isDefined(null)).toBeFalsy();
    expect(isDefined(undefined)).toBeFalsy();
    expect(isDefined([])).toBeTruthy();
  });

  it('should check if a value is of one of provided types', () => {
    const isStringOrNumber = isOfType('string', 'number');

    expect(isStringOrNumber('foo') === 'string').toBeTruthy();
    expect(isStringOrNumber(2) === 'number').toBeTruthy();
    expect(isStringOrNumber({ foo: 'bar' })).toBeUndefined();
  });

  it('should check if two values have the same type', () => {
    expect(isTypeOf(new Date())(new Date())).toBeTruthy();
    expect(isTypeOf('hello')('world')).toBeTruthy();
    expect(isTypeOf(1)(2)).toBeTruthy();
    expect(isTypeOf(true)(false)).toBeTruthy();

    expect(isTypeOf(new Date())(Date.now())).toBeFalsy();
    expect(isTypeOf('hello')(Symbol('world'))).toBeFalsy();
    expect(isTypeOf(1)(false)).toBeFalsy();
    expect(isTypeOf(true)(-1)).toBeFalsy();
  });

  it('should check if value is instance of given class', () => {
    class MyClass {}
    class MySubclass extends MyClass {}

    expect(isInstanceOf(new MySubclass())(MyClass)).toBeTruthy();
    expect(isInstanceOf(new MySubclass())(MySubclass)).toBeTruthy();
  });

  it('should check if value has given constructor', () => {
    expect(hasCtor([])(Array)).toBeTruthy();
    expect(hasCtor({})(Object)).toBeTruthy();
    expect(hasCtor(() => {})(Function)).toBeTruthy();
    expect(hasCtor('String')(String)).toBeTruthy();
    expect(hasCtor(Symbol('String'))(Symbol)).toBeTruthy();
    expect(hasCtor(1)(Number)).toBeTruthy();
    expect(hasCtor(new Date())(Date)).toBeTruthy();

    class MyClass {}
    expect(hasCtor(new MyClass())(MyClass)).toBeTruthy();

    class MySubclass extends MyClass {}
    expect(hasCtor(new MySubclass())(MySubclass)).toBeTruthy();
    expect(hasCtor(new MySubclass())(MyClass)).toBeFalsy();
  });

  it('should check if a method calls super', () => {
    // Test with comments containing "super" (should be ignored)
    const methodWithComment = function () {
      // super is mentioned in a comment
      /* super also mentioned here */
      return 'no actual super call';
    };
    expect(hasSuper(methodWithComment)).toBeFalsy();

    // Test with "super" in a string literal (should be ignored)
    const methodWithSuperInString = function () {
      const msg = 'This mentions super but is not a call';
      return msg;
    };
    expect(hasSuper(methodWithSuperInString)).toBeFalsy();

    // Test regular function without super
    const regularFunction = function () {
      return 'just a function';
    };
    expect(hasSuper(regularFunction)).toBeFalsy();

    // Test with non-function
    expect(hasSuper('not a function')).toBeFalsy();
    expect(hasSuper(null)).toBeFalsy();
    expect(hasSuper(undefined)).toBeFalsy();
  });
});
