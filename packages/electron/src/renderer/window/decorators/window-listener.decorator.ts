import { createConstructorDecorator } from 'assemblerjs';
import { registerCleanup } from '@/universal/lifecycle';
import { WindowIpcChannel } from '@/universal/channels';
import { buildWindowEventChannel } from './window-channels';
import { resolveWindowRendererName } from './window-definition';
import {
  WindowRendererSubMethods,
  type WindowRendererSubMethod,
} from './window-decorators.types';

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
  target: any,
): Map<string, WindowRendererSubMethod> | undefined {
  let prototype = target;

  while (prototype && prototype !== Object.prototype) {
    const subMethods: Map<string, WindowRendererSubMethod> | undefined =
      prototype[WindowRendererSubMethods];
    if (subMethods) {
      return subMethods;
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return undefined;
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

  const subMethods = getWindowSubMethods(this.constructor.prototype);
  if (!subMethods) {
    return;
  }

  subMethods.forEach((handler, method) => {
    const originalMethod = this[method];
    if (typeof originalMethod !== 'function') {
      throw new Error(
        `Method ${method} is not a function on the target class.`,
      );
    }

    const channels = resolveWindowEventChannels(windowName, handler.event);
    const listener = (...args: any[]) => {
      return originalMethod.apply(this, args);
    };

    for (const channel of channels) {
      bridge[handler.type](channel as any, listener);
    }

    registerCleanup(this, () => {
      for (const channel of channels) {
        bridge.off(channel as any, listener);
      }
    });
  });
});
