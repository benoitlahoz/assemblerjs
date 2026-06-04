import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractMenuController, MenuOrchestrator } from '@assemblerjs/electron';
import { AppMenu } from './app';
import { DeveloperToolsMenu } from './developer';
import { WindowMenu } from './window';

@MenuOrchestrator()
@Assemblage({
  provide: [[DeveloperToolsMenu], [AppMenu], [WindowMenu]],
})
export class MenuControllerService extends AbstractMenuController implements AbstractAssemblage {}
