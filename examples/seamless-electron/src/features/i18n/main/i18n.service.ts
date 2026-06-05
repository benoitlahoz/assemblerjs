import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@Assemblage()
export class I18nService implements AbstractAssemblage {
  private readonly dictionary: Record<string, string> = {
    'menu.group.app': 'App',
    'menu.group.edit': 'Edit',
    'menu.group.window': 'Window',
    'menu.group.developer': 'Developer',
    'menu.group.reload': 'Reload',
    'menu.app.about': 'About',
    'menu.edit.undo': 'Undo',
    'menu.edit.redo': 'Redo',
    'menu.edit.cut': 'Cut',
    'menu.edit.copy': 'Copy',
    'menu.edit.paste': 'Paste',
    'menu.edit.pasteAndMatchStyle': 'Paste and Match Style',
    'menu.edit.delete': 'Delete',
    'menu.edit.selectAll': 'Select All',
    'menu.window.refreshBounds': 'Refresh Bounds',
    'menu.window.randomBounds': 'Random Bounds',
    'menu.window.centerWindow': 'Center Window',
    'menu.window.autoCenter': 'Auto-center after random',
    'menu.developer.toggleDevTools': 'Toggle Developer Tools',
    'menu.app.quit': 'Quit',
  };

  public translate(key: string): string {
    return this.dictionary[key] || key;
  }
}
