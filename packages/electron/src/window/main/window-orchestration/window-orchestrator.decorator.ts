import { composeDecorators } from '@assemblerjs/core';
// Direct imports to avoid barrel circular dependencies
import { AppListener } from '@/app/main/app-listener.decorator';
import { MenuController } from '@/menu/main/menu-controller/menu-controller.decorator';
import { WindowController } from '../window-controller/window-controller.decorator';

/**
 * Compose main-process lifecycle decorators used by a window controller:
 * - app event listeners (@AppOn)
 * - menu registration/focus
 * - window registry + IPC commands
 */
export const WindowOrchestrator = (): ClassDecorator =>
  composeDecorators(WindowController(), MenuController(), AppListener());
