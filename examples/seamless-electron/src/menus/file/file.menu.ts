import { Assemblage } from 'assemblerjs';
import { AbstractWindowController, ElectronWindow, MenuItem, SubMenu } from '@assemblerjs/electron';
import { MainWindowConfig } from '@windows/main/universal/window.config';
import { RecentFilesMenu } from './recent-files.menu';

export const FileMenuConfig = {
  NewWindow: { id: 'file.newWindow', order: 10 },
  OpenRecent: { order: 30 },
} as const;

@MenuItem('File')
@Assemblage()
export class FileMenu {
  constructor(
    public readonly windowsController: AbstractWindowController,
    private readonly recentFiles: RecentFilesMenu,
  ) {}

  @SubMenu({ order: FileMenuConfig.OpenRecent.order })
  private submenu(): RecentFilesMenu {
    return this.recentFiles;
  }

  @MenuItem({
    id: FileMenuConfig.NewWindow.id,
    label: 'New Window',
    accelerator: 'CmdOrCtrl+N',
    order: FileMenuConfig.NewWindow.order,
    handleInMain: true,
  })
  private async newWindow(
    _itemId: string,
    _windowName?: string,
    sourceWindow?: ElectronWindow,
  ): Promise<void> {
    const sourceBounds = sourceWindow?.isDestroyed() ? undefined : sourceWindow?.getBounds();
    const newWindow = await this.windowsController.openWindow(MainWindowConfig.name);

    if (sourceBounds) {
      newWindow.setPosition(sourceBounds.x + 32, sourceBounds.y + 32);
    } else {
      newWindow.center();
    }

    newWindow.show();
    newWindow.focus();
  }
}
