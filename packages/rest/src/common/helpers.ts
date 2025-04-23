import { conditionally, pipe } from '@assemblerjs/core';

/**
 * Clean a path.
 *
 * @param { string } path The path to clean.
 * @returns A path with the form e.g. `/api` without space or trailing slash.
 *
 * @see https://expressjs.com/en/guide/routing.html
 */
export const cleanPath = (
  path: string,
  leadingSlash: 'remove' | 'add' = 'add'
) => {
  const replaceAdjacents = (p: string) =>
    p
      // Slash
      .replace(/\/+/g, '/')
      // Backslash
      .replace(/\\+/g, '\\')
      // Colon
      .replace(/:+/g, ':')
      // Period
      .replace(/\.+/g, '.')
      // Hyphen
      .replace(/-+/g, '-')
      // Question mark
      .replace(/\?+/g, '?')
      // Plus sign
      .replace(/\++/g, '+')
      // Wildcard
      .replace(/\*+/g, '*')
      // Left parenthesis
      .replace(/\(+/g, '(')
      // Right parenthesis
      .replace(/\)+/g, ')')
      // Left bracket
      .replace(/\[+/g, '[')
      // Right bracket
      .replace(/\]+/g, ']');

  const replaceWhiteSpaces = (p: string) => p.replace(/\s/g, '');

  const addLeadingSlash = (p: string) => {
    if (!p.startsWith('/')) return `/${p}`;
    return p;
  };
  const removeLeadingSlash = (p: string) => {
    if (p.startsWith('/')) {
      const length = p.length - 1;
      return p.split('').splice(1, length).join('');
    }
    return p;
  };

  const addOrRemoveLeadingSlash = conditionally({
    if: () => leadingSlash === 'add',
    then: (p: string) => addLeadingSlash(p),
    else: (p: string) => removeLeadingSlash(p),
  });

  const removeTrailingSlash = (p: string) => {
    if (p.endsWith('/')) {
      const length = p.length - 1;
      return p.split('').splice(0, length).join('');
    }
    return p;
  };

  return pipe(
    replaceAdjacents,
    replaceWhiteSpaces,
    addOrRemoveLeadingSlash,
    removeTrailingSlash
  )(path);
};
