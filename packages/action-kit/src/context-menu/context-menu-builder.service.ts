import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { CommandRegistry } from '@/command';
import { ShortcutManager } from '@/shortcut';
import type { MenuCommandRef, ResolvedMenuCommand } from './types';

/** Resolves menu items referencing registered Commands so a context menu stays in sync with shortcuts. */
@Assemblage()
export class ContextMenuBuilder implements AbstractAssemblage {
  constructor(
    private readonly commands: CommandRegistry,
    private readonly shortcuts: ShortcutManager,
  ) {}

  public resolveCommand(ref: MenuCommandRef): ResolvedMenuCommand {
    const command = this.commands.get(ref.command);
    const shortcut = this.shortcuts.findByCommand(ref.command, ref.scope);

    return {
      label: ref.label ?? command?.title ?? ref.command,
      accelerator: shortcut ? this.shortcuts.format(shortcut.accelerator) : undefined,
      disabled: ref.disabled ?? !command,
      execute: (...args: unknown[]) => void this.commands.execute(ref.command, ...args),
    };
  }
}
