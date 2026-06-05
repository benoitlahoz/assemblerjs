import type { AbstractAssemblage } from 'assemblerjs';
import type { ElectronWindow } from '../classes/electron-window';
import type { TypedWindowControllerRegistry } from './window-controller.types';

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
