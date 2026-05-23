import type { AbstractAssemblage } from 'assemblerjs';
import type { ElectronWindow } from '../classes/electron-window';
import type {
  TypedWindowControllerRegistry,
  WindowControllerRegistry,
} from './window-controller.decorator';

export abstract class AbstractWindowController<
  Windows extends Record<string, ElectronWindow> = Record<
    string,
    ElectronWindow
  >,
>
  implements AbstractAssemblage, TypedWindowControllerRegistry<Windows>
{
  declare public listWindows: TypedWindowControllerRegistry<Windows>['listWindows'];
  declare public listWindowNames: TypedWindowControllerRegistry<Windows>['listWindowNames'];
  declare public listWindowChannels: TypedWindowControllerRegistry<Windows>['listWindowChannels'];
  declare public listManagedWindows: TypedWindowControllerRegistry<Windows>['listManagedWindows'];
  declare public openWindow: TypedWindowControllerRegistry<Windows>['openWindow'];
  declare public closeWindow: TypedWindowControllerRegistry<Windows>['closeWindow'];
  declare public closeAllWindows: TypedWindowControllerRegistry<Windows>['closeAllWindows'];
  declare public getWindow: TypedWindowControllerRegistry<Windows>['getWindow'];
  declare public hasWindow: TypedWindowControllerRegistry<Windows>['hasWindow'];
  declare public requireWindow: TypedWindowControllerRegistry<Windows>['requireWindow'];
}

/**
 * @deprecated Prefer AbstractWindowController instead.
 */
export abstract class WindowControllerSupport extends AbstractWindowController {
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
