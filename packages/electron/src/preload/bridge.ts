import { contextBridge, ipcRenderer } from 'electron';
import { defaultAutoWhitelistRules, defaultChannels, RpcIpcChannel } from './defaults';
import { isRendererRpcRequestEnvelope, RendererRpcResponseEnvelope, toErrorPayload } from './rpc';
import type {
  DefaultIpcContractMap,
  IpcContractMap,
  KnownIpcChannel,
  TypedIpcBridge,
} from '../common/types';
import type {
  BridgeContracts,
  ElectronListener,
  IpcBridgeOptions,
  RendererListener,
  RendererRpcHandler,
  SetupIpcBridgeOptions,
} from './types';
import {
  autoWhitelistRuleToString,
  validateChannel,
} from './whitelist';

function mergeWithDefaultChannels<Contracts extends IpcContractMap>(
  channels: ReadonlyArray<KnownIpcChannel<Contracts>>,
): ReadonlyArray<KnownIpcChannel<BridgeContracts<Contracts>>> {
  return [...new Set([...defaultChannels, ...channels])] as ReadonlyArray<
    KnownIpcChannel<BridgeContracts<Contracts>>
  >;
}

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

export function createIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
>(
  channels?: ReadonlyArray<KnownIpcChannel<Contracts>>,
  options: IpcBridgeOptions = {},
): Readonly<TypedIpcBridge<BridgeContracts<Contracts>>> {
  const listenerRegistry = new WeakMap<
    RendererListener,
    Map<string, Set<ElectronListener>>
  >();
  const resolvedChannels =
    channels ??
    (defaultChannels as unknown as ReadonlyArray<KnownIpcChannel<Contracts>>);
  const mergedChannels = mergeWithDefaultChannels(resolvedChannels);
  const allowedChannels = [...mergedChannels];
  const strict = options.strict !== false;
  const autoWhitelistRules = options.autoWhitelist ?? defaultAutoWhitelistRules;
  const debug = options.debug === true;
  const rpcHandlers = new Map<string, RendererRpcHandler>();
  let rpcRequestListenerRegistered = false;

  const onRpcRequest = async (_event: unknown, payload: unknown) => {
    if (!isRendererRpcRequestEnvelope(payload)) {
      return;
    }

    const { requestId, channel, args } = payload;
    const response: RendererRpcResponseEnvelope = {
      requestId,
      ok: true,
    };

    try {
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
      const handler = rpcHandlers.get(channel);
      if (!handler) {
        throw new Error(
          `No renderer handler registered for channel "${channel}".`,
        );
      }

      response.data = await handler(...args);
    } catch (error) {
      response.ok = false;
      response.error = toErrorPayload(error);
    }

    ipcRenderer.send(RpcIpcChannel.Response, response);
  };

  const ensureRpcRequestListener = () => {
    if (rpcRequestListenerRegistered) {
      return;
    }

    ipcRenderer.on(RpcIpcChannel.Request, onRpcRequest);
    rpcRequestListenerRegistered = true;
  };

  if (debug) {
    console.info('[assemblerjs/electron][ipc] Bridge initialized', {
      strict,
      channels: allowedChannels,
      autoWhitelist: autoWhitelistRules.map(autoWhitelistRuleToString),
    });
  }

  return {
    channels: [...mergedChannels],
    on(channel: string, listener: RendererListener): () => void {
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
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
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
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
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
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
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
      ipcRenderer.removeAllListeners(channel);
    },
    send(channel: string, ...args: any[]): void {
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
      ipcRenderer.send(channel, ...args);
    },
    async invoke(channel: string, ...args: any[]): Promise<any> {
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );
      return await ipcRenderer.invoke(channel, ...args);
    },
    handle(channel: string, handler: RendererRpcHandler): () => void {
      ensureRpcRequestListener();
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );

      if (typeof handler !== 'function') {
        throw new Error(
          `IPC handler for channel "${channel}" must be a function.`,
        );
      }

      rpcHandlers.set(channel, handler);

      return () => {
        if (rpcHandlers.get(channel) === handler) {
          rpcHandlers.delete(channel);
        }
      };
    },
    removeHandler(channel: string): void {
      validateChannel(
        channel,
        allowedChannels,
        autoWhitelistRules,
        strict,
        debug,
      );

      rpcHandlers.delete(channel);
    },
  };
}

let exposedBridge: Readonly<TypedIpcBridge<any>> | undefined;

export function exposeIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
>(
  channels?: ReadonlyArray<KnownIpcChannel<Contracts>>,
  options: IpcBridgeOptions = {},
): Readonly<TypedIpcBridge<BridgeContracts<Contracts>>> {
  if (exposedBridge) {
    return exposedBridge as Readonly<
      TypedIpcBridge<BridgeContracts<Contracts>>
    >;
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

export function setupIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
>(
  options: SetupIpcBridgeOptions<Contracts> = {},
): Readonly<TypedIpcBridge<BridgeContracts<Contracts>>> {
  const { channels, ...bridgeOptions } = options;

  return exposeIpcBridge(channels, bridgeOptions);
}
