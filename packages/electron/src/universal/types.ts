import { WindowIpcChannel } from './channels';

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

export interface IpcChannelDefinition<
  Args extends unknown[] = unknown[],
  Response = unknown
> {
  args: Args;
  response: Response;
}

export interface IpcContractMap {
  [channel: string]: IpcChannelDefinition;
}

export interface DefaultIpcContractMap extends IpcContractMap {
  [WindowIpcChannel.GetName]: IpcChannelDefinition<[name: string], IpcReturnType<string>>;
  [WindowIpcChannel.GetBounds]: IpcChannelDefinition<
    [name: string],
    IpcReturnType<WindowBounds>
  >;
  [WindowIpcChannel.Pin]: IpcChannelDefinition<
    [name: string, pinned: boolean],
    IpcReturnType<boolean>
  >;
  [WindowIpcChannel.OnResize]: IpcChannelDefinition<[bounds: WindowBounds], void>;
  [WindowIpcChannel.OnEnterFullscreen]: IpcChannelDefinition<[], void>;
  [WindowIpcChannel.OnLeaveFullscreen]: IpcChannelDefinition<[], void>;
}

export type KnownIpcChannel<
  Contracts extends IpcContractMap = DefaultIpcContractMap
> = Extract<keyof Contracts, string>;

export type IpcArgsFor<
  Contracts extends IpcContractMap,
  Channel extends KnownIpcChannel<Contracts>
> = Contracts[Channel]['args'];

export type IpcResponseFor<
  Contracts extends IpcContractMap,
  Channel extends KnownIpcChannel<Contracts>
> = Contracts[Channel]['response'];

export interface TypedIpcBridge<
  Contracts extends IpcContractMap = DefaultIpcContractMap
> {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  readonly channels: ReadonlyArray<KnownIpcChannel<Contracts>>;
  readonly ipc: {
    on<Channel extends KnownIpcChannel<Contracts>>(
      channel: Channel,
      listener: (...args: IpcArgsFor<Contracts, Channel>) => void
    ): void;
    on(channel: string, listener: (...args: any[]) => void): void;

    once<Channel extends KnownIpcChannel<Contracts>>(
      channel: Channel,
      listener: (...args: IpcArgsFor<Contracts, Channel>) => void
    ): void;
    once(channel: string, listener: (...args: any[]) => void): void;

    off<Channel extends KnownIpcChannel<Contracts>>(
      channel: Channel,
      listener: (...args: IpcArgsFor<Contracts, Channel>) => void
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

    emit<Channel extends KnownIpcChannel<Contracts>>(
      channel: Channel,
      ...args: IpcArgsFor<Contracts, Channel>
    ): Promise<void>;
    emit(channel: string, ...args: any[]): Promise<void>;
  };
}
