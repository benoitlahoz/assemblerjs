import { inject } from 'vue';
import { AssemblerContext } from 'assemblerjs';
import { ContextInjectionKey } from '@renderer/common/keys';

export const useContext = (): AssemblerContext => {
  const context = inject(ContextInjectionKey);
  if (!context) {
    throw new Error('AssemblerContext could not be injected.');
  }
  return context;
};
