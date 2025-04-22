import { dedupe, move } from '@/array.utils';
import { pipe } from '@/function.utils';

/**
 * Preserve only alphanumeric characters (with accents) in a string, with optional string arguments to
 * preserve specific strings.
 *
 * @param { string } str The original string
 * @param { string[] } args Optional strings passed as parameters to be preserved.
 * @returns { string } The modified string.
 *
 * @see https://stackoverflow.com/a/26900132/1060921 for RegEx
 *
 * @example
 * const originalStr = '   3.14 / 2.0   ';
 * const str = onlyAlphanumeric(originalStr, '.', '/'); // '3.14/2.0'
 */
export const onlyAlphanumeric = (str: string, ...args: string[]): string => {
  // Place whitespace at the end of the arguments array.
  args
    .map((item: string, index: number) => {
      const noWs = /\S/.test(item);

      // Trim items that are not only whitespace.
      if (noWs) args[index] = args[index].trim();

      return !noWs ? index : -1;
    })
    .filter((item: number) => item >= 0)
    .every((value: number) => {
      // Keep only one whitespace and place it at the end.
      args[value] = ' ';
      move(args, value, args.length - 1);
    });
  args = dedupe(args);

  const reg = new RegExp(`[^A-Za-zÀ-ÖØ-öø-ÿ0-9${args.join('')}]`, 'gi');
  return str.replace(reg, '');
};

/**
 * Preserve only letters (with accents) in a string, with optional string arguments to
 * preserve specific strings.
 *
 * @param { string } str The original string
 * @param { string[] } args Optional strings passed as parameters to be preserved.
 * @returns { string } The modified string.
 *
 * @see https://stackoverflow.com/a/26900132/1060921 for RegEx
 *
 * @example
 * const originalStr = '   À bientôt !   ';
 * const str = onlyAlpha(originalStr, '!'); // 'Àbientôt!'
 */
export const onlyAlpha = (str: string, ...args: string[]): string => {
  // Place whitespace at the end of the arguments array.
  args
    .map((item: string, index: number) => {
      const noWs = /\S/.test(item);

      // Trim items that are not only whitespace.
      if (noWs) args[index] = args[index].trim();

      return !noWs ? index : -1;
    })
    .filter((item: number) => item >= 0)
    .every((value: number) => {
      // Keep only one whitespace and place it at the end.
      args[value] = ' ';
      move(args, value, args.length - 1);
    });
  args = dedupe(args);

  const reg = new RegExp(`[^A-Za-zÀ-ÖØ-öø-ÿ${args.join('')}]`, 'gi');
  return str.replace(reg, '');
};

export const removeDiacritics = (str: string) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '');

/**
 * Removes all whitespaces from a string.
 *
 * @param { string } str The string to modify.
 * @returns { string } The modified string.
 */
export const removeWhitespaces = (str: string): string =>
  str.replace(/\s+/g, '');

/**
 * Replace multiple whitespaces to only one in a string.
 *
 * @param { string } str The string to modify.
 * @returns { string } The modified string.
 */
export const replaceMultipleWhitespaces = (str: string) =>
  str.replace(/\s+/g, ' ');

/**
 * Removes part of a string at given `index` and `length`.
 *
 * @param { string } str The string.
 * @param { number } index The index where to begin removing characters.
 * @param { number } length The length of the string to remove.
 * @returns { string } The modified string.
 */
export const remove = (str: string, index: number, length: number): string => {
  const arr = str.split('');
  arr.splice(index, length);
  return arr.join('');
};

/**
 * Removes the character before given `index` as by hitting the `backspace` key.
 *
 * @param { string } str The string.
 * @param { number } index The original index, located after the character to delete.
 * @returns { string } The modified string.
 */
export const backspace = (str: string, index: number): string => {
  if (index > 0) return remove(str, index - 1, 1);

  return str;
};

/**
 * Removes the character after given `index` as by hitting the `suppr` key.
 *
 * @param { string } str The string.
 * @param { number } index The original index, located before the character to delete.
 * @returns { string } The modified string.
 */
