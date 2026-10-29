import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Assemblage, Assembler } from 'assemblerjs';
import { MenuIpcChannel } from '../src/common/channels';
import { flushCleanupCallbacks } from '../src/common/lifecycle';
import type { MenuItemClickedEvent } from '../src/common/types';
import { Menu } from '../src/menu/renderer/menu-definition/menu.decorator';
import { MenuOn } from '../src/menu/renderer/menu-listener/menu-on.decorator';
import { validateChannel } from '../src/preload/whitelist';

describe('@MenuOn item ID subscriptions', () => {
  let bridge: EventEmitter;

  beforeEach(() => {
    bridge = new EventEmitter();
    vi.stubGlobal('window', { ipc: bridge });
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const on = bridge.on.bind(bridge);
    vi.spyOn(bridge, 'on').mockImplementation((channel, listener) => {
      validateChannel(String(channel), Object.values(MenuIpcChannel), [
        /^menu:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
      ]);
      return on(channel, listener);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function createListener(itemId = 'file:close-tab') {
    @Menu('mainMenu')
    @Assemblage()
    class TestMenu {
      public readonly windowName = 'main';
      public readonly closeTab = vi.fn();
      public readonly anotherCloseTab = vi.fn();
      public readonly allClicks = vi.fn();
      public readonly stateChanged = vi.fn();
      public readonly templateChanged = vi.fn();

      @MenuOn(itemId)
      onCloseTab(event: MenuItemClickedEvent): void {
        this.closeTab(event);
      }

      @MenuOn(itemId)
      onAnotherCloseTab(event: MenuItemClickedEvent): void {
        this.anotherCloseTab(event);
      }

      @MenuOn('itemClicked')
      onItemClicked(event: MenuItemClickedEvent): void {
        this.allClicks(event);
      }

      @MenuOn('stateChanged')
      onStateChanged(state: unknown): void {
        this.stateChanged(state);
      }

      @MenuOn('templateChanged')
      onTemplateChanged(name: string): void {
        this.templateChanged(name);
      }
    }

    return Assembler.build(TestMenu);
  }

  const click: MenuItemClickedEvent = {
    itemId: 'file:close-tab',
    windowName: 'main',
    checked: false,
    timestampMs: 1,
  };

  it('routes the scoped click to item-specific and generic handlers', () => {
    const listener = createListener();

    bridge.emit('menu:main.itemClicked', click);

    expect(listener.closeTab).toHaveBeenCalledExactlyOnceWith(click);
    expect(listener.anotherCloseTab).toHaveBeenCalledExactlyOnceWith(click);
    expect(listener.allClicks).toHaveBeenCalledExactlyOnceWith(click);
    expect(listener.stateChanged).not.toHaveBeenCalled();
    expect(listener.templateChanged).not.toHaveBeenCalled();
  });

  it('ignores other item IDs without suppressing a subsequent matching click', () => {
    const listener = createListener();

    bridge.emit('menu:main.itemClicked', { ...click, itemId: 'file:open' });
    expect(listener.closeTab).not.toHaveBeenCalled();

    bridge.emit('menu:main.itemClicked', click);
    expect(listener.closeTab).toHaveBeenCalledExactlyOnceWith(click);
    expect(listener.allClicks).toHaveBeenCalledTimes(2);
  });

  it('normalizes legacy clicks and filters their window and item ID', () => {
    const listener = createListener();

    bridge.emit(MenuIpcChannel.OnItemClicked, 'file:close-tab', 'secondary');
    bridge.emit(MenuIpcChannel.OnItemClicked, 'file:open', 'main');
    expect(listener.closeTab).not.toHaveBeenCalled();

    bridge.emit(MenuIpcChannel.OnItemClicked, 'file:close-tab', 'main');
    expect(listener.closeTab).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        itemId: 'file:close-tab',
        windowName: 'main',
      }),
    );
  });

  it('deduplicates scoped and legacy delivery independently for each handler', () => {
    const listener = createListener();

    bridge.emit('menu:main.itemClicked', click);
    bridge.emit(MenuIpcChannel.OnItemClicked, click.itemId, click.windowName);

    expect(listener.closeTab).toHaveBeenCalledTimes(1);
    expect(listener.anotherCloseTab).toHaveBeenCalledTimes(1);
    expect(listener.allClicks).toHaveBeenCalledTimes(1);
  });

  it('does not receive scoped clicks for another window', () => {
    const listener = createListener();

    bridge.emit('menu:secondary.itemClicked', {
      ...click,
      windowName: 'secondary',
    });

    expect(listener.closeTab).not.toHaveBeenCalled();
    expect(listener.allClicks).not.toHaveBeenCalled();
  });

  it('continues receiving clicks after the deduplication interval', () => {
    const listener = createListener();

    bridge.emit('menu:main.itemClicked', click);
    vi.mocked(Date.now).mockReturnValue(1_100);
    bridge.emit('menu:main.itemClicked', { ...click, timestampMs: 2 });

    expect(listener.closeTab).toHaveBeenCalledTimes(2);
    expect(listener.allClicks).toHaveBeenCalledTimes(2);
  });

  it('removes item-specific subscriptions on disposal', async () => {
    const listener = createListener();

    await flushCleanupCallbacks(listener);
    bridge.emit('menu:main.itemClicked', click);
    bridge.emit(MenuIpcChannel.OnItemClicked, click.itemId, click.windowName);
    bridge.emit('menu:main.file:close-tab', click);

    expect(listener.closeTab).not.toHaveBeenCalled();
    expect(listener.allClicks).not.toHaveBeenCalled();
    expect(bridge.eventNames()).toEqual([]);
  });

  it('supports dotted item IDs with a strict preload whitelist', () => {
    const listener = createListener('window.bounds.refreshBounds');
    const event = { ...click, itemId: 'window.bounds.refreshBounds' };

    bridge.emit('menu:main.itemClicked', event);
    bridge.emit(MenuIpcChannel.OnItemClicked, event.itemId, event.windowName);

    expect(listener.closeTab).toHaveBeenCalledExactlyOnceWith(event);
    expect(listener.anotherCloseTab).toHaveBeenCalledExactlyOnceWith(event);
    expect(listener.allClicks).toHaveBeenCalledExactlyOnceWith(event);
    expect(bridge.eventNames()).not.toContain(
      'menu:main.window.bounds.refreshBounds',
    );
    expect(bridge.eventNames()).not.toContain('menu:main.file:close-tab');
  });

  it('preserves state and template streams', () => {
    const listener = createListener();
    const state = { id: 'file:close-tab', enabled: false };

    bridge.emit('menu:main.stateChanged', state);
    bridge.emit(MenuIpcChannel.OnItemStateChanged, 'main', state);
    bridge.emit('menu:main.templateChanged', 'mainMenu');
    bridge.emit(MenuIpcChannel.OnTemplateChanged, 'main', 'mainMenu');

    expect(listener.stateChanged).toHaveBeenCalledExactlyOnceWith(state);
    expect(listener.templateChanged).toHaveBeenCalledExactlyOnceWith(
      'mainMenu',
    );
    expect(listener.closeTab).not.toHaveBeenCalled();
    expect(listener.allClicks).not.toHaveBeenCalled();
  });
});
