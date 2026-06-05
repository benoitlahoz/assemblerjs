import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractSystemStateService, SystemStateService } from '@assemblerjs/electron/renderer';

@Assemblage({
  provide: [[AbstractSystemStateService, SystemStateService]],
})
export class SystemStateModule implements AbstractAssemblage {
  constructor(public system: AbstractSystemStateService) {}
}