export const suppr = (str: string, index: number): string => {
  if (index < str.length) return remove(str, index, 1);

  return str;
};

/**
 * Insert a string at a given `index` of another string.
 *
 * @param { string } str The initial string.
 * @param { string } value The string to insert.
 * @param { number } index The index where to insert.
 * @returns { string } The modified string.
 */
export const insert = (str: string, value: string, index: number): string => {
  const arr = str.split('');
  arr.splice(Math.max(0, Math.min(str.length, index)), 0, value);

  return arr.join('');
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 */
export const toCamelCase = (str: string) => {
  const sanitize = pipe(
    // Preserve whitespaces and hyphens.
    (s: string) => onlyAlphanumeric(s, ' ', '-', '_'),
    removeDiacritics
  );
  const changeCase = (camelCaseMatch: string, i: number) => {
    if (+camelCaseMatch === 0) return '';
    return i === 0
      ? camelCaseMatch.toLowerCase()
      : camelCaseMatch.toUpperCase();
  };

  return (
    sanitize(`${str}`)
      // Replace hyphens by space.
      .replace(new RegExp(/[-_]+/, 'g'), ' ')
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, changeCase)
  );
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 */
export const toPascalCase = (str: string) => {
  const sanitize = pipe(
    // Preserve whitespaces and hyphens.
    (s: string) => onlyAlphanumeric(s, ' ', '-', '_'),
    removeDiacritics
  );
  const changeCase = (_: any, $2: string, $3: string) =>
    `${$2.toUpperCase() + $3.toLowerCase()}`;

  return (
    sanitize(`${str}`)
      // Replace hyphens by space.
      .replace(new RegExp(/[-_]+/, 'g'), ' ')
      .replace(new RegExp(/\s+(.)(\w*)/, 'g'), changeCase)
  );
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 *
 * @see https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-123.php
 */
export const toKebabCase = (str: string) => {
  const sanitize = pipe(
    // Preserve whitespaces and hyphens.
    (s: string) => onlyAlphanumeric(s, ' ', '-', '_'),
    removeDiacritics
  );
  const match = sanitize(`${str}`).match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  );

  return match ? match.map((s: string) => s.toLowerCase()).join('-') : str;
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 *
 * @see https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-123.php
 */
export const toSnakeCase = (str: string) => {
  const sanitize = pipe(
    // Preserve whitespaces and hyphens.
    (s: string) => onlyAlphanumeric(s, ' ', '-', '_'),
    removeDiacritics
  );
  const match = sanitize(`${str}`).match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  );

  return match ? match.map((s: string) => s.toLowerCase()).join('_') : str;
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 *
 * @see https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-123.php
 */
export const toPathCase = (str: string) => {
  const sanitize = pipe(
    // Preserve whitespaces and hyphens.
    (s: string) => onlyAlphanumeric(s, ' ', '-', '_'),
    removeDiacritics
  );
  const match = sanitize(`${str}`).match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  );

  return match ? match.map((s: string) => s.toLowerCase()).join('/') : str;
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 *
 * @see https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-123.php
 */
export const toDotCase = (str: string) => {
  const sanitize = pipe(
    // Preserve whitespaces and hyphens.
    (s: string) => onlyAlphanumeric(s, ' ', '-', '_'),
    removeDiacritics
  );
  const match = sanitize(`${str}`).match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  );

  return match ? match.map((s: string) => s.toLowerCase()).join('.') : str;
};

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 */
export const toConstantCase = (str: string) => toSnakeCase(str).toUpperCase();

/**
 *
 * @param { string } str The string.
 * @returns { string } The modified string.
 */
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Thanks to: https://stackoverflow.com/a/32402438/1060921
export const matchWildcard = (str: string, rule: string) => {
  const escapeRegex = (str: string) =>
    str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
  return new RegExp(
    '^' + rule.split('*').map(escapeRegex).join('.*') + '$'
  ).test(str);
};

export default {
  onlyAlphanumeric,
  onlyAlpha,
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
};
