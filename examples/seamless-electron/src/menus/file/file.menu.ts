import { Assemblage } from 'assemblerjs';
import { AbstractWindowController, ElectronWindow, MenuItem } from '@assemblerjs/electron';
import { MainWindowConfig } from '@windows/main/universal/window.config';

export const FileMenuConfig = {
  NewWindow: { id: 'file.newWindow', order: 10 },
} as const;

@MenuItem('File')
@Assemblage()
export class FileMenu {
  constructor(public readonly windowsController: AbstractWindowController) {}

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
