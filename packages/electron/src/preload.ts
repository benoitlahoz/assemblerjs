import { contextBridge, ipcRenderer } from 'electron';
import {
  MenuIpcChannel,
  RpcIpcChannel,
  WindowIpcChannel,
} from './universal/channels';
import type {
  DefaultIpcContractMap,
  IpcChannelDefinition,
  IpcContractMap,
  KnownIpcChannel,
  TypedIpcBridge,
} from './universal/types';

type RendererListener = (...args: any[]) => void;
type ElectronListener = (_event: unknown, ...args: any[]) => void;
type RendererRpcHandler = (...args: any[]) => any;
type BridgeContracts<Contracts extends IpcContractMap> = Contracts &
  DefaultIpcContractMap;
export type AutoWhitelistRule =
  | string
  | RegExp
  | ((channel: string) => boolean);

export interface IpcBridgeOptions {
  strict?: boolean;
  autoWhitelist?: ReadonlyArray<AutoWhitelistRule>;
  debug?: boolean;
}

export interface SetupIpcBridgeOptions<
  Contracts extends IpcContractMap,
> extends IpcBridgeOptions {
  channels?: ReadonlyArray<KnownIpcChannel<Contracts>>;
}

const defaultChannels = [
  ...Object.values(WindowIpcChannel),
  ...Object.values(MenuIpcChannel),
] as ReadonlyArray<KnownIpcChannel>;

const defaultAutoWhitelistRules: ReadonlyArray<AutoWhitelistRule> = [
  // Supports dynamic channels emitted/handled by window decorators:
  // window:<windowName>.<commandOrEvent>
  /^window:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
  // Supports dynamic menu scoped channels:
  // menu:<windowName>.<commandOrEvent>
  /^menu:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
];

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

function validateChannel(
  channel: string,
  allowedChannels: ReadonlyArray<string>,
  autoWhitelistRules: ReadonlyArray<AutoWhitelistRule>,
  strict = true,
  debug = false,
): void {
  if (
    strict &&
    !allowedChannels.includes(channel) &&
    !isAutoWhitelistedChannel(channel, autoWhitelistRules)
  ) {
    if (debug) {
      console.warn('[assemblerjs/electron][ipc] Rejected channel:', channel);
    }

    throw new Error(
      `IPC channel "${channel}" is not whitelisted. Allowed: [${allowedChannels.join(
        ', ',
      )}]`,
    );
  }
}

function isAutoWhitelistedChannel(
  channel: string,
  rules: ReadonlyArray<AutoWhitelistRule>,
): boolean {
  return rules.some((rule) => matchesAutoWhitelistRule(channel, rule));
}

function matchesAutoWhitelistRule(
  channel: string,
  rule: AutoWhitelistRule,
): boolean {
  if (typeof rule === 'string') {
    return channel === rule;
  }

  if (rule instanceof RegExp) {
    return rule.test(channel);
  }

  return rule(channel);
}

function autoWhitelistRuleToString(rule: AutoWhitelistRule): string {
  if (typeof rule === 'string') {
    return rule;
  }

  if (rule instanceof RegExp) {
    return rule.toString();
  }

  return '[Function rule]';
}

interface RendererRpcRequestEnvelope {
  requestId: string;
  channel: string;
  args: unknown[];
}

interface RendererRpcResponseEnvelope {
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function toErrorPayload(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'Error',
    message: typeof error === 'string' ? error : String(error),
  };
}

function isRendererRpcRequestEnvelope(
  value: unknown,
): value is RendererRpcRequestEnvelope {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as RendererRpcRequestEnvelope).requestId === 'string' &&
    typeof (value as RendererRpcRequestEnvelope).channel === 'string' &&
    Array.isArray((value as RendererRpcRequestEnvelope).args),
  );
}

export function ipcContract<
  Args extends unknown[] = unknown[],
  Response = unknown,
>(): IpcChannelDefinition<Args, Response> {
  return {
    args: [] as unknown as Args,
    response: undefined as unknown as Response,
  };
}

export function defineIpcContracts<Contracts extends IpcContractMap>(
  contracts: Contracts,
): Contracts {
  return contracts;
}

export function getIpcContractChannels(
  contracts: IpcContractMap,
): ReadonlyArray<string> {
  return Object.keys(contracts);
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
  const strict = options.strict !== false; // Default to strict mode
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

export * from './universal/channels';
export type { IpcChannelDefinition, IpcContractMap } from './universal/types';
