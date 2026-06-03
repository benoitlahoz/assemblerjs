import type { AbstractAssemblage } from 'assemblerjs';
import { MenuControllerService } from './menu-controller.service';

/**
 * Ready-to-extend menu controller base, aligned with the window controller pattern.
 */
export abstract class AbstractMenuController
  extends MenuControllerService
  implements AbstractAssemblage {}

/**
 * @deprecated Prefer AbstractMenuController instead.
 */
export abstract class MenuControllerSupport extends AbstractMenuController {}
