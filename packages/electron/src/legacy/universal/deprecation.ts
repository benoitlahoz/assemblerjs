const warnedKeys = new Set<string>();

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function shouldWarn(): boolean {
  if (!isDevEnvironment()) {
    return false;
  }

  if (process.env.ASSEMBLERJS_LEGACY_WARNINGS === '0') {
    return false;
  }

  return true;
}

export function warnLegacyUsage(symbolName: string, replacement: string): void {
  if (!shouldWarn()) {
    return;
  }

  const key = `${symbolName}:${replacement}`;
  if (warnedKeys.has(key)) {
    return;
  }

  warnedKeys.add(key);
  console.warn(
    `[assemblerjs/electron][legacy] '${symbolName}' is deprecated and will be removed in a future release. Use '${replacement}' instead.`,
  );
}
