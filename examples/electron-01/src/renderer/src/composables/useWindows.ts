import { AbstractWindowRendererService } from '@assemblerjs/electron/renderer';
import { useContext } from './useContext';

export const useWindows = (): AbstractWindowRendererService => {
  return useContext().require(AbstractWindowRendererService);
};
