import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu, SubMenu } from '@assemblerjs/electron';
import { AppMenu } from './app';
import { FileMenu } from './file';

@Menu({ name: 'globalMenu', global: true })
@Assemblage()
export class GlobalMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(
    public readonly appMenu: AppMenu,
    public readonly fileMenu: FileMenu,
  ) {
    super();
  }

  @SubMenu({ id: 'global.app', order: 10 })
  private app(): AppMenu {
    return this.appMenu;
  }

  @SubMenu({ id: 'global.file', order: 20 })
  private file(): FileMenu {
    return this.fileMenu;
  }
}
