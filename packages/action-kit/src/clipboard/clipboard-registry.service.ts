import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { ShortcutManager } from '@/shortcut';
import type { ClipboardCopy, ClipboardEntry } from './types';

/**
 * One clipboard slot per scope: pasting returns the last entry copied while
 * that scope was active (falls back to the currently active scope).
 */
@Assemblage()
export class ClipboardRegistry implements AbstractAssemblage {
  private entries = new Map<string, ClipboardEntry>();
  private readonly listeners = new Set<() => void>();

  constructor(private readonly shortcuts: ShortcutManager) {}

  public copy<T>(entry: ClipboardCopy<T>, scope?: string): void {
    const activeScope = scope ?? this.shortcuts.getScopes().at(-1);

    if (!activeScope) {
      return;
    }

    this.entries.set(activeScope, { ...entry, scope: activeScope, at: Date.now() });
    this.notify();
  }

  /** What every scope holds, the most recent first. */
  public list(): ClipboardEntry[] {
    return [...this.entries.values()].sort((a, b) => b.at - a.at);
  }

  /** Told after every copy and every clear; returns what stops it. */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  public paste<T>(scope?: string): ClipboardEntry<T> | undefined {
    const activeScope = scope ?? this.shortcuts.getScopes().at(-1);

    return activeScope ? (this.entries.get(activeScope) as ClipboardEntry<T> | undefined) : undefined;
  }

  public has(scope?: string): boolean {
    const activeScope = scope ?? this.shortcuts.getScopes().at(-1);

    return activeScope ? this.entries.has(activeScope) : false;
  }

  public clear(scope?: string): void {
    const activeScope = scope ?? this.shortcuts.getScopes().at(-1);

    if (activeScope && this.entries.delete(activeScope)) {
      this.notify();
    }
  }
}
