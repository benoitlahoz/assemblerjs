import type { ElectronMenu } from './model/electron-menu';
import type { ElectronWindow } from '@/window/main/classes/electron-window';

export const MenuLifecycleEvent = {
  Registered: 'assemblerjs-electron:menu:registered',
} as const;

export interface MenuRegisteredEvent {
  menu: ElectronMenu;
  menuName: string;
  window?: ElectronWindow;
  windowName?: string;
  global: boolean;
}
