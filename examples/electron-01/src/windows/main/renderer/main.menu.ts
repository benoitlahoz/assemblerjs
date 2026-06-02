import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractMenuService, Menu, MenuOn } from '@assemblerjs/electron/renderer';
import type { MenuItemClickedEvent } from '@assemblerjs/electron/renderer';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';
import { MainWindow } from './main.window';

@Menu({ window: MAIN_WINDOW_CONFIG.name, name: 'mainMenu' })
@Assemblage()
export class MainMenuService extends AbstractMenuService implements AbstractAssemblage {
  private autoCenterAfterRandom = false;

  constructor(private readonly mainWindow: MainWindow) {
    super();
  }

  private async onMenuItemClicked(event: MenuItemClickedEvent): Promise<void> {
    switch (event.itemId) {
      case 'main.window.refreshBounds':
        await this.mainWindow.refreshBounds();
        break;
      case 'main.window.randomBounds':
        await this.mainWindow.randomBounds();
        if (this.autoCenterAfterRandom) {
          await this.mainWindow.centerWindow();
        }
        break;
      case 'main.window.centerWindow':
        await this.mainWindow.centerWindow();
        break;
      case 'main.menu.autoCenter': {
        const nextValue =
          typeof event.checked === 'boolean' ? event.checked : !this.autoCenterAfterRandom;
        this.autoCenterAfterRandom = nextValue;
        await this.setItemChecked('main.menu.autoCenter', nextValue);
        break;
      }
      default:
        break;
    }
  }

  @MenuOn('itemClicked')
  public onItemClickedEvent(event: MenuItemClickedEvent): void {
    void this.onMenuItemClicked(event);
  }
}
