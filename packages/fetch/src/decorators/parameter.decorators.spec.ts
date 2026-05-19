import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
  transformHeader,
  transformParam,
  transformPlaceholder,
  transformQuery,
} from './parameter.decorators';

describe('parameter transformers', () => {
  describe('transformParam', () => {
    it('replaces :id token', () => {
      const result = transformParam(
        'http://localhost/users/:id',
        { metadata: { '0': 'id' }, length: 1 },
        42
      );

      expect(result).toBe('http://localhost/users/42');
    });

    it('supports explicit : prefix in metadata', () => {
      const result = transformParam(
        'http://localhost/users/:id',
        { metadata: { '0': ':id' }, length: 1 },
        7
      );

      expect(result).toBe('http://localhost/users/7');
    });
  });

  describe('transformPlaceholder', () => {
    it('removes placeholder token when value is undefined', () => {
      const result = transformPlaceholder(
        'http://localhost/users/%kind',
        { metadata: { '0': '%kind' }, length: 1 },
        undefined
      );

      expect(result).toBe('http://localhost/users/');
    });

    it('replaces placeholder token when value is provided', () => {
      const result = transformPlaceholder(
        'http://localhost/users/%kind',
        { metadata: { '0': '%kind' }, length: 1 },
        'carts'
      );

      expect(result).toBe('http://localhost/users/carts');
    });
  });

  describe('transformQuery', () => {
    it('adds query params', () => {
      const result = transformQuery(
        'http://localhost/users',
        { metadata: { '0': 'limit' }, length: 1 },
        10
      );

      expect(result).toBe('http://localhost/users?limit=10');
    });

    it('skips undefined optional params', () => {
      const result = transformQuery(
        'http://localhost/users',
        { metadata: { '0': 'select' }, length: 1 },
        undefined
      );

      expect(result).toBe('http://localhost/users');
    });

    it('joins array values with commas', () => {
      const result = transformQuery(
        'http://localhost/users',
        { metadata: { '0': 'select' }, length: 1 },
        ['name', 'email']
      );

      expect(result).toBe('http://localhost/users?select=name%2Cemail');
    });
  });

  describe('transformHeader', () => {
    it('adds header value from decorated argument', () => {
      const headers = transformHeader(
        undefined,
        { metadata: { '0': 'x-trace-id' }, length: 1 },
        'trace-123'
      );

      expect(headers.get('x-trace-id')).toBe('trace-123');
    });

    it('keeps existing headers and skips undefined values', () => {
      const headers = transformHeader(
        { Accept: 'application/json' },
        { metadata: { '0': 'x-optional' }, length: 1 },
        undefined
      );

      expect(headers.get('accept')).toBe('application/json');
      expect(headers.get('x-optional')).toBeNull();
    });
  });
});
