import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { BaseMenuController, MenuOrchestrator } from '@assemblerjs/electron';
import { AppMenu } from './app';
import { EditMenu } from './edit';
import { DeveloperToolsMenu } from './developer';
import { WindowMenu } from './window';

@MenuOrchestrator()
@Assemblage({
  provide: [[DeveloperToolsMenu], [AppMenu], [EditMenu], [WindowMenu]],
})
export class MenuController extends BaseMenuController implements AbstractAssemblage {}
