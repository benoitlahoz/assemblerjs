import { AppListener } from '@/main/app/app-listener.decorator';
import { MenuController } from '@/main/menu/decorators/menu-controller.decorator';
import { WindowController } from './window-controller.decorator';

/**
 * Compose main-process lifecycle decorators used by a window controller:
 * - app event listeners (@AppOn)
 * - menu registration/focus
 * - window registry + IPC commands
 */
export function WindowOrchestrator(): ClassDecorator {
  const windowController = WindowController();
  const menuController = MenuController();
  const appListener = AppListener();

  return (target: Function) => {
    const withWindowController =
      (windowController(target as any) as Function | void) || target;
    const withMenuController =
      (menuController(withWindowController as any) as Function | void) ||
      withWindowController;
    const withAppListener =
      (appListener(withMenuController as any) as Function | void) ||
      withMenuController;

    if (withAppListener !== target) {
      return withAppListener as any;
    }
  };
}
