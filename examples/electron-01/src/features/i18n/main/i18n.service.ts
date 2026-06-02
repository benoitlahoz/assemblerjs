import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@Assemblage()
export class I18nService implements AbstractAssemblage {
  private readonly dictionary: Record<string, string> = {
    'menu.group.app': 'App',
    'menu.group.window': 'Window',
    'menu.group.developer': 'Developer',
    'menu.group.refresh': 'Refresh',
    'menu.app.about': 'About',
    'menu.window.refreshBounds': 'Refresh Bounds',
    'menu.window.randomBounds': 'Random Bounds',
    'menu.window.centerWindow': 'Center Window',
    'menu.window.autoCenter': 'Auto-center after random',
    'menu.app.quit': 'Quit',
  };

  public translate(key: string): string {
    return this.dictionary[key] || key;
  }
}
