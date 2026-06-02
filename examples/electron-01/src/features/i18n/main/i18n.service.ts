import { AbstractAssemblage, Assemblage } from 'assemblerjs';

@Assemblage()
export class I18nService implements AbstractAssemblage {
  private readonly dictionary: Record<string, string> = {
    'menu.group.app': 'Application',
    'menu.group.window': 'Fenetre',
    'menu.group.developer': 'Developpeur',
    'menu.group.refresh': 'Rafraichir',
    'menu.window.refreshBounds': 'Rafraichir les dimensions',
    'menu.window.randomBounds': 'Dimensions aleatoires',
    'menu.window.centerWindow': 'Centrer la fenetre',
    'menu.window.autoCenter': 'Auto-centrer apres aleatoire',
    'menu.app.quit': 'Quitter',
  };

  public translate(key: string): string {
    return this.dictionary[key] || key;
  }
}
