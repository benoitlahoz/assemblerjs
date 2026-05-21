import type { ElectronWindow } from '../classes/electron-window';
import type { WindowControllerRegistry } from './window-controller.decorator';

export abstract class WindowControllerSupport {
  declare public listWindows: WindowControllerRegistry['listWindows'];
  declare public listWindowNames: WindowControllerRegistry['listWindowNames'];
  declare public listWindowChannels: WindowControllerRegistry['listWindowChannels'];
  declare public listManagedWindows: WindowControllerRegistry['listManagedWindows'];
  declare public openWindow: WindowControllerRegistry['openWindow'];
  declare public closeWindow: WindowControllerRegistry['closeWindow'];
  declare public closeAllWindows: WindowControllerRegistry['closeAllWindows'];
  declare public getWindow: WindowControllerRegistry['getWindow'];
  declare public hasWindow: WindowControllerRegistry['hasWindow'];
  declare public requireWindow: WindowControllerRegistry['requireWindow'];
  declare public getActiveWindowInstance?: (
    name: string,
  ) => ElectronWindow | undefined;
}
