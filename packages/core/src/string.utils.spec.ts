import { describe, it, expect } from 'vitest';
import StringUtils from './string.utils';

const { isBase64, isEmpty, matchWildcard } = StringUtils;

describe('StringUtils', () => {
  it('should validate a valid Base64 string', () => {
    const str = 'U29tZSB2YWxpZCBiYXNlNjQgc3RyaW5nLg==';
    expect(isBase64(str)).toBe(true);
  });

  it('should invalidate an invalid Base64 string', () => {
    const str = 'This is not a valid Base64 string!';
    expect(isBase64(str)).toBe(false);
  });

  it('should identify an empty string', () => {
    const str = '   ';
    expect(isEmpty(str)).toBe(true);
  });

  it('should identify a non-empty string', () => {
    const str = 'Hello, World!';
    expect(isEmpty(str)).toBe(false);
  });

  it('should match wildcard rules', () => {
    const rule1 = '*Paris';
    const rule2 = '*Paris*';
    const rule3 = '*Papa*Paris*';

    const strs1 = ['À nous Paris', 'Ici Paris', 'Sous le ciel de Paris'];

    for (const str of strs1) {
      expect(matchWildcard(str, rule1)).toBeTruthy();
    }

    const strs2 = [
      'À nous Paris !!!',
      'Ici Paris...',
      'Sous le ciel de Paris, il fait bon vivre.',
    ];

    for (const str of strs2) {
      expect(matchWildcard(str, rule2)).toBeTruthy();
    }

    const strs3 = [
      'Papa ! À nous Paris !!!',
      'Mon Papa est à Paris...',
      'Avec mon Papa, sous le ciel de Paris, il fait bon vivre.',
    ];

    for (const str of strs3) {
      expect(matchWildcard(str, rule3)).toBeTruthy();
    }
  });
});
