import { describe, it, expect } from 'vitest';
import { fail } from 'assert';
import ErrorUtils from './error.utils';

const { tryCatch, asyncTryCatch } = ErrorUtils;

const syncThrowing = () => {
  throw new Error();
};

const syncResolving = () => {
  return 'foo';
};

const asyncThrowing = () => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error());
    }, 100);
  });
};

const asyncResolving = (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('foo');
    }, 100);
  });
};

describe('ErrorUtils', () => {
  it('should return `Left`.', () => {
    const result = tryCatch(() => syncThrowing());
    result.fold(
      (err: unknown) => expect(err).toBeInstanceOf(Error),
      (_: any) => fail('Should not be Right')
    );
  });

  it('should return `Right` value.', () => {
    const result = tryCatch(() => syncResolving());
    result.fold(
      (_: any) => fail('Should not be Left'),
      (value: string) => expect(value).toBe('foo')
    );
  });

  it('should return `Left` (async).', async () => {
    const result = await asyncTryCatch(async () => await asyncThrowing());
    result.fold(
      (err: unknown) => expect(err).toBeInstanceOf(Error),
      (_: any) => fail('Should not be Right')
    );
  });

  it('should return `Right` value (async).', async () => {
    const result = await asyncTryCatch(async () => await asyncResolving());
    result.fold(
      (_: any) => fail('Should not be Left'),
      (value: string) => expect(value).toBe('foo')
    );
  });
});
