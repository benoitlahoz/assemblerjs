const CleanupCallbacks = Symbol('assemblerjs:electron:cleanup-callbacks');
const CleanupBoundEvents = Symbol('assemblerjs:electron:cleanup-bound-events');
const CleanupPatched = Symbol('assemblerjs:electron:cleanup-patched');
const CleanupFlushed = Symbol('assemblerjs:electron:cleanup-flushed');

type CleanupCallback = () => void | Promise<void>;

function getCallbacks(target: any): CleanupCallback[] {
  if (!target[CleanupCallbacks]) {
    target[CleanupCallbacks] = [] as CleanupCallback[];
  }

  return target[CleanupCallbacks] as CleanupCallback[];
}

export async function flushCleanupCallbacks(target: any): Promise<void> {
  if (!target || target[CleanupFlushed]) {
    return;
  }

  target[CleanupFlushed] = true;

  const callbacks = [...getCallbacks(target)].reverse();
  target[CleanupCallbacks] = [];

  for (const callback of callbacks) {
    await callback();
  }
}

export function registerCleanup(
  target: any,
  callback: CleanupCallback
): CleanupCallback[] {
  const callbacks = getCallbacks(target);
  callbacks.push(callback);

  if (!target[CleanupPatched]) {
    const originalOnDispose =
      typeof target.onDispose === 'function' ? target.onDispose.bind(target) : null;

    target.onDispose = async function (...args: any[]) {
      await flushCleanupCallbacks(this);

      if (originalOnDispose) {
        return await originalOnDispose(...args);
      }
    };

    target[CleanupPatched] = true;
  }

  return callbacks;
}

export function bindCleanupToEvent(target: any, eventName: string): void {
  if (!target || typeof target.once !== 'function') {
    return;
  }

  const boundEvents: Set<string> =
    target[CleanupBoundEvents] || new Set<string>();

  if (boundEvents.has(eventName)) {
    return;
  }

  boundEvents.add(eventName);
  target[CleanupBoundEvents] = boundEvents;
  target.once(eventName, () => {
    void flushCleanupCallbacks(target);
  });
}