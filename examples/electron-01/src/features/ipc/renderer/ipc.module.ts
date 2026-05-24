import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractIpcService, IpcService } from '@assemblerjs/electron/renderer';
import { DebugIpcGateway } from './services/debug-ipc.gateway';

@Assemblage({
  provide: [[AbstractIpcService, IpcService], [DebugIpcGateway]],
})
export class IpcModule implements AbstractAssemblage {
  constructor(
    public service: AbstractIpcService,
    public debug: DebugIpcGateway,
  ) {}
}
