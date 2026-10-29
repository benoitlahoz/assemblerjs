import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { ParsedKeyChord, ShortcutModifier } from '@/shortcut/types/key-chord';

const MODIFIERS = new Set<ShortcutModifier>([
  'Command',
  'Cmd',
  'Control',
  'Ctrl',
  'CmdOrCtrl',
  'CommandOrControl',
  'Alt',
  'Option',
  'Shift',
]);

@Assemblage()
export class ShortcutParser implements AbstractAssemblage {
  public parse(accelerator: string): ParsedKeyChord[] {
    if (!accelerator.trim()) {
      throw new Error('Shortcut accelerator cannot be empty');
    }

    return accelerator
      .trim()
      .split(/\s+/)
      .map((chord) => this.parseChord(chord));
  }

  private parseChord(chord: string): ParsedKeyChord {
    const parts = chord.split('+');

    if (!parts.length) {
      throw new Error(`Invalid shortcut: ${chord}`);
    }

    const key = parts.pop()!;

    if (!key) {
      throw new Error(`Missing key in shortcut: ${chord}`);
    }

    const modifiers = parts.map((modifier) => this.parseModifier(modifier));

    return {
      key,
      modifiers,
    };
  }

  private parseModifier(value: string): ShortcutModifier {
    const modifier = [...MODIFIERS].find((candidate) => candidate.toLowerCase() === value.toLowerCase());

    if (!modifier) {
      throw new Error(`Unknown shortcut modifier: ${value}`);
    }

    return modifier;
  }
}
