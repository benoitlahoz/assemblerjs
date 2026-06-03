import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractMenuController, MenuOrchestrator } from '@assemblerjs/electron';
import { AppMenu } from './app';
import { AboutMenu } from './about.menu';
import { DeveloperToolsMenu } from './developer';
import { MainMenu } from './main.menu';
import { WindowMenu } from './window';

@MenuOrchestrator()
@Assemblage({
  provide: [[DeveloperToolsMenu], [AppMenu], [WindowMenu], [MainMenu], [AboutMenu]],
})
export class MenuControllerService extends AbstractMenuController implements AbstractAssemblage {}
