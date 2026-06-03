import { MenuController } from '@/main/menu/menu-controller/menu-controller.decorator';

/**
 * Compose main-process menu lifecycle decorator.
 */
export function MenuOrchestrator(): ClassDecorator {
  const menuController = MenuController();

  return (target: Function) => {
    const withMenuController =
      (menuController(target as any) as Function | void) || target;

    if (withMenuController !== target) {
      return withMenuController as any;
    }
  };
}
