import { Assemblage } from 'assemblerjs';
import { AbstractIpcService, unwrapIpcResult } from '@/renderer/ipc/services';
import {
  buildMenuCommandChannel,
  buildMenuEventChannel,
  MenuIpcChannel,
} from '@/universal';
import type {
  MenuItemClickedEvent,
  MenuItemState,
  MenuSnapshot,
} from '@/universal/types';
import { AbstractMenuControllerService } from './menu-controller.abstract';

@Assemblage()
export class MenuControllerService extends AbstractMenuControllerService {
  private readonly snapshots = new Map<string, MenuSnapshot>();
  private readonly subscriptions = new Set<() => void>();
  private readonly recentlyHandledEvents = new Map<string, number>();

  constructor(private readonly ipc: AbstractIpcService) {
    super();
  }

  private ensureSnapshot(windowName: string): MenuSnapshot {
    const existing = this.snapshots.get(windowName);
    if (existing) {
      return existing;
    }

    const created: MenuSnapshot = {
      windowName,
      menuName: 'mainMenu',
      items: {},
      updatedAt: Date.now(),
    };

    this.snapshots.set(windowName, created);
    return created;
  }

  private updateSnapshot(
    windowName: string,
    updater: (snapshot: MenuSnapshot) => void,
  ): void {
    const snapshot = this.ensureSnapshot(windowName);
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

  private shouldHandleEvent(key: string): boolean {
    const now = Date.now();
    const previous = this.recentlyHandledEvents.get(key);

    this.recentlyHandledEvents.set(key, now);
    if (previous !== undefined && now - previous <= 30) {
      return false;
    }

    if (this.recentlyHandledEvents.size > 500) {
      for (const [
        eventKey,
        timestamp,
      ] of this.recentlyHandledEvents.entries()) {
        if (now - timestamp > 5_000) {
          this.recentlyHandledEvents.delete(eventKey);
        }
      }
    }

    return true;
  }

  private async invokeMenuCommand<T>(
    windowName: string,
    command: string,
    args: unknown[],
    fallbackChannel: MenuIpcChannel,
  ): Promise<T | undefined> {
    const scopedChannel = buildMenuCommandChannel(windowName, command);

    try {
      const scopedResult = await this.ipc.invoke(scopedChannel, ...args);
      return unwrapIpcResult<T>(scopedChannel, scopedResult);
    } catch {
      const fallbackResult = await this.ipc.invoke(
        fallbackChannel,
        windowName,
        ...args,
      );

      return unwrapIpcResult<T>(fallbackChannel, fallbackResult);
    }
  }

  public async getSnapshot(
    windowName: string,
  ): Promise<MenuSnapshot | undefined> {
    const snapshot = await this.invokeMenuCommand<MenuSnapshot>(
      windowName,
      'snapshot',
      [],
      MenuIpcChannel.GetSnapshot,
    );

    if (snapshot) {
      this.snapshots.set(windowName, snapshot);
    }

    return snapshot;
  }

  public async setItemEnabled(
    windowName: string,
    itemId: string,
    enabled: boolean,
  ): Promise<boolean> {
    return Boolean(
      await this.invokeMenuCommand<boolean>(
        windowName,
        'setItemEnabled',
        [itemId, enabled],
        MenuIpcChannel.SetItemEnabled,
      ),
    );
  }

  public async setItemChecked(
    windowName: string,
    itemId: string,
    checked: boolean,
  ): Promise<boolean> {
    return Boolean(
      await this.invokeMenuCommand<boolean>(
        windowName,
        'setItemChecked',
        [itemId, checked],
        MenuIpcChannel.SetItemChecked,
      ),
    );
  }

  public snapshot(windowName: string): MenuSnapshot | undefined {
    return this.snapshots.get(windowName);
  }

  public onItemClicked(
    windowName: string,
    callback: (event: MenuItemClickedEvent) => void,
  ): () => void {
    const unsubs = [
      this.ipc.on(
        buildMenuEventChannel(windowName, 'itemClicked'),
        (event: MenuItemClickedEvent) => {
          if (!this.shouldHandleEvent(`click:${windowName}:${event.itemId}`)) {
            return;
          }

          this.updateSnapshot(windowName, () => undefined);
          callback(event);
        },
      ),
      this.ipc.on(
        MenuIpcChannel.OnItemClicked,
        (itemId: string, eventWindowName: string) => {
          if (eventWindowName !== windowName) {
            return;
          }

          const event: MenuItemClickedEvent = {
            itemId,
            windowName: eventWindowName,
            timestampMs: Date.now(),
          };

          if (!this.shouldHandleEvent(`click:${windowName}:${event.itemId}`)) {
            return;
          }

          this.updateSnapshot(windowName, () => undefined);
          callback(event);
        },
      ),
    ];

    return this.registerSubscription(() => {
      for (const unsub of unsubs) {
        unsub();
      }
    });
  }

  public onItemStateChanged(
    windowName: string,
    callback: (state: MenuItemState) => void,
  ): () => void {
    const unsubs = [
      this.ipc.on(
        buildMenuEventChannel(windowName, 'stateChanged'),
        (state: MenuItemState) => {
          if (
            !this.shouldHandleEvent(
              `state:${windowName}:${state.id}:${JSON.stringify(state)}`,
            )
          ) {
            return;
          }

          this.updateSnapshot(windowName, (snapshot) => {
            snapshot.items[state.id] = {
              ...snapshot.items[state.id],
              ...state,
            };
          });

          callback(state);
        },
      ),
      this.ipc.on(
        MenuIpcChannel.OnItemStateChanged,
        (eventWindowName: string, state: MenuItemState) => {
          if (eventWindowName !== windowName) {
            return;
          }

          if (
            !this.shouldHandleEvent(
              `state:${windowName}:${state.id}:${JSON.stringify(state)}`,
            )
          ) {
            return;
          }

          this.updateSnapshot(windowName, (snapshot) => {
            snapshot.items[state.id] = {
              ...snapshot.items[state.id],
              ...state,
            };
          });

          callback(state);
        },
      ),
    ];

    return this.registerSubscription(() => {
      for (const unsub of unsubs) {
        unsub();
      }
    });
  }

  public onTemplateChanged(
    windowName: string,
    callback: (menuName: string) => void,
  ): () => void {
    const unsubs = [
      this.ipc.on(
        buildMenuEventChannel(windowName, 'templateChanged'),
        (menuName: string) => {
          if (!this.shouldHandleEvent(`template:${windowName}:${menuName}`)) {
            return;
          }

          this.updateSnapshot(windowName, (snapshot) => {
            snapshot.menuName = menuName;
          });

          callback(menuName);
        },
      ),
      this.ipc.on(
        MenuIpcChannel.OnTemplateChanged,
        (eventWindowName: string, menuName: string) => {
          if (eventWindowName !== windowName) {
            return;
          }

          if (!this.shouldHandleEvent(`template:${windowName}:${menuName}`)) {
            return;
          }

          this.updateSnapshot(windowName, (snapshot) => {
            snapshot.menuName = menuName;
          });

          callback(menuName);
        },
      ),
    ];

    return this.registerSubscription(() => {
      for (const unsub of unsubs) {
        unsub();
      }
    });
  }

  public onDispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }

    this.subscriptions.clear();
  }
}
