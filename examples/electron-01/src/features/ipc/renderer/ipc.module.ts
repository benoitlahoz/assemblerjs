import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  AbstractIpcService,
  AbstractWindowRendererService,
  IpcService,
  WindowRendererService,
} from '@assemblerjs/electron/renderer';
import { DebugIpcGateway } from './services/debug-ipc.gateway';
import { MainWindowRendererService } from '@windows/main/renderer';

@Assemblage({
  provide: [
    [AbstractIpcService, IpcService],
    [AbstractWindowRendererService, WindowRendererService],
    [MainWindowRendererService],
    [DebugIpcGateway],
  ],
})
export class IpcModule implements AbstractAssemblage {
  constructor(
    public service: AbstractIpcService,
    public windows: AbstractWindowRendererService,
    public mainWindow: MainWindowRendererService,
    public debug: DebugIpcGateway,
  ) {}
}
