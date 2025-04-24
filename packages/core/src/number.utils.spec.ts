import { describe, it, expect } from 'vitest';
import NumberUtils from './number.utils';
import { uncurry } from './function.utils';

const {
  isFloat,
  isCloseTo,
  isOdd,
  isEven,
  isInRange,
  scaleToRange,
  roundToNearest,
  eq,
  gt,
  gte,
  lt,
  lte,
} = NumberUtils;

describe('NumberUtils', () => {
  it('should perform checks on values.', () => {
    const int = 3;
    const float = 3.14;
    const string = '3';
    const symbol = Symbol(3);
    const exp = 3e2;
    const large = 9999999999999999;
    const infinity = Infinity;
    const nan = Number.NaN;

    expect(isFloat(float)).toBeTruthy();
    expect(isFloat(int)).toBeFalsy();
    expect(isFloat(exp)).toBeFalsy();
    expect(isFloat(string as any)).toBeFalsy();
    expect(isFloat(symbol as any)).toBeFalsy();
    expect(isFloat(large)).toBeFalsy();
    expect(isFloat(infinity)).toBeFalsy();
    expect(isFloat(nan)).toBeFalsy();

    expect(isOdd(int)).toBeTruthy();
    expect(isEven(4)).toBeTruthy();

    const isBetween = isInRange(-12, 127);

    expect(isBetween(int)).toBeTruthy();
    expect(isBetween(float)).toBeTruthy();
    expect(isBetween(exp)).toBeFalsy();

    const isCloseTo03 = isCloseTo(0.3, 2);

    expect(isCloseTo03(0.2 + 0.1)).toBeTruthy();
    expect(isCloseTo03(0.2 + 0.1001)).toBeTruthy();
    expect(isCloseTo03(0.2 + 0.11)).toBeFalsy();
  });

  it('should scale values between ranges.', () => {
    const dstRange = { min: 0, max: 1 };

    const scaleToUnity = scaleToRange(dstRange.min, dstRange.max);
    const scaleToUnityClamped = scaleToRange(dstRange.min, dstRange.max, true);

    expect(scaleToUnity(50, 0, 100)).toBe(0.5);
    expect(scaleToUnity(33, 0, 100)).toBe(0.33);
    expect(scaleToUnity(133, 0, 100)).toBe(1.33);
    expect(scaleToUnityClamped(133, 0, 100)).toBe(1);
  });

  it('should round numbers to nearest `x` value.', () => {
    const roundToTen = roundToNearest(10);
    const roundToTenCeil = roundToNearest(10, true);

    expect(roundToTen(55)).toBe(50);
    expect(roundToTen(56)).toBe(50);
    expect(roundToTenCeil(56)).toBe(60);
    expect(roundToTenCeil(55)).toBe(60);
    expect(roundToTenCeil(54)).toBe(60);

    const roundTo128 = roundToNearest(128);
    const roundTo128Ceil = roundToNearest(128, true);

    expect(roundTo128(33)).toBe(0);
    expect(roundTo128(132)).toBe(128);
    expect(roundTo128(33.128)).toBe(0);
    expect(roundTo128Ceil(33)).toBe(128);
    expect(roundTo128Ceil(132)).toBe(256);
    expect(roundTo128Ceil(33.128)).toBe(128);

    // Uncurry an fp function.
    const uncurried = uncurry(roundToNearest);
    expect(uncurried(10, 55)).toBe(50);
  });

  it('should compare numbers.', () => {
    expect(eq(1)(1)).toBeTruthy();
    expect(gt(1)(2)).toBeTruthy();
    expect(gte(1)(1)).toBeTruthy();
    expect(lt(2)(1)).toBeTruthy();
    expect(lte(1)(1)).toBeTruthy();

    expect(eq(1)(2)).toBeFalsy();
    expect(gt(2)(1)).toBeFalsy();
    expect(gte(2)(1)).toBeFalsy();
    expect(lt(1)(2)).toBeFalsy();
    expect(lte(1)(2)).toBeFalsy();
  });
});
