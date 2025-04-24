import { describe, it, expect } from 'vitest';
import { curry } from '@/function.utils';
import StringUtils from './string.formatter';

const {
  onlyAlpha,
  onlyAlphanumeric,
  removeWhitespaces,
  replaceMultipleWhitespaces,
  remove,
  backspace,
  suppr,
  insert,
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  toPathCase,
  toDotCase,
  toConstantCase,
  capitalize,
  matchWildcard,
} = StringUtils;

describe('StringUtils', () => {
  it('should preserve only letters in a string', () => {
    const str = '   À bientôt !';

    expect(onlyAlpha(str)).toBe('Àbientôt');
  });

  it('should preserve only letters and whitespaces in a string', () => {
    const str = '   À bientôt !';

    // Preserve whitespaces.
    expect(onlyAlpha(str, ' ')).toBe('   À bientôt ');
  });

  it('should preserve only letters and / in a string', () => {
    const str = '   /À bientôt/ !';

    // Preserve slashes.
    expect(onlyAlpha(str, '/')).toBe('/Àbientôt/');
  });

  it('should preserve only letters, whitespaces and / in a string', () => {
    const str = '   /À bientôt/ !';

    // Preserve whitespaces and slashes.
    expect(onlyAlpha(str, '/', ' ')).toBe('   /À bientôt/ ');
  });

  it('should preserve only alphanumeric characters in a string', () => {
    const str = '   À bientôt 3.14 !';

    expect(onlyAlphanumeric(str)).toBe('Àbientôt314');
  });

  it('should preserve only alphanumeric characters and . in a string', () => {
    const str = '   À bientôt 3.14 !';

    expect(onlyAlphanumeric(str, '.')).toBe('Àbientôt3.14');
  });

  it('should remove all whitespaces from a string', () => {
    const str = '   À bientôt 3.14 !';
    expect(removeWhitespaces(str)).toBe('Àbientôt3.14!');
  });

  it('should replace multiple whitespaces in a string', () => {
    const str = 'À bientôt     3.14    !';
    expect(replaceMultipleWhitespaces(str)).toBe('À bientôt 3.14 !');
  });

  it('should remove characters from a string with index and length', () => {
    const str = '   À bientôt 3.14 !';
    expect(remove(str, 0, 3)).toBe('À bientôt 3.14 !');

    const curriedRemove = curry(remove);
    const removeAtZeroWithLength = curriedRemove(str)(0);

    expect(typeof removeAtZeroWithLength).toBe('function');
    expect(removeAtZeroWithLength(3)).toBe('À bientôt 3.14 !');
    expect(removeAtZeroWithLength(5)).toBe('bientôt 3.14 !');
  });

  it('should remove previous character in a string', () => {
    const str = '   À bientôt 3.14 !';
    expect(backspace(str, 1)).toBe('  À bientôt 3.14 !');
    expect(backspace(str, 0)).toStrictEqual(str);
    expect(backspace(str, str.length)).toBe('   À bientôt 3.14 ');
  });

  it('should remove next character in a string', () => {
    const str = '   À bientôt 3.14 !';
    expect(suppr(str, 1)).toBe('  À bientôt 3.14 !');
    expect(suppr(str, str.length - 1)).toBe('   À bientôt 3.14 ');
    expect(suppr(str, str.length - 2)).toBe('   À bientôt 3.14!');
    expect(suppr(str, str.length)).toStrictEqual(str);
  });

  it('should insert a string at index', () => {
    const str = '   À bientôt 3.14 !';
    const inserted = 'Hello world!';

    expect(insert(str, inserted, 0)).toBe(`${inserted}   À bientôt 3.14 !`);
    expect(insert(str, inserted, 1)).toBe(` ${inserted}  À bientôt 3.14 !`);
    expect(insert(str, inserted, -1)).toBe(`${inserted}   À bientôt 3.14 !`);
    expect(insert(str, inserted, 12)).toBe(`   À bientôt${inserted} 3.14 !`);
    expect(insert(str, inserted, str.length)).toBe(
      `   À bientôt 3.14 !${inserted}`
    );
    expect(insert(str, inserted, str.length + 1)).toBe(
      `   À bientôt 3.14 !${inserted}`
    );
  });

  it('should change case of a string (camel, pascal, kebab, snake, path, dot, constant, capitalize...)', () => {
    const str = "Là-bas si j'y suis";

    expect(toCamelCase(str)).toBe('laBasSiJySuis');
    expect(toPascalCase(str)).toBe('LaBasSiJySuis');
    expect(toKebabCase(str)).toBe('la-bas-si-jy-suis');
    expect(toSnakeCase(str)).toBe('la_bas_si_jy_suis');
    expect(toPathCase(str)).toBe('la/bas/si/jy/suis');
    expect(toDotCase(str)).toBe('la.bas.si.jy.suis');
    expect(toConstantCase(str)).toBe('LA_BAS_SI_JY_SUIS');

    const lowercase = 'firstname';
    expect(capitalize(lowercase)).toBe('Firstname');
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
