/**
 * Checks if a string is a valid Base64 encoded string.
 * @param str The string to check.
 * @returns True if the string is valid Base64, false otherwise.
 */
export const isBase64 = (str: string): boolean => {
  const regExp = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
  return regExp.test(str);
};

/**
 * Checks if a string is empty or contains only whitespace.
 * @param str The string to check.
 * @returns True if the string is empty or whitespace, false otherwise.
 */
export const isEmpty = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

// Thanks to: https://stackoverflow.com/a/32402438/1060921
export const matchWildcard = (str: string, rule: string) => {
  const escapeRegex = (str: string) =>
    str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
  return new RegExp(
    '^' + rule.split('*').map(escapeRegex).join('.*') + '$'
  ).test(str);
};

export default {
  isBase64,
  isEmpty,
  matchWildcard,
};
