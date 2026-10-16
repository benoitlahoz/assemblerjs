import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { KeyChord, KeyModifiers, ParsedKeyChord } from '@/shortcut/types/key-chord';
import type { Platform } from '@/shortcut/types/platform';

@Assemblage()
export class ShortcutMatcher implements AbstractAssemblage {
  public matches(event: KeyboardEvent, chord: ParsedKeyChord, platform: Platform): boolean {
    const expected = this.resolve(chord, platform);

    return (
      this.normalizeKey(event.key) === this.normalizeKey(expected.key) &&
      event.ctrlKey === expected.modifiers.ctrl &&
      event.metaKey === expected.modifiers.meta &&
      event.altKey === expected.modifiers.alt &&
      event.shiftKey === expected.modifiers.shift
    );
  }

  private resolve(chord: ParsedKeyChord, platform: Platform): KeyChord {
    const modifiers: KeyModifiers = {
      ctrl: false,
      meta: false,
      alt: false,
      shift: false,
    };

    for (const modifier of chord.modifiers) {
      switch (modifier) {
        case 'Control':
        case 'Ctrl':
          modifiers.ctrl = true;
          break;

        case 'Command':
        case 'Cmd':
          modifiers.meta = true;
          break;

        case 'CmdOrCtrl':
        case 'CommandOrControl':
          if (platform === 'macos') {
            modifiers.meta = true;
          } else {
            modifiers.ctrl = true;
          }
          break;

        case 'Alt':
        case 'Option':
          modifiers.alt = true;
          break;

        case 'Shift':
          modifiers.shift = true;
          break;
      }
    }

    return {
      key: chord.key,
      modifiers,
    };
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase();
  }
}
