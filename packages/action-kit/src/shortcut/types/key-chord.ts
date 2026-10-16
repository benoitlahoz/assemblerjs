export interface KeyModifiers {
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

export interface KeyChord {
  key: string;
  modifiers: KeyModifiers;
}

export type ShortcutModifier =
  | 'Command'
  | 'Cmd'
  | 'Control'
  | 'Ctrl'
  | 'CmdOrCtrl'
  | 'CommandOrControl'
  | 'Alt'
  | 'Option'
  | 'Shift';

export interface ParsedKeyChord {
  key: string;
  modifiers: ShortcutModifier[];
}
