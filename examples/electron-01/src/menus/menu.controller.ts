import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { AbstractMenuController } from '@assemblerjs/electron';
import { AboutMenu } from './about.menu';
import { DeveloperToolsMenu } from './developer-tools.menu';
import { MainMenu } from './main.menu';

@Assemblage({
  provide: [[DeveloperToolsMenu], [MainMenu], [AboutMenu]],
})
export class MenuControllerService extends AbstractMenuController implements AbstractAssemblage {}
