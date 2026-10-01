import { Assemblage } from 'assemblerjs';
import { AbstractWindowController, MenuItem } from '@assemblerjs/electron';
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
  private async newWindow(): Promise<void> {
    await this.windowsController.openWindow(MainWindowConfig.name);
  }
}
