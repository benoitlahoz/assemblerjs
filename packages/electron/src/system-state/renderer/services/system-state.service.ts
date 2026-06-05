import { BindThis } from '@assemblerjs/core';
import { Assemblage } from 'assemblerjs';
import { AbstractIpcService } from '@/ipc/renderer/services';
import { SystemStateIpcChannel } from '@/common/channels';
import type {
  SystemStateHealth,
  SystemStateServiceOptions,
  SystemStateSnapshot,
} from '@/common/types';
import { AbstractSystemStateService } from './system-state.abstract';

@Assemblage()
export class SystemStateService extends AbstractSystemStateService {
  private readonly subscriptions = new Set<() => void>();

  constructor(private readonly ipc: AbstractIpcService) {
    super();
  }

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

  @BindThis()
  public async getSnapshot(): Promise<SystemStateSnapshot> {
    return await this.ipc.invoke(SystemStateIpcChannel.GetSnapshot);
  }

  @BindThis()
  public async startMonitoring(
    options?: Partial<SystemStateServiceOptions>,
  ): Promise<void> {
    await this.ipc.invoke(SystemStateIpcChannel.StartMonitoring, options);
  }

  @BindThis()
  public async stopMonitoring(): Promise<void> {
    await this.ipc.invoke(SystemStateIpcChannel.StopMonitoring);
  }

  @BindThis()
  public async setInterval(intervalMs: number): Promise<void> {
    await this.ipc.invoke(SystemStateIpcChannel.SetInterval, intervalMs);
  }

  @BindThis()
  public onSnapshot(
    callback: (snapshot: SystemStateSnapshot) => void,
  ): () => void {
    const unsubscribe = this.ipc.on(SystemStateIpcChannel.OnSnapshot, callback);

    return this.registerSubscription(unsubscribe);
  }

  @BindThis()
  public onHealth(callback: (status: SystemStateHealth) => void): () => void {
    const unsubscribe = this.ipc.on(SystemStateIpcChannel.OnHealth, callback);
    return this.registerSubscription(unsubscribe);
  }

  @BindThis()
  public onDispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }

    this.subscriptions.clear();
  }
}
