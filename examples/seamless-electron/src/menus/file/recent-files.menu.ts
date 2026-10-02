import { Assemblage, Context, type AssemblerContext } from 'assemblerjs';
import {
  AppListener,
  AppOn,
  createMenuItem,
  type ElectronMenuItem,
  MenuItem,
  MenuLifecycleEvent,
  type MenuRegisteredEvent,
} from '@assemblerjs/electron';
import { MenuController } from '../menu.controller';

const RECENT_GROUP_ID = 'menu.file.open.recent';

@AppListener()
@MenuItem('Open Recent')
@Assemblage()
export class RecentFilesMenu {
  private windowIds: number[] = [];
  private readonly registrations = new Map<number | 'global', MenuRegisteredEvent>();
  private readonly cleanups = new Map<number, () => void>();
  private pendingRefresh: Promise<void> = Promise.resolve();

  constructor(@Context() private readonly context: AssemblerContext) {}

  @MenuItem({ id: 'file.openRecent.empty', label: 'No recent windows', enabled: false })
  private empty(): void {}

  @AppOn(MenuLifecycleEvent.Registered)
  public onMenuRegistered(event: MenuRegisteredEvent): void {
    if (!event.menu.itemById(RECENT_GROUP_ID) || (!event.global && !event.window)) {
      return;
    }

    const scope = event.window?.id ?? 'global';
    this.registrations.set(scope, event);
    if (event.window && !this.cleanups.has(event.window.id)) {
      const window = event.window;
      this.windowIds = [window.id, ...this.windowIds.filter((id) => id !== window.id)].slice(0, 10);
      const cleanup = (): void => {
        window.off('closed', cleanup);
        this.registrations.delete(window.id);
        this.cleanups.delete(window.id);
        this.scheduleRefresh();
      };
      this.cleanups.set(window.id, cleanup);
      window.once('closed', cleanup);
    }

    this.scheduleRefresh();
  }

  public onDispose(): void {
    for (const cleanup of this.cleanups.values()) {
      cleanup();
    }
    this.registrations.clear();
  }

  private buildItems(): ElectronMenuItem[] {
    if (this.windowIds.length === 0) {
      return [
        createMenuItem({
          id: 'file.openRecent.empty',
          label: 'No recent windows',
          enabled: false,
        }),
      ];
    }

    return [
      ...this.windowIds.map((id) =>
        createMenuItem({
          id: `file.openRecent.window:${id}`,
          label: `Window ${id}`,
          enabled: Boolean(this.registrations.get(id)?.window),
          click: () => {
            const window = this.registrations.get(id)?.window;
            if (window && !window.isDestroyed()) {
              if (window.isMinimized()) window.restore();
              window.show();
              window.focus();
            }
          },
        }),
      ),
      createMenuItem({ id: 'file.openRecent.separator', type: 'separator' }),
      createMenuItem({
        id: 'file.openRecent.clear',
        label: 'Clear Recent Windows',
        click: () => {
          this.windowIds = [];
          this.scheduleRefresh();
        },
      }),
    ];
  }

  private scheduleRefresh(): void {
    this.pendingRefresh = this.pendingRefresh
      .then(async () => {
        const menus = this.context.require(MenuController);
        for (const event of this.registrations.values()) {
          await menus.replaceSubmenuItems(event.window, RECENT_GROUP_ID, this.buildItems());
        }
      })
      .catch((error: unknown) => {
        console.error('Could not refresh recent windows', error);
      });
  }
}
