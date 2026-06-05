import { useContext } from './useContext';
import { IpcModule } from '@features/ipc/renderer/ipc.module';

export const useIpc = (): IpcModule => {
  const context = useContext();
  const assemblage = context.require(IpcModule);
  return assemblage;
};
