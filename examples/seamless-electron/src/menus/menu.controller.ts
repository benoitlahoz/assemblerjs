import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { BaseMenuController, MenuOrchestrator } from '@assemblerjs/electron';
import { AppMenu } from './app';
import { EditMenu } from './edit';
import { DeveloperToolsMenu } from './developer';
import { FileMenu } from './file';
import { GlobalMenu } from './global.menu';
import { WindowMenu } from './window';
import { RecentFilesMenu } from './file/recent-files.menu';

@MenuOrchestrator()
@Assemblage({
  provide: [
    [DeveloperToolsMenu],
    [AppMenu],
    [EditMenu],
    [RecentFilesMenu],
    [FileMenu],
    [GlobalMenu],
    [WindowMenu],
  ],
})
export class MenuController extends BaseMenuController implements AbstractAssemblage {}
