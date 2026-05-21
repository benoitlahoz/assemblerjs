import { contextBridge, ipcRenderer } from 'electron';
import { MenuIpcChannel, WindowIpcChannel } from './universal/channels';
import type {
  DefaultIpcContractMap,
  IpcContractMap,
  KnownIpcChannel,
  TypedIpcBridge,
} from './universal/types';

type RendererListener = (...args: any[]) => void;
type ElectronListener = (_event: unknown, ...args: any[]) => void;

const defaultChannels = [
  ...Object.values(WindowIpcChannel),
  ...Object.values(MenuIpcChannel),
] as ReadonlyArray<KnownIpcChannel>;

function getListenerEntries(
  registry: WeakMap<RendererListener, Map<string, Set<ElectronListener>>>,
  listener: RendererListener,
  channel: string,
): Set<ElectronListener> {
  let channels = registry.get(listener);
  if (!channels) {
    channels = new Map<string, Set<ElectronListener>>();
    registry.set(listener, channels);
  }

  let entries = channels.get(channel);
  if (!entries) {
    entries = new Set<ElectronListener>();
    channels.set(channel, entries);
  }

  return entries;
}

function validateChannel(
  channel: string,
  allowedChannels: ReadonlyArray<string>,
  strict = true,
): void {
  if (strict && !allowedChannels.includes(channel)) {
    throw new Error(
      `IPC channel "${channel}" is not whitelisted. Allowed: [${allowedChannels.join(
        ', ',
      )}]`,
    );
  }
}

export function createIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
>(
  channels: ReadonlyArray<
    KnownIpcChannel<Contracts>
  > = defaultChannels as ReadonlyArray<KnownIpcChannel<Contracts>>,
  options: { strict?: boolean } = {},
): Readonly<TypedIpcBridge<Contracts>> {
  const listenerRegistry = new WeakMap<
    RendererListener,
    Map<string, Set<ElectronListener>>
  >();
  const allowedChannels = [...channels];
  const strict = options.strict !== false; // Default to strict mode

  return {
    channels: [...channels],
    on(channel: string, listener: RendererListener): () => void {
      validateChannel(channel, allowedChannels, strict);
      const wrappedListener: ElectronListener = (_event, ...args) => {
        listener(...args);
      };

      getListenerEntries(listenerRegistry, listener, channel).add(
        wrappedListener,
      );
      ipcRenderer.on(channel, wrappedListener);

      return () => {
        const channelsByListener = listenerRegistry.get(listener);
        const wrappedListeners = channelsByListener?.get(channel);
        if (!wrappedListeners?.has(wrappedListener)) {
          return;
        }

        ipcRenderer.off(channel, wrappedListener);
        wrappedListeners.delete(wrappedListener);
        if (wrappedListeners.size === 0) {
          channelsByListener?.delete(channel);
        }
      };
    },
    once(channel: string, listener: RendererListener): () => void {
      validateChannel(channel, allowedChannels, strict);
      const entries = getListenerEntries(listenerRegistry, listener, channel);
      let active = true;
      const wrappedListener: ElectronListener = (_event, ...args) => {
        if (!active) {
          return;
        }
        active = false;
        entries.delete(wrappedListener);
        listener(...args);
      };

      entries.add(wrappedListener);
      ipcRenderer.once(channel, wrappedListener);

      return () => {
        if (!active) {
          return;
        }
        active = false;
        ipcRenderer.off(channel, wrappedListener);
        entries.delete(wrappedListener);
      };
    },
    off(channel: string, listener: RendererListener): void {
      validateChannel(channel, allowedChannels, strict);
      const channelsByListener = listenerRegistry.get(listener);
      const wrappedListeners = channelsByListener?.get(channel);
      if (!wrappedListeners) {
        return;
      }

      for (const wrappedListener of wrappedListeners) {
        ipcRenderer.off(channel, wrappedListener);
      }

      wrappedListeners.clear();
      channelsByListener?.delete(channel);
    },
    removeAllListeners(channel: string): void {
      validateChannel(channel, allowedChannels, strict);
      ipcRenderer.removeAllListeners(channel);
    },
    send(channel: string, ...args: any[]): void {
      validateChannel(channel, allowedChannels, strict);
      ipcRenderer.send(channel, ...args);
    },
    async invoke(channel: string, ...args: any[]): Promise<any> {
      validateChannel(channel, allowedChannels, strict);
      return await ipcRenderer.invoke(channel, ...args);
    },
  };
}

let exposedBridge: Readonly<TypedIpcBridge<any>> | undefined;

export function exposeIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
>(
  channels: ReadonlyArray<
    KnownIpcChannel<Contracts>
  > = defaultChannels as ReadonlyArray<KnownIpcChannel<Contracts>>,
  options: { strict?: boolean } = {},
): Readonly<TypedIpcBridge<Contracts>> {
  if (exposedBridge) {
    return exposedBridge as Readonly<TypedIpcBridge<Contracts>>;
  }

  const bridge = createIpcBridge(channels, options);

  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld('ipc', bridge);
  } else if (typeof window !== 'undefined') {
    (window as any).ipc = bridge;
  }

  exposedBridge = bridge;

  return bridge;
}

export * from './universal/channels';
