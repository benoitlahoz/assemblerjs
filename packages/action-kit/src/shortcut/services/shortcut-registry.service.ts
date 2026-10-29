import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { Shortcut } from '@/shortcut/types/shortcut';

@Assemblage()
export class ShortcutRegistry implements AbstractAssemblage {
  private shortcuts = new Map<string, Shortcut>();

  public register(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  public unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  public get(id: string): Shortcut | undefined {
    return this.shortcuts.get(id);
  }

  public has(id: string): boolean {
    return this.shortcuts.has(id);
  }

  public getAll(): Shortcut[] {
    return [...this.shortcuts.values()];
  }

  public getByScope(scope: string): Shortcut[] {
    return [...this.shortcuts.values()].filter((shortcut) => shortcut.scope === scope);
  }

  public clear(): void {
    this.shortcuts.clear();
  }
}
