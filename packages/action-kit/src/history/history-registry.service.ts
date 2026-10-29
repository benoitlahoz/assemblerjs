import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { HistoryManager } from './history-manager.service';

/**
 * Multi-scope registry: an independent undo/redo history per scope
 * (e.g. a document, a tab, an editor — like in VS Code).
 *
 * The global keyboard shortcut calls registry.undo() without knowing which
 * document is active; the registry routes to the correct HistoryManager via
 * setActiveScope().
 *
 * @example
 * // when a tab becomes active
 * history.setActiveScope(documentId);
 *
 * // a feature always records in the target document scope,
 * // not necessarily the active scope (useful for actions triggered
 * // in the background on another document)
 * history.getManager(documentId).registerUndoable(doFn, undoFn);
 *
 * // global Ctrl+Z shortcut
 * history.undo(); // acts on the active scope
 */
@Assemblage()
export class HistoryRegistry implements AbstractAssemblage {
  private managers = new Map<string, HistoryManager>();
  private activeScope: string | null = null;
  /** The depth of every history, those to come included; the manager's own default until it is set. */
  private maxSize: number | undefined;

  /** Gets (or creates) the HistoryManager for a given scope. */
  public getManager(scopeId: string): HistoryManager {
    let manager = this.managers.get(scopeId);
    if (!manager) {
      manager = new HistoryManager({ maxSize: this.maxSize });
      this.managers.set(scopeId, manager);
    }
    return manager;
  }

  /** Sets how many entries each history keeps, for the existing ones and the ones to come. */
  public setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    for (const manager of this.managers.values()) manager.setMaxSize(maxSize);
  }

  /** Gets the HistoryManager of the active scope, if any (lazily created, like `getManager`). */
  public getActiveManager(): HistoryManager | undefined {
    return this.activeScope ? this.getManager(this.activeScope) : undefined;
  }

  public setActiveScope(scopeId: string | null): void {
    this.activeScope = scopeId;
  }

  public getActiveScope(): string | null {
    return this.activeScope;
  }

  public disposeScope(scopeId: string): void {
    this.managers.delete(scopeId);
    if (this.activeScope === scopeId) {
      this.activeScope = null;
    }
  }

  /** Undo on the given scope, or on the active scope when omitted. */
  public undo(scopeId?: string): void {
    const id = scopeId ?? this.activeScope;
    if (id == null) return;
    this.managers.get(id)?.undo();
  }

  public redo(scopeId?: string): void {
    const id = scopeId ?? this.activeScope;
    if (id == null) return;
    this.managers.get(id)?.redo();
  }

  public canUndo(scopeId?: string): boolean {
    const id = scopeId ?? this.activeScope;
    if (id == null) return false;
    return this.managers.get(id)?.canUndo() ?? false;
  }

  public canRedo(scopeId?: string): boolean {
    const id = scopeId ?? this.activeScope;
    if (id == null) return false;
    return this.managers.get(id)?.canRedo() ?? false;
  }
}
