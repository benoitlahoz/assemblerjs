import { createConstructorDecorator } from 'assemblerjs';
import {
  getWindowRendererSubscriptionMetadata,
  type WindowRendererSubscriptionMetadata,
} from '@/universal/metadata';
import { bindRendererEventListeners } from '@/universal/runtime';
import { WindowIpcChannel } from '@/universal/channels';
import { buildWindowEventChannel } from '../common/window-channels';
import { resolveWindowRendererName } from '../window-definition/window-definition';

const windowEventAliases: Readonly<Record<string, string>> = {
  boundsChanged: WindowIpcChannel.OnBoundsChanged,
  stateChanged: WindowIpcChannel.OnStateChanged,
  enterFullscreen: WindowIpcChannel.OnEnterFullscreen,
  leaveFullscreen: WindowIpcChannel.OnLeaveFullscreen,
};

function resolveWindowEventChannels(
  windowName: string,
  event: string,
): string[] {
  const channels = new Set<string>();
  channels.add(buildWindowEventChannel(windowName, event));

  const alias = windowEventAliases[event];
  if (alias) {
    channels.add(alias);
  }

  return [...channels];
}

function getWindowSubMethods(
  target: Function,
): Map<string, WindowRendererSubscriptionMetadata> {
  const subMethods = new Map<string, WindowRendererSubscriptionMetadata>();

  for (const entry of getWindowRendererSubscriptionMetadata(target)) {
    subMethods.set(entry.method, entry);
  }

  return subMethods;
}

/**
 * Backward-compatible explicit listener decorator.
 * Prefer `@Window(...)` on renderer scoped services, which already applies this.
 */
export const WindowListener = createConstructorDecorator(function (this: any) {
  const bridge = window.ipc;
  if (!bridge) {
    throw new Error('IpcRenderer is not available in the current context.');
  }

  const windowName = resolveWindowRendererName(this);
  if (!windowName || typeof windowName !== 'string') {
    throw new Error(
      "@WindowListener requires a window name (via instance 'windowName' or @Window).",
    );
  }

  const subMethods = getWindowSubMethods(this.constructor);
  if (subMethods.size === 0) {
    return;
  }

  bindRendererEventListeners(
    this,
    bridge,
    [...subMethods.values()],
    (event: string) => resolveWindowEventChannels(windowName, event),
    (method: string, _channel: string, args: any[]) => {
      const originalMethod = this[method];
      if (typeof originalMethod !== 'function') {
        throw new Error(
          `Method ${method} is not a function on the target class.`,
        );
      }

      return originalMethod.apply(this, args);
    },
  );
});
