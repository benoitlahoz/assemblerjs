import { AbstractWindowControllerService } from '@assemblerjs/electron/renderer';
import { useContext } from './useContext';

export const useWindows = (): AbstractWindowControllerService => {
  return useContext().require(AbstractWindowControllerService);
};
