import { Assemblage } from 'assemblerjs';
import { AbstractIpcService, unwrapIpcResult } from '@/renderer/ipc/services';
import { WindowIpcChannel } from '@/universal/channels';
import type {
  ManagedWindowDescriptor,
  WindowBounds,
  WindowState,
} from '@/universal/types';
import {
  AbstractWindowControllerService,
  type WindowSnapshot,
} from './window-controller.abstract';

function buildWindowCommandChannel(name: string, command: string): string {
  return `window:${name}.${command}`;
}

function buildWindowEventChannel(name: string, event: string): string {
  return `window:${name}.${event}`;
}

@Assemblage()
export class WindowControllerService extends AbstractWindowControllerService {
  private readonly snapshots = new Map<string, WindowSnapshot>();
  private readonly subscriptions = new Set<() => void>();

  constructor(private readonly _ipc: AbstractIpcService) {
    super();
  }

  public get ipc(): AbstractIpcService {
    return this._ipc;
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
      this._ipc.on(channel, (payload: T) => callback(payload, channel)),
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
  ): Promise<T | undefined> {
    const channel = buildWindowCommandChannel(name, command);
    const result = await this._ipc.invoke(channel, ...args);
    return unwrapIpcResult<T>(channel, result);
  }

  private async invokeWindowRegistryCommand<T>(
    channel: WindowIpcChannel,
    ...args: unknown[]
  ): Promise<T | undefined> {
    const result = await this._ipc.invoke(channel, ...args);
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
    return await this.invokeWindowCommand<WindowBounds>(name, 'getBounds', []);
  }

  public async focus(name: string): Promise<void> {
    await this.invokeWindowCommand<void>(name, 'focus', []);
  }

  public async setVisible(name: string, visible: boolean): Promise<void> {
    await this.invokeWindowCommand<void>(name, 'setVisible', [visible]);
  }

  public async setMinimized(name: string, minimized: boolean): Promise<void> {
    await this.invokeWindowCommand<void>(name, 'setMinimized', [minimized]);
  }

  public async setMaximized(name: string, maximized: boolean): Promise<void> {
    await this.invokeWindowCommand<void>(name, 'setMaximized', [maximized]);
  }

  public async restore(name: string): Promise<void> {
    await this.invokeWindowCommand<void>(name, 'restore', []);
  }

  public async pin(
    name: string,
    pinned: boolean,
  ): Promise<boolean | undefined> {
    return await this.invokeWindowCommand<boolean>(name, 'pin', [pinned]);
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
    const channel = buildWindowEventChannel(name, 'resize');

    return this.subscribeChannels<WindowBounds>(
      [channel],
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
    const channel = buildWindowEventChannel(name, 'stateChanged');

    return this.subscribeChannels<WindowState>([channel], (state) => {
      this.updateSnapshot(name, (snapshot) => {
        snapshot.state = state;
      });

      callback(state);
    });
  }

  public onFullscreenChanged(
    name: string,
    callback: (active: boolean) => void,
  ): () => void {
    const enterChannel = buildWindowEventChannel(name, 'enter-full-screen');
    const leaveChannel = buildWindowEventChannel(name, 'leave-full-screen');

    const unsubEnter = this.subscribeChannels<void>([enterChannel], () => {
      this.updateSnapshot(name, (snapshot) => {
        snapshot.isFullscreen = true;
      });

      callback(true);
    });

    const unsubLeave = this.subscribeChannels<void>([leaveChannel], () => {
      this.updateSnapshot(name, (snapshot) => {
        snapshot.isFullscreen = false;
      });

      callback(false);
    });

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
