import { composeDecorators } from '@assemblerjs/core';
import { AppListener } from '@/app/main/app-listener.decorator';
// Direct import to avoid barrel circular dependencies
import { MenuController } from '../menu-controller/menu-controller.decorator';

/**
 * Compose main-process menu lifecycle decorator.
 */
export const MenuOrchestrator = (): ClassDecorator =>
  composeDecorators(MenuController(), AppListener());
