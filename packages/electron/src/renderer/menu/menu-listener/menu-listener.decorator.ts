import { createConstructorDecorator } from 'assemblerjs';
import {
  getMenuRendererSubscriptionMetadata,
  type MenuRendererSubscriptionMetadata,
} from '@/universal/metadata';
import {
  bindRendererEventListeners,
  createEventDeduplicator,
} from '@/universal/runtime';
import { createChannelBuilder } from '@assemblerjs/common';
import { MenuIpcChannel } from '@/universal';
import type { MenuItemClickedEvent, MenuItemState } from '@/universal/types';
import { resolveMenuWindowName } from '../menu-definition/menu-definition';

const buildMenuChannel = createChannelBuilder('menu');

function resolveMenuEventChannels(windowName: string, event: string): string[] {
  const channels = new Set<string>();
  channels.add(buildMenuChannel(windowName, event));

  if (event === 'itemClicked') {
    channels.add(MenuIpcChannel.OnItemClicked);
  } else if (event === 'stateChanged') {
    channels.add(MenuIpcChannel.OnItemStateChanged);
  } else if (event === 'templateChanged') {
    channels.add(MenuIpcChannel.OnTemplateChanged);
  }

  return [...channels];
}

function getMenuSubMethods(
  target: Function,
): Map<string, MenuRendererSubscriptionMetadata> {
  const subMethods = new Map<string, MenuRendererSubscriptionMetadata>();

  for (const entry of getMenuRendererSubscriptionMetadata(target)) {
    subMethods.set(entry.method, entry);
  }

  return subMethods;
}

function normalizeArgs(
  channel: string,
  windowName: string,
  args: any[],
): any[] {
  if (channel === MenuIpcChannel.OnItemClicked) {
    const [itemId, eventWindowName] = args as [string, string];
    if (eventWindowName !== windowName) {
      return [];
    }

    const event: MenuItemClickedEvent = {
      itemId,
      windowName: eventWindowName,
      timestampMs: Date.now(),
    };

    return [event];
  }

  if (channel === MenuIpcChannel.OnItemStateChanged) {
    const [eventWindowName, state] = args as [string, MenuItemState];
    if (eventWindowName !== windowName) {
      return [];
    }

    return [state];
  }

  if (channel === MenuIpcChannel.OnTemplateChanged) {
    const [eventWindowName, menuName] = args as [string, string];
    if (eventWindowName !== windowName) {
      return [];
    }

    return [menuName];
  }

  return args;
}

function buildDedupKey(
  event: string,
  windowName: string,
  normalizedArgs: any[],
): string {
  if (event === 'itemClicked') {
    const payload = normalizedArgs[0] as MenuItemClickedEvent | undefined;
    if (!payload) {
      return `${event}:${windowName}:empty`;
    }

    const itemId =
      typeof payload.itemId === 'string' ? payload.itemId : 'unknown';
    return `${event}:${windowName}:${itemId}`;
  }

  if (event === 'stateChanged') {
    const payload = normalizedArgs[0] as MenuItemState | undefined;
    if (!payload) {
      return `${event}:${windowName}:empty`;
    }

    return `${event}:${windowName}:${payload.id}:${String(payload.enabled)}:${String(payload.checked)}`;
  }

  if (event === 'templateChanged') {
    const menuName = normalizedArgs[0];
    return `${event}:${windowName}:${String(menuName ?? 'unknown')}`;
  }

  return `${event}:${windowName}:${normalizedArgs.length}`;
}

export const MenuListener = createConstructorDecorator(function (this: any) {
  const bridge = window.ipc;
  if (!bridge) {
    throw new Error('IpcRenderer is not available in the current context.');
  }

  const windowName = resolveMenuWindowName(this);
  if (!windowName || typeof windowName !== 'string') {
    throw new Error(
      "@MenuListener requires a window name (via instance 'windowName', @Window, or injected window service).",
    );
  }

  const subMethods = getMenuSubMethods(this.constructor);
  if (subMethods.size === 0) {
    return;
  }

  const shouldHandleEvent = createEventDeduplicator();

  bindRendererEventListeners(
    this,
    bridge,
    [...subMethods.values()],
    (event: string) => resolveMenuEventChannels(windowName, event),
    (method: string, channel: string, args: any[]) => {
      const originalMethod = this[method];
      if (typeof originalMethod !== 'function') {
        throw new Error(
          `Method ${method} is not a function on the target class.`,
        );
      }

      const event = subMethods.get(method)?.event;
      const normalized = normalizeArgs(channel, windowName, args);
      if (normalized.length === 0 || !event) {
        return;
      }

      const eventKey = buildDedupKey(event, windowName, normalized);
      if (!shouldHandleEvent(eventKey)) {
        return;
      }

      return originalMethod.apply(this, normalized);
    },
  );
});
