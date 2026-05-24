import {
  WindowIpcChannel,
  MenuIpcChannel,
  SystemStateIpcChannel,
} from './channels';

export interface IpcReturnType<T = any> {
  data: T | null;
  err: Error | null;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
}

export interface ManagedWindowDescriptor {
  name: string;
  multiple: boolean;
}

export interface RuntimeStackInfo {
  electron: string;
  chrome: string;
  node: string;
  platform: NodeJS.Platform;
}

export interface ProcessState {
  pid: number;
  uptimeSec: number;
  rssBytes: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
  cpuPercent?: number;
}

export interface OsState {
  totalMemBytes: number;
  freeMemBytes: number;
  availableMemBytes?: number;
  memorySource?: 'platform-estimate' | 'electron-native' | 'node-os-fallback';
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
}

export interface DisplayState {
  id: number;
  isPrimary: boolean;
  bounds: WindowBounds;
  workArea: WindowBounds;
  scaleFactor: number;
}

export interface SystemStateSnapshot {
  timestampMs: number;
  runtime: RuntimeStackInfo;
  process: ProcessState;
  os: OsState;
  displays: DisplayState[];
}

export interface SystemStateServiceOptions {
  autoStart?: boolean;
  intervalMs?: number;
  includeCpuPercent?: boolean;
  includeDisplays?: boolean;
}

export type SystemStateHealth = 'running' | 'stopped' | 'degraded';

export interface IpcChannelDefinition<
  Args extends unknown[] = unknown[],
  Response = unknown,
> {
  args: Args;
  response: Response;
}

export interface IpcContractMap {
  [channel: string]: IpcChannelDefinition;
}

export interface DefaultIpcContractMap extends IpcContractMap {
  // Queries
  [WindowIpcChannel.GetName]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<string>
  >;
  [WindowIpcChannel.GetBounds]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<WindowBounds>
  >;
  [WindowIpcChannel.ListWindowNames]: IpcChannelDefinition<
    [],
    IpcReturnType<string[]>
  >;
  [WindowIpcChannel.ListManagedWindows]: IpcChannelDefinition<
    [],
    IpcReturnType<ManagedWindowDescriptor[]>
  >;
  [WindowIpcChannel.HasWindow]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<boolean>
  >;
  [WindowIpcChannel.OpenWindow]: IpcChannelDefinition<
    [name: string, configuration?: Record<string, any>],
    IpcReturnType<boolean>
  >;
  [WindowIpcChannel.CloseWindow]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<boolean>
  >;
  // Window control
  [WindowIpcChannel.Pin]: IpcChannelDefinition<
    [name: string, pinned: boolean],
    IpcReturnType<boolean>
  >;
  [WindowIpcChannel.SetVisible]: IpcChannelDefinition<
    [name: string, visible: boolean],
    IpcReturnType<void>
  >;
  [WindowIpcChannel.SetMinimized]: IpcChannelDefinition<
    [name: string, minimized: boolean],
    IpcReturnType<void>
  >;
  [WindowIpcChannel.SetMaximized]: IpcChannelDefinition<
    [name: string, maximized: boolean],
    IpcReturnType<void>
  >;
  [WindowIpcChannel.Restore]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<void>
  >;
  [WindowIpcChannel.Focus]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<void>
  >;
  // Events
  [WindowIpcChannel.OnBoundsChanged]: IpcChannelDefinition<
    [bounds: WindowBounds],
    void
  >;
  [WindowIpcChannel.OnStateChanged]: IpcChannelDefinition<
    [state: WindowState],
    void
  >;
  [WindowIpcChannel.OnEnterFullscreen]: IpcChannelDefinition<[], void>;
  [WindowIpcChannel.OnLeaveFullscreen]: IpcChannelDefinition<[], void>;
  // Menu
  [MenuIpcChannel.OnItemClicked]: IpcChannelDefinition<
    [itemId: string, windowName: string],
    void
  >;
  // System state
  [SystemStateIpcChannel.GetSnapshot]: IpcChannelDefinition<
    [],
    SystemStateSnapshot
  >;
  [SystemStateIpcChannel.StartMonitoring]: IpcChannelDefinition<
    [options?: Partial<SystemStateServiceOptions>],
    void
  >;
  [SystemStateIpcChannel.StopMonitoring]: IpcChannelDefinition<[], void>;
  [SystemStateIpcChannel.SetInterval]: IpcChannelDefinition<
    [intervalMs: number],
    void
  >;
  [SystemStateIpcChannel.OnSnapshot]: IpcChannelDefinition<
    [snapshot: SystemStateSnapshot],
    void
  >;
  [SystemStateIpcChannel.OnHealth]: IpcChannelDefinition<
    [health: SystemStateHealth],
    void
  >;
}

export type KnownIpcChannel<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
> = Extract<keyof Contracts, string>;

export type IpcArgsFor<
  Contracts extends IpcContractMap,
  Channel extends KnownIpcChannel<Contracts>,
> = Contracts[Channel]['args'];

export type IpcResponseFor<
  Contracts extends IpcContractMap,
  Channel extends KnownIpcChannel<Contracts>,
> = Contracts[Channel]['response'];

export type IpcRendererHandler<
  Contracts extends IpcContractMap,
  Channel extends KnownIpcChannel<Contracts>,
> = (
  ...args: IpcArgsFor<Contracts, Channel>
) =>
  | IpcResponseFor<Contracts, Channel>
  | Promise<IpcResponseFor<Contracts, Channel>>;

export interface TypedIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap,
> {
  readonly channels: ReadonlyArray<KnownIpcChannel<Contracts>>;
  on<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void,
  ): () => void;
  on(channel: string, listener: (...args: any[]) => void): () => void;

  once<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void,
  ): () => void;
  once(channel: string, listener: (...args: any[]) => void): () => void;

  off<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void,
  ): void;
  off(channel: string, listener: (...args: any[]) => void): void;

  removeAllListeners(channel: KnownIpcChannel<Contracts>): void;
  removeAllListeners(channel: string): void;

  send<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): void;
  send(channel: string, ...args: any[]): void;

  invoke<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): Promise<IpcResponseFor<Contracts, Channel>>;
  invoke(channel: string, ...args: any[]): Promise<any>;

  handle<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    handler: IpcRendererHandler<Contracts, Channel>,
  ): () => void;
  handle(channel: string, handler: (...args: any[]) => any): () => void;

  removeHandler<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
  ): void;
  removeHandler(channel: string): void;
}
