import { composeDecorators } from '@assemblerjs/core';
// Direct import to avoid barrel circular dependencies
import { MenuController } from '../menu-controller/menu-controller.decorator';

/**
 * Compose main-process menu lifecycle decorator.
 */
export const MenuOrchestrator = (): ClassDecorator =>
  composeDecorators(MenuController());
