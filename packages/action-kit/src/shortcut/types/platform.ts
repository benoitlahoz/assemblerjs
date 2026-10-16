export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

export type PrimaryModifier = 'cmdOrCtrl' | 'command' | 'control';

export function getPlatform(): Platform {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  if (/Mac/i.test(navigator.platform)) {
    return 'macos';
  }

  if (/Win/i.test(navigator.platform)) {
    return 'windows';
  }

  if (/Linux/i.test(navigator.platform)) {
    return 'linux';
  }

  return 'unknown';
}
