export {
  Assemblage,
  decorateAssemblage,
  isAssemblage,
  getAssemblageDefinition,
  getAssemblageContext,
} from './features/assemblage';
export { Assembler } from './features/assembler';
export { ListenerCollection, EventManager } from './features/events';

export * from './shared/decorators';

export { AbstractAssemblage } from './features/assemblage';
export { AbstractAssembler } from './features/assembler';
export { AbstractListenerCollection, AbstractEventManager } from './features/events';

export {
  Aspect,
  Before,
  After,
  Around,
  ApplyAspect,
  AspectManager,
} from './features/aspects';
export { AbstractAspect } from './features/aspects';

export type { Identifier } from './shared/common';
export type { AssemblerContext, AssemblerDispose } from './features/assembler';
export type { AssemblageDefinition } from './features/assemblage';
export type { Listener, EventChannel, EventChannelList } from './features/events';
export type { AdviceType, JoinPoint, AdviceContext, Advice, AspectMetadata, AppliedAspectConfig } from './features/aspects';
