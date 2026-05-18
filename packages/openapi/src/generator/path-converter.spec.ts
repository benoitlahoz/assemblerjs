import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { toOpenApiPath } from './path-converter';

describe('toOpenApiPath', () => {
  it('converts a single Express param', () => {
    expect(toOpenApiPath('/users/:id')).toBe('/users/{id}');
  });

  it('converts multiple params', () => {
    expect(toOpenApiPath('/users/:userId/posts/:postId')).toBe(
      '/users/{userId}/posts/{postId}'
    );
  });

  it('leaves paths without params unchanged', () => {
    expect(toOpenApiPath('/users')).toBe('/users');
  });

  it('handles root path', () => {
    expect(toOpenApiPath('/')).toBe('/');
  });

  it('handles underscore params', () => {
    expect(toOpenApiPath('/items/:item_id')).toBe('/items/{item_id}');
  });

  it('handles params at the root level', () => {
    expect(toOpenApiPath('/:id')).toBe('/{id}');
  });
});
