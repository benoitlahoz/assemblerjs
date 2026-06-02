import { AbstractAssemblage, Assemblage, Context, type AssemblerContext } from 'assemblerjs';
import { HandleInMain, MenuContribution, MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { WindowControllerService } from '@windows/window.controller';
import { ABOUT_WINDOW_CONFIG } from '../universal/window.config';

@MenuContribution({
  target: 'mainMenu',
  path: 'App',
  priority: 10,
  states: [
    {
      itemId: 'menu.window',
      enabled: false,
      whenWindowFocused: ABOUT_WINDOW_CONFIG.name,
      priority: 10,
    },
  ],
})
@Assemblage()
export class AboutMenuContribution implements AbstractAssemblage {
  constructor(
    private readonly i18n: I18nService,
    @Context() private readonly context: AssemblerContext,
  ) {}

  @MenuItem({
    id: 'app.about',
    label(this: AboutMenuContribution) {
      return this.i18n.translate('menu.app.about');
    },
    order: 5,
  })
  @HandleInMain()
  private async openAboutWindow(): Promise<void> {
    const windows = this.context.require(WindowControllerService);
    const aboutWindow = await windows.openWindow(ABOUT_WINDOW_CONFIG.name);
    aboutWindow.center();
    aboutWindow.show();
    aboutWindow.focus();
  }
}
