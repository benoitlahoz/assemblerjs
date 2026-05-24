import { Assemblage } from 'assemblerjs';
import { AbstractIpcService } from '@/renderer/ipc/services';
import { WindowIpcChannel } from '@/universal/channels';
import type {
  IpcReturnType,
  ManagedWindowDescriptor,
  WindowBounds,
  WindowState,
} from '@/universal/types';
import {
  AbstractWindowRendererService,
  type WindowSnapshot,
} from './window-renderer.abstract';

function buildWindowCommandChannel(name: string, command: string): string {
  return `window:${name}.${command}`;
}

function buildWindowEventChannel(name: string, event: string): string {
  return `window:${name}.${event}`;
}

function isIpcReturnType<T>(value: unknown): value is IpcReturnType<T> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'data') &&
    Object.prototype.hasOwnProperty.call(value, 'err'),
  );
}

function unwrapIpcResult<T>(channel: string, value: unknown): T | undefined {
  if (isIpcReturnType<T>(value)) {
    if (value.err) {
      throw new Error(`${channel}: ${value.err.message}`);
    }

    return value.data === null ? undefined : value.data;
  }

  return value as T | undefined;
}

@Assemblage()
export class WindowRendererService extends AbstractWindowRendererService {
  private readonly snapshots = new Map<string, WindowSnapshot>();
  private readonly subscriptions = new Set<() => void>();

  constructor(private readonly ipc: AbstractIpcService) {
    super();
  }

  private ensureSnapshot(name: string): WindowSnapshot {
    const existing = this.snapshots.get(name);
    if (existing) {
      return existing;
    }

    const created: WindowSnapshot = {
      name,
      updatedAt: Date.now(),
    };

    this.snapshots.set(name, created);
    return created;
  }

  private updateSnapshot(
    name: string,
    updater: (snapshot: WindowSnapshot) => void,
  ): void {
    const snapshot = this.ensureSnapshot(name);
    updater(snapshot);
    snapshot.updatedAt = Date.now();
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

  private subscribeChannels<T>(
    channels: ReadonlyArray<string>,
    callback: (payload: T, channel: string) => void,
  ): () => void {
    const unsubs = channels.map((channel) =>
      this.ipc.on(channel, (payload: T) => callback(payload, channel)),
    );

    const unsubscribe = () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };

    return this.registerSubscription(unsubscribe);
  }

  private async invokeWindowCommand<T>(
    name: string,
    command: string,
    args: unknown[],
    fallbackChannel?: string,
  ): Promise<T | undefined> {
    const scopedChannel = buildWindowCommandChannel(name, command);

    try {
      const scopedResult = await this.ipc.invoke(scopedChannel, ...args);
      return unwrapIpcResult<T>(scopedChannel, scopedResult);
    } catch (error) {
      if (!fallbackChannel) {
        throw error;
      }

      const fallbackResult = await this.ipc.invoke(
        fallbackChannel,
        name,
        ...args,
      );
      return unwrapIpcResult<T>(fallbackChannel, fallbackResult);
    }
  }

  private async invokeWindowRegistryCommand<T>(
    channel: WindowIpcChannel,
    ...args: unknown[]
  ): Promise<T | undefined> {
    const result = await this.ipc.invoke(channel, ...args);
    return unwrapIpcResult<T>(channel, result);
  }

  public async listWindowNames(): Promise<string[]> {
    return (
      (await this.invokeWindowRegistryCommand<string[]>(
        WindowIpcChannel.ListWindowNames,
      )) || []
    );
  }

  public async listManagedWindows(): Promise<ManagedWindowDescriptor[]> {
    return (
      (await this.invokeWindowRegistryCommand<ManagedWindowDescriptor[]>(
        WindowIpcChannel.ListManagedWindows,
      )) || []
    );
  }

  public async hasWindow(name: string): Promise<boolean> {
    return Boolean(
      await this.invokeWindowRegistryCommand<boolean>(
        WindowIpcChannel.HasWindow,
        name,
      ),
    );
  }

  public async openWindow(
    name: string,
    configuration?: Record<string, any>,
  ): Promise<boolean> {
    return Boolean(
      await this.invokeWindowRegistryCommand<boolean>(
        WindowIpcChannel.OpenWindow,
        name,
        configuration,
      ),
    );
  }

