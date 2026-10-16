export interface HistoryEntry {
  execute(): void;
  undo(): void;
  label?: string;
  /**
   * If defined, called when this entry is at the top of the stack and a
   * new entry arrives. Returns a merged entry to replace both, or null to skip merging.
   */
  merge?(next: HistoryEntry): HistoryEntry | null;
}

/** What a panel shows of one entry: its label, and whether it was undone (and can be redone). */
export interface HistoryEntryView {
  label?: string;
  undone: boolean;
}

export interface HistoryManagerOptions {
  /** Maximum number of entries in the undo stack (prevents memory leaks during long sessions). */
  maxSize?: number;
}
