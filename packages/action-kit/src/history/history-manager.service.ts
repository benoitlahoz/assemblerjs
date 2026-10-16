import type { HistoryEntry, HistoryEntryView, HistoryManagerOptions } from './types';

type Listener = () => void;

/**
 * Generic undo/redo history based on the command pattern.
 *
 * - registerUndoable(doFn, undoFn) : executes an action and registers how to undo it in one line
 * - push(entry)                    : registers an entry that has already been executed elsewhere
 *                                    (e.g. by `CommandRegistry.execute()`), without re-running it
 * - beginUndo() / endUndo()        : groups multiple actions into a single history entry
 *                                    (like beginUndo/endUndo in After Effects)
 * - merge()                        : merges consecutive entries (ex: keyboard input,
 *                                    continuous drag) to avoid stack explosion
 *
 * No state is ever stored: only business deltas (do/undo).
 */
export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners = new Set<Listener>();
  private transactionStack: HistoryEntry[][] = [];
  private maxSize: number;

  constructor(options: HistoryManagerOptions = {}) {
    this.maxSize = options.maxSize ?? 200;
  }

  // ---------------------------------------------------------------------
  // Simple API: a feature can register an action in one line.
  // ---------------------------------------------------------------------

  /**
   * Executes doFn immediately and registers how to undo it.
   *
   * @example
   * history.registerUndoable(
   *   () => items.push(newItem),
   *   () => items.pop(),
   *   { label: "Add item" }
   * );
   */
  public registerUndoable(
    doFn: () => void,
    undoFn: () => void,
    options?: { label?: string; merge?: HistoryEntry['merge'] },
  ): void {
    this.execute({
      execute: doFn,
      undo: undoFn,
      label: options?.label,
      merge: options?.merge,
    });
  }

  public execute(entry: HistoryEntry): void {
    entry.execute();
    this.record(entry);
  }

  /**
   * Registers an entry without (re-)running `entry.execute()`, for callers
   * that have already performed the action (e.g. `CommandRegistry.execute()`).
   */
  public push(entry: HistoryEntry): void {
    this.record(entry);
  }

  // ---------------------------------------------------------------------
  // Transaction API, After Effects-style beginUndo/endUndo.
  // Groups N entries into a single history entry.
  // ---------------------------------------------------------------------

  public beginUndo(): void {
    this.transactionStack.push([]);
  }

  /** Closes the open transaction and adds it as a single history entry. */
  public endUndo(label?: string): void {
    const entries = this.transactionStack.pop();
    if (!entries) {
      throw new Error('endUndo() called without a matching beginUndo()');
    }
    if (entries.length === 0) return; // Nothing happened, do not pollute the stack.
    const finalEntry = entries.length === 1 ? entries[0] : new CompositeHistoryEntry(entries, label);
    this.commit(finalEntry);
  }

  /**
   * Convenience wrapper: executes fn inside an automatic begin/end pair,
   * and cleanly rolls back if fn throws during execution.
   *
   * @example
   * history.transaction(() => {
   *   moveShape(shape, dx, dy);
   *   resizeCanvas(newBounds);
   * }, "Move & resize");
   */
  public transaction<T>(fn: () => T, label?: string): T {
    this.beginUndo();
    try {
      const result = fn();
      this.endUndo(label);
      return result;
    } catch (err) {
      const entries = this.transactionStack.pop() ?? [];
      for (let i = entries.length - 1; i >= 0; i--) entries[i].undo();
      throw err;
    }
  }

  // ---------------------------------------------------------------------
  // Undo / Redo
  // ---------------------------------------------------------------------

  public undo(): void {
    if (this.transactionStack.length > 0) {
      throw new Error('Cannot call undo() while a transaction is open');
    }
    const entry = this.undoStack.pop();
    if (!entry) return;
    entry.undo();
    this.redoStack.push(entry);
    this.notify();
  }

  public redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    entry.execute();
    this.undoStack.push(entry);
    this.notify();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** The history in order, oldest first: what was done, then what was undone, the next redo first. */
  public entries(): HistoryEntryView[] {
    return [
      ...this.undoStack.map(({ label }) => ({ label, undone: false })),
      ...[...this.redoStack].reverse().map(({ label }) => ({ label, undone: true })),
    ];
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  /** Changes how many entries are kept: a shorter depth drops the oldest ones now. */
  public setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    if (this.undoStack.length <= maxSize) return;

    this.undoStack.splice(0, this.undoStack.length - maxSize);
    this.notify();
  }

  /** Lets UI code bind undo/redo buttons to stack state. */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------

  private record(entry: HistoryEntry): void {
    if (this.transactionStack.length > 0) {
      // We are inside beginUndo/endUndo: accumulate without touching main stacks.
      this.transactionStack[this.transactionStack.length - 1].push(entry);
      return;
    }
    this.commit(entry);
  }

  private commit(entry: HistoryEntry): void {
    const last = this.undoStack[this.undoStack.length - 1];
    if (last?.merge) {
      const merged = last.merge(entry);
      if (merged) {
        this.undoStack[this.undoStack.length - 1] = merged;
        this.redoStack = [];
        this.notify();
        return;
      }
    }

    this.undoStack.push(entry);
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

class CompositeHistoryEntry implements HistoryEntry {
  constructor(
    private entries: HistoryEntry[],
    public label?: string,
  ) {}

  public execute(): void {
    for (const entry of this.entries) entry.execute();
  }

  public undo(): void {
    for (let i = this.entries.length - 1; i >= 0; i--) this.entries[i].undo();
  }
}
