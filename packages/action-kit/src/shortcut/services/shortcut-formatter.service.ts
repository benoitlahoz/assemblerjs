import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import type { Platform } from '@/shortcut/types/platform';
import { getPlatform } from '@/shortcut/types/platform';

@Assemblage()
export class ShortcutFormatter implements AbstractAssemblage {
  public format(accelerator: string, platform: Platform = getPlatform()): string {
    const chords = accelerator.split(/\s+/);

    return chords.map((chord) => this.formatChord(chord, platform)).join(' ');
  }

  private formatChord(chord: string, platform: Platform): string {
    return chord
      .split('+')
      .map((part) => this.formatPart(part, platform))
      .join(platform === 'macos' ? '' : '+');
  }

  private formatPart(part: string, platform: Platform): string {
    switch (part.toLowerCase()) {
      case 'cmd':
      case 'command':
        return platform === 'macos' ? '⌘' : 'Command';

      case 'cmdorctrl':
      case 'commandorcontrol':
        return platform === 'macos' ? '⌘' : 'Ctrl';

      case 'ctrl':
      case 'control':
        return platform === 'macos' ? '⌃' : 'Ctrl';

      case 'alt':
      case 'option':
        return platform === 'macos' ? '⌥' : 'Alt';

      case 'shift':
        return platform === 'macos' ? '⇧' : 'Shift';

      case 'enter':
        return platform === 'macos' ? '↵' : 'Enter';

      case 'escape':
      case 'esc':
        return 'Esc';

      case 'backspace':
        return platform === 'macos' ? '⌫' : 'Backspace';

      case 'delete':
        return platform === 'macos' ? '⌦' : 'Delete';

      case 'arrowup':
        return platform === 'macos' ? '↑' : 'Up';

      case 'arrowdown':
        return platform === 'macos' ? '↓' : 'Down';

      case 'arrowleft':
        return platform === 'macos' ? '←' : 'Left';

      case 'arrowright':
        return platform === 'macos' ? '→' : 'Right';

      case 'space':
        return platform === 'macos' ? 'Space' : 'Space';

      default:
        return part;
    }
  }
}
