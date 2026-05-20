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
  private readonly subscriptions = new Set<() => void>();

  private registerSubscription(unsubscribe: () => void): () => void {
    this.subscriptions.add(unsubscribe);

    return () => {
      if (!this.subscriptions.has(unsubscribe)) {
        return;
      }

      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }

  public get channels(): ReadonlyArray<KnownIpcChannel<Contracts>> {
    return this.bridge.channels;
  }

  public get versions(): Record<string, string> {
    return this.bridge.versions as Record<string, string>;
  }

  public on<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): () => void;
  public on(channel: string, listener: (...args: any[]) => void): () => void;
  @BindThis()
  public on(channel: string, listener: (...args: any[]) => void): () => void {
    const unsubscribe = this.bridge.ipc.on(channel, listener);
    return this.registerSubscription(unsubscribe);
  }

  public once<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): () => void;
  public once(channel: string, listener: (...args: any[]) => void): () => void;
  @BindThis()
  public once(channel: string, listener: (...args: any[]) => void): () => void {
    const unsubscribe = this.bridge.ipc.once(channel, listener);
    return this.registerSubscription(unsubscribe);
  }

  public off<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): void;
  public off(channel: string, listener: (...args: any[]) => void): void;
  @BindThis()
  public off(channel: string, listener: (...args: any[]) => void): void {
    this.bridge.ipc.off(channel, listener);
  }

  public removeAllListeners(channel: KnownIpcChannel<Contracts>): void;
  @BindThis()
  public removeAllListeners(channel: string): void {
    this.bridge.ipc.removeAllListeners(channel);
  }

  public send<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): void;
  public send(channel: string, ...args: any[]): void;
  @BindThis()
  public send(channel: string, ...args: any[]): void {
    this.bridge.ipc.send(channel, ...args);
  }

  public async invoke<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): Promise<IpcResponseFor<Contracts, Channel>>;
  public async invoke(channel: string, ...args: any[]): Promise<any>;
  @BindThis()
  public async invoke(channel: string, ...args: any[]): Promise<any> {
    return await this.bridge.ipc.invoke(channel, ...args);
  }

  @BindThis()
  public onDispose(): void | Promise<void> {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }

    this.subscriptions.clear();
  }
}
