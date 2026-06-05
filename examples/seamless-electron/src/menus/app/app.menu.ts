import { Assemblage } from 'assemblerjs';
import { AbstractWindowController, MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';
import { AboutWindowConfig } from '@windows/about/universal/window.config';

const AppMenuConfig = {
  About: { id: 'app.about', order: 5 },
  SeparatorAboutServices: { id: 'app.separator.about-services', order: 10 },
  Services: { id: 'app.services', order: 20 },
  SeparatorServicesVisibility: { id: 'app.separator.services-visibility', order: 30 },
  Hide: { id: 'app.hide', order: 40 },
  HideOthers: { id: 'app.hideOthers', order: 50 },
  Unhide: { id: 'app.unhide', order: 60 },
  SeparatorVisibilityQuit: { id: 'app.separator.visibility-quit', order: 70 },
  Quit: { id: 'app.quit', order: 80 },
} as const;

@MenuItem('App')
@Assemblage()
export class AppMenu {
  constructor(
    public readonly i18n: I18nService,
    public readonly windowsController: AbstractWindowController,
  ) {}

  @MenuItem({
    id: AppMenuConfig.About.id,
    label(this: AppMenu) {
      return this.i18n.translate('menu.app.about');
    },
    order: AppMenuConfig.About.order,
    handleInMain: true,
  })
  private async openAboutWindow(): Promise<void> {
    const aboutWindow = await this.windowsController.openWindow(AboutWindowConfig.name);
    aboutWindow.center();
    aboutWindow.show();
    aboutWindow.focus();
  }

  @MenuItem({
    id: AppMenuConfig.SeparatorAboutServices.id,
    type: 'separator',
    order: AppMenuConfig.SeparatorAboutServices.order,
  })
  private separatorAboutServices(): void {}

  @MenuItem({
    id: AppMenuConfig.Services.id,
    role: 'services',
    order: AppMenuConfig.Services.order,
  })
  private services(): void {}

  @MenuItem({
    id: AppMenuConfig.SeparatorServicesVisibility.id,
    type: 'separator',
    order: AppMenuConfig.SeparatorServicesVisibility.order,
  })
  private separatorServicesVisibility(): void {}

  @MenuItem({
    id: AppMenuConfig.Hide.id,
    role: 'hide',
    order: AppMenuConfig.Hide.order,
  })
  private hide(): void {}

  @MenuItem({
    id: AppMenuConfig.HideOthers.id,
    role: 'hideOthers',
    order: AppMenuConfig.HideOthers.order,
  })
  private hideOthers(): void {}

  @MenuItem({
    id: AppMenuConfig.Unhide.id,
    role: 'unhide',
    order: AppMenuConfig.Unhide.order,
  })
  private unhide(): void {}

  @MenuItem({
    id: AppMenuConfig.SeparatorVisibilityQuit.id,
    type: 'separator',
    order: AppMenuConfig.SeparatorVisibilityQuit.order,
  })
  private separatorVisibilityQuit(): void {}

  @MenuItem({
    id: AppMenuConfig.Quit.id,
    role: 'quit',
    order: AppMenuConfig.Quit.order,
  })
  private quit(): void {}
}
