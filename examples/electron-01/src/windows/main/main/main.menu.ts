import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ElectronMenu, Menu } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { MAIN_WINDOW_CONFIG } from '../universal/window.config';
import { MainAppMenuFragment, MainWindowMenuFragment } from './fragments';

@Menu({
  window: MAIN_WINDOW_CONFIG.name,
  name: 'mainMenu',
  fragments: [MainAppMenuFragment, MainWindowMenuFragment],
})
@Assemblage({
  provide: [[MainWindowMenuFragment], [MainAppMenuFragment]],
})
export class MainMenu extends ElectronMenu implements AbstractAssemblage {
  constructor(public readonly i18n: I18nService) {
    super();
  }
}
