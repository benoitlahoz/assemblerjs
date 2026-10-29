export interface Shortcut<TMetadata = unknown> {
  id: string;
  accelerator: string;
  // id of the Command to execute.
  command: string;
  // If undefined, the shortcut is considered global.
  scope?: string;
  /** Fire even while a text field has focus. Off by default, so native editing keys (paste, undo,
   * select-all…) keep working as the user types. */
  allowInEditable?: boolean;
  metadata?: TMetadata;
}
