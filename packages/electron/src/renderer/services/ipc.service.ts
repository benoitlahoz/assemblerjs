import { BindThis } from '@assemblerjs/core';
import { Assemblage } from 'assemblerjs';
import { AbstractIpcService } from './ipc.abstract';
import type {
  DefaultIpcContractMap,
  IpcArgsFor,
  IpcContractMap,
  IpcResponseFor,
  KnownIpcChannel,
  TypedIpcBridge,
} from '@/universal/types';

@Assemblage()
export class IpcService<
  Contracts extends IpcContractMap = DefaultIpcContractMap
> implements AbstractIpcService<Contracts> {
  private bridge = window.ipc as TypedIpcBridge<Contracts>;

  public get channels(): ReadonlyArray<KnownIpcChannel<Contracts>> {
    return this.bridge.channels;
  }

  public get versions(): Record<string, string> {
    return this.bridge.versions as Record<string, string>;
  }

  @BindThis()
  public on<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): void;
  public on(channel: string, listener: (...args: any[]) => void): void;
  public on(channel: string, listener: (...args: any[]) => void): void {
    this.bridge.ipc.on(channel, listener);
  }

  @BindThis()
  public once<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): void;
  public once(channel: string, listener: (...args: any[]) => void): void;
  public once(channel: string, listener: (...args: any[]) => void): void {
    this.bridge.ipc.once(channel, listener);
  }

  @BindThis()
  public off<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): void;
  public off(channel: string, listener: (...args: any[]) => void): void;
  public off(channel: string, listener: (...args: any[]) => void): void {
    this.bridge.ipc.off(channel, listener);
  }

  @BindThis()
  public removeAllListeners(channel: KnownIpcChannel<Contracts>): void;
  public removeAllListeners(channel: string): void {
    this.bridge.ipc.removeAllListeners(channel);
  }

  @BindThis()
  public send<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): void;
  public send(channel: string, ...args: any[]): void;
  public send(channel: string, ...args: any[]): void {
    this.bridge.ipc.send(channel, ...args);
  }

  @BindThis()
  public async invoke<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): Promise<IpcResponseFor<Contracts, Channel>>;
  public async invoke(channel: string, ...args: any[]): Promise<any>;
  public async invoke(channel: string, ...args: any[]): Promise<any> {
    return await this.bridge.ipc.invoke(channel, ...args);
  }

  @BindThis()
  public async emit<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): Promise<void>;
  public async emit(channel: string, ...args: any[]): Promise<void>;
  public async emit(channel: string, ...args: any[]): Promise<void> {
    await this.bridge.ipc.emit(channel, ...args);
  }
}
