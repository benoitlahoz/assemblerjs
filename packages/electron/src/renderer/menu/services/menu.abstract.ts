import {
  AbstractAssemblage,
  AssemblerContext,
  getAssemblageContext,
} from 'assemblerjs';
import { IpcService } from '@/renderer/ipc/services';
import {
  getMenuRendererDefinition,
  resolveMenuWindowName,
} from '@/renderer/menu';
import { AbstractMenuControllerService } from './menu-controller.abstract';
import { MenuControllerService } from './menu-controller.service';
import type {
  MenuItemClickedEvent,
  MenuItemState,
  MenuSnapshot,
} from '@/universal/types';

export abstract class AbstractMenuService implements AbstractAssemblage {
  private static standaloneMenus?: AbstractMenuControllerService;
  protected readonly windowName?: string;
  protected readonly menuName?: string;
  private resolvedMenus?: AbstractMenuControllerService;

  constructor(menus?: AbstractMenuControllerService) {
    this.resolvedMenus = menus;
  }

  protected resolveMenusFromContext(
    context: AssemblerContext,
  ): AbstractMenuControllerService | undefined {
    try {
      return context.require(AbstractMenuControllerService);
    } catch {
      try {
        return context.require(MenuControllerService);
      } catch {
        return undefined;
      }
    }
  }

  protected get menus(): AbstractMenuControllerService {
    if (this.resolvedMenus) {
      return this.resolvedMenus;
    }

    const context = getAssemblageContext(this.constructor);
    if (!context) {
      throw new Error(
        'AbstractMenuService could not resolve Assembler context for renderer menu controller service.',
      );
    }

    this.resolvedMenus = this.resolveMenusFromContext(context);
    if (!this.resolvedMenus) {
      if (!AbstractMenuService.standaloneMenus) {
        AbstractMenuService.standaloneMenus = new MenuControllerService(
          new IpcService(),
        );
      }

      this.resolvedMenus = AbstractMenuService.standaloneMenus;
    }

    return this.resolvedMenus;
  }

  protected resolveWindowName(): string {
    const fromWindowDecorator = resolveMenuWindowName(this);
    if (fromWindowDecorator) {
      return fromWindowDecorator;
    }

    throw new Error(
      "AbstractMenuService requires a window name (via instance 'windowName', @Window, or injected window service).",
    );
  }

  protected resolveMenuName(): string {
    const direct =
      this.menuName && typeof this.menuName === 'string'
        ? this.menuName
        : undefined;
    if (direct) {
      return direct;
    }

    const definition = getMenuRendererDefinition(this.constructor);
    if (definition?.name) {
      return definition.name;
    }

    return 'mainMenu';
  }

  public async getSnapshot(): Promise<MenuSnapshot | undefined> {
    const snapshot = await this.menus.getSnapshot(this.resolveWindowName());
    if (!snapshot) {
      return undefined;
    }

    return {
      ...snapshot,
      menuName: snapshot.menuName || this.resolveMenuName(),
    };
  }

  public snapshot(): MenuSnapshot | undefined {
    return this.menus.snapshot(this.resolveWindowName());
  }

  public async setItemEnabled(
    itemId: string,
    enabled: boolean,
  ): Promise<boolean> {
    return await this.menus.setItemEnabled(
      this.resolveWindowName(),
      itemId,
      enabled,
    );
  }

  public async setItemChecked(
    itemId: string,
    checked: boolean,
  ): Promise<boolean> {
    return await this.menus.setItemChecked(
      this.resolveWindowName(),
      itemId,
      checked,
    );
  }

  public onItemClicked(
    callback: (event: MenuItemClickedEvent) => void,
  ): () => void {
    return this.menus.onItemClicked(this.resolveWindowName(), callback);
  }

  public onItemStateChanged(
    callback: (state: MenuItemState) => void,
  ): () => void {
    return this.menus.onItemStateChanged(this.resolveWindowName(), callback);
  }

  public onTemplateChanged(callback: (menuName: string) => void): () => void {
    return this.menus.onTemplateChanged(this.resolveWindowName(), callback);
  }

  public onDispose(
    _context: AssemblerContext,
    _configuration?: Record<string, any>,
  ): void | Promise<void> {
    return undefined;
  }
}
