import { SystemStateModule } from '@features/system/renderer/system-state.module';
import { useContext } from './useContext';

export const useSystem = (): SystemStateModule => {
  const context = useContext();
  const assemblage = context.require(SystemStateModule);
  return assemblage;
};
