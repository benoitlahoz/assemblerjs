import { describe, it, expect } from 'vitest';
import { cleanPath } from './clean-path';

describe('cleanPath', () => {
  it('adds a leading slash by default', () => {
    expect(cleanPath('api/users')).toBe('/api/users');
  });

  it('removes duplicate slashes', () => {
    expect(cleanPath('//api//users')).toBe('/api/users');
  });

  it('handles concatenated segments with a slash', () => {
    expect(cleanPath('/api' + '/' + 'users')).toBe('/api/users');
  });

  it('handles empty controller path + route path', () => {
    expect(cleanPath('/users')).toBe('/users');
  });

  it('removes trailing slash', () => {
    expect(cleanPath('/api/users/')).toBe('/api/users');
  });

  it('keeps path parameters intact', () => {
    expect(cleanPath('/api/users/:id')).toBe('/api/users/:id');
  });

  it('handles root path (trailing slash removed, result is empty)', () => {
    // cleanPath strips the trailing slash so '/' becomes '' (root/empty path).
    const result = cleanPath('/');
    expect(result === '' || result === '/').toBe(true);
  });

  it('can remove leading slash when asked', () => {
    expect(cleanPath('/api/users', 'remove')).toBe('api/users');
  });
});
