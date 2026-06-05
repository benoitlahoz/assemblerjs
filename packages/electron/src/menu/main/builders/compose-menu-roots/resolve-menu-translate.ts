import type { MenuTranslate, MenuTranslateHost } from './types';

export function resolveMenuTranslate(
  menuInstance: unknown,
): MenuTranslate | undefined {
  const candidate = menuInstance as MenuTranslateHost | undefined;

  if (typeof candidate?.translate === 'function') {
    return (key: string) => candidate.translate?.(key) ?? key;
  }

  if (typeof candidate?.i18n?.translate === 'function') {
    return (key: string) => candidate.i18n?.translate?.(key) ?? key;
  }

  return undefined;
}
