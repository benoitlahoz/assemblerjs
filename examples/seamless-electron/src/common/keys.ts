import { AssemblerContext } from 'assemblerjs';
import { InjectionKey } from 'vue';

export const ContextInjectionKey: InjectionKey<AssemblerContext> = Symbol('AppContext');
