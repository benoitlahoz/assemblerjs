import { AbstractAssemblage } from '../../../src';
import { AbstractEventManager } from '../../../src/events/event-manager.abstract';

export type AbstractEmitter = AbstractEventManager & AbstractAssemblage;

export abstract class AbstractEmitterAssemblage
  extends AbstractEventManager
  implements AbstractEmitter {}
