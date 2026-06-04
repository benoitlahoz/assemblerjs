import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractMenuService, Menu, MenuOn } from '@assemblerjs/electron/renderer';
import type { MenuItemClickedEvent } from '@assemblerjs/electron/renderer';
import { ref } from 'vue';
import { MainWindow } from './main.window';

@Menu({ name: 'mainMenu' })
@Assemblage()
export class MainMenuService extends AbstractMenuService implements AbstractAssemblage {
  public readonly autoCenterAfterRandom = ref(false);

  constructor(private readonly mainWindow: MainWindow) {
    super();
  }

  public async toggleAutoCenter(): Promise<void> {
    const nextValue = !this.autoCenterAfterRandom.value;
    this.autoCenterAfterRandom.value = nextValue;
    await this.setItemChecked('window.bounds.autoCenter', nextValue);
  }

  private async onMenuItemClicked(event: MenuItemClickedEvent): Promise<void> {
    switch (event.itemId) {
      case 'window.bounds.refreshBounds':
        await this.mainWindow.refreshBounds();
        break;
      case 'window.bounds.randomBounds':
        await this.mainWindow.randomBounds();
        if (this.autoCenterAfterRandom.value) {
          await this.mainWindow.centerWindow();
        }
        break;
      case 'window.bounds.centerWindow':
        await this.mainWindow.centerWindow();
        break;
      case 'window.bounds.autoCenter': {
        // When menu item is clicked, Electron already toggled the checked state
        // We need to sync our local state with the menu's new state
        const snapshot = await this.getSnapshot();
        const menuItemState = snapshot?.items['window.bounds.autoCenter'];
        if (menuItemState && typeof menuItemState.checked === 'boolean') {
          this.autoCenterAfterRandom.value = menuItemState.checked;
        } else {
          // Fallback to toggle
          await this.toggleAutoCenter();
        }
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
