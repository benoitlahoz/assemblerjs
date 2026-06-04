import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractMenuController, MenuOrchestrator } from '@assemblerjs/electron';
import { AppMenu } from './app';
import { EditMenu } from './edit';
import { DeveloperToolsMenu } from './developer';
import { WindowMenu } from './window';

@MenuOrchestrator()
@Assemblage({
  provide: [[DeveloperToolsMenu], [AppMenu], [EditMenu], [WindowMenu]],
})
export class MenuControllerService extends AbstractMenuController implements AbstractAssemblage {}
