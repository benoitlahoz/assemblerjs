import type { IpcReturnType } from '@/common/types';

function isIpcReturnType<T>(value: unknown): value is IpcReturnType<T> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'data') &&
    Object.prototype.hasOwnProperty.call(value, 'err'),
  );
}

export function unwrapIpcResult<T>(
  channel: string,
  value: unknown,
): T | undefined {
  if (isIpcReturnType<T>(value)) {
    if (value.err) {
      throw new Error(`${channel}: ${value.err.message}`);
    }

    return value.data === null ? undefined : value.data;
  }

  return value as T | undefined;
}
