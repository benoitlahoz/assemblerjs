/** References a registered `Command` to resolve a menu item's label/execute/accelerator from. */
export interface MenuCommandRef {
  /** Id of the command registered in `CommandRegistry`. */
  command: string;
  /** Restricts the accelerator lookup to shortcuts registered under this scope. */
  scope?: string;
  /** Overrides the command's `title`. */
  label?: string;
  /** Overrides the automatic disabled resolution (defaults to `true` when the command isn't registered). */
  disabled?: boolean;
}

/** A `MenuCommandRef` resolved into data ready to render (label/accelerator/disabled/execute). */
export interface ResolvedMenuCommand {
  label: string;
  /** Already formatted for display (e.g. "⌘C"), absent if no shortcut is bound. */
  accelerator?: string;
  disabled: boolean;
  execute: (...args: unknown[]) => void;
}