  public async closeWindow(name: string): Promise<boolean> {
    return Boolean(
      await this.invokeWindowRegistryCommand<boolean>(
        WindowIpcChannel.CloseWindow,
        name,
      ),
    );
  }

  public async getBounds(name: string): Promise<WindowBounds | undefined> {
    return await this.invokeWindowCommand<WindowBounds>(
      name,
      'getBounds',
      [],
      WindowIpcChannel.GetBounds,
    );
  }

  public async focus(name: string): Promise<void> {
    await this.invokeWindowCommand<void>(
      name,
      'focus',
      [],
      WindowIpcChannel.Focus,
    );
  }

  public async setVisible(name: string, visible: boolean): Promise<void> {
    await this.invokeWindowCommand<void>(
      name,
      'setVisible',
      [visible],
      WindowIpcChannel.SetVisible,
    );
  }

  public async setMinimized(name: string, minimized: boolean): Promise<void> {
    await this.invokeWindowCommand<void>(
      name,
      'setMinimized',
      [minimized],
      WindowIpcChannel.SetMinimized,
    );
  }

  public async setMaximized(name: string, maximized: boolean): Promise<void> {
    await this.invokeWindowCommand<void>(
      name,
      'setMaximized',
      [maximized],
      WindowIpcChannel.SetMaximized,
    );
  }

  public async restore(name: string): Promise<void> {
    await this.invokeWindowCommand<void>(
      name,
      'restore',
      [],
      WindowIpcChannel.Restore,
    );
  }

  public async pin(
    name: string,
    pinned: boolean,
  ): Promise<boolean | undefined> {
    return await this.invokeWindowCommand<boolean>(
      name,
      'pin',
      [pinned],
      WindowIpcChannel.Pin,
    );
  }

  public snapshot(name: string): WindowSnapshot | undefined {
    return this.snapshots.get(name);
  }

  public trackWindow(name: string): () => void {
    const unsubs = [
      this.onBoundsChanged(name, () => undefined),
      this.onStateChanged(name, () => undefined),
      this.onFullscreenChanged(name, () => undefined),
    ];

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }

  public onBoundsChanged(
    name: string,
    callback: (bounds: WindowBounds) => void,
  ): () => void {
    const channels = [
      buildWindowEventChannel(name, 'boundsChanged'),
      WindowIpcChannel.OnBoundsChanged,
    ];

    return this.subscribeChannels<WindowBounds>(
      [...new Set(channels)],
      (bounds, _channel) => {
        this.updateSnapshot(name, (snapshot) => {
          snapshot.bounds = bounds;
        });

        callback(bounds);
      },
    );
  }

  public onStateChanged(
    name: string,
    callback: (state: WindowState) => void,
  ): () => void {
    const channels = [
      buildWindowEventChannel(name, 'stateChanged'),
      WindowIpcChannel.OnStateChanged,
    ];

    return this.subscribeChannels<WindowState>(
      [...new Set(channels)],
      (state) => {
        this.updateSnapshot(name, (snapshot) => {
          snapshot.state = state;
        });

        callback(state);
      },
    );
  }

  public onFullscreenChanged(
    name: string,
    callback: (active: boolean) => void,
  ): () => void {
    const enterChannels = [
      buildWindowEventChannel(name, 'enterFullscreen'),
      WindowIpcChannel.OnEnterFullscreen,
    ];
    const leaveChannels = [
      buildWindowEventChannel(name, 'leaveFullscreen'),
      WindowIpcChannel.OnLeaveFullscreen,
    ];

    const unsubEnter = this.subscribeChannels<void>(
      [...new Set(enterChannels)],
      () => {
        this.updateSnapshot(name, (snapshot) => {
          snapshot.isFullscreen = true;
        });

        callback(true);
      },
    );

    const unsubLeave = this.subscribeChannels<void>(
      [...new Set(leaveChannels)],
      () => {
        this.updateSnapshot(name, (snapshot) => {
          snapshot.isFullscreen = false;
        });

        callback(false);
      },
    );

    const unsubscribe = () => {
      unsubEnter();
      unsubLeave();
    };

    return this.registerSubscription(unsubscribe);
  }

  public onDispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }

    this.subscriptions.clear();
  }
}
