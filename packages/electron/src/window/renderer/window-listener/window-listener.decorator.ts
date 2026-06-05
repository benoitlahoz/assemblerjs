import { createConstructorDecorator } from 'assemblerjs';
import { ElectronMetadata } from '@/common/metadata';
import { bindRendererEventListeners } from '@/common/runtime';
import { createChannelBuilder } from '@assemblerjs/common';
import { resolveWindowRendererName } from '../window-definition/window-definition';

const buildWindowChannel = createChannelBuilder('window');

function resolveWindowEventChannels(
  windowName: string,
  event: string,
): string[] {
  return [buildWindowChannel(windowName, event)];
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

  const subscriptions = ElectronMetadata.window.getRendererSubscriptions(
    this.constructor,
  );
  if (subscriptions.length === 0) {
    return;
  }

  bindRendererEventListeners(
    this,
    bridge,
    subscriptions,
    (event: string) => resolveWindowEventChannels(windowName, event),
    (method: string, _event: string, _channel: string, args: any[]) => {
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
