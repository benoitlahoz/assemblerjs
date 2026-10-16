export interface ClipboardEntry<T = unknown> {
  scope: string;
  /** Lets a paste consumer filter/validate what it receives, e.g. "node" | "tex
t" | "color". */
  type?: string;
  /** What it is, for a person: « blur.fs », « 3 inputs ». */
  label?: string;
  /** Where it can be pasted, for a person: « Explorer ». */
  scopeLabel?: string;
  /** A cut leaves its source when pasted; a copy does not. */
  mode?: 'copy' | 'cut';
  /** When it was put there. */
  at: number;
  data: T;
}

/** What a copier gives: the scope and the time are the registry's. */
export type ClipboardCopy<T = unknown> = Omit<ClipboardEntry<T>, 'scope' | 'at'>;
