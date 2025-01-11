import { AbstractAssemblage, AbstractEventManager } from '../../../src';

export type AbstractEmitter = AbstractEventManager & AbstractAssemblage;
export abstract class AbstractEmitterAssemblage extends AbstractEventManager {}
