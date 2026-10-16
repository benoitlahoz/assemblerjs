import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import { CommandRegistry } from './command';
import { ShortcutManager } from './shortcut';
import { HistoryRegistry } from './history';
import { ClipboardRegistry } from './clipboard';
import { ContextMenuBuilder } from './context-menu';

export * from './clipboard';

/** True while focus is in a text-editing widget — skip global undo/redo so native text undo isn't hijacked. */
function isEditableTarget(): boolean {
  const target = document.activeElement;
  return (
    target instanceof HTMLElement && Boolean(target.closest('input, textarea, [contenteditable="true"], .cm-editor'))
  );
}

@Assemblage({
  provide: [[HistoryRegistry], [CommandRegistry], [ShortcutManager], [ClipboardRegistry], [ContextMenuBuilder]],
})
export class ActionKit implements AbstractAssemblage {
  constructor(
    public commands: CommandRegistry,
    public shortcuts: ShortcutManager,
    public history: HistoryRegistry,
    public clipboard: ClipboardRegistry,
    public menus: ContextMenuBuilder,
  ) {}

  public onInit(): void {
    this.shortcuts.attach();
    this.shortcuts.onExecute((shortcut) => this.commands.execute(shortcut.command));

    // Global Ctrl/Cmd+Z / +Shift+Z, routed through the active HistoryRegistry context — see
    // `HistoryRegistry`'s doc comment, which documents this as the intended usage but nothing
    // previously wired the keyboard shortcut to it.
    this.commands.register({
      id: 'history.undo',
      title: 'Undo',
      execute: () => {
        if (!isEditableTarget()) this.history.undo();
      },
    });
    this.commands.register({
      id: 'history.redo',
      title: 'Redo',
      execute: () => {
        if (!isEditableTarget()) this.history.redo();
      },
    });
    this.shortcuts.register({ id: 'history.undo.shortcut', accelerator: 'CmdOrCtrl+Z', command: 'history.undo' });
    this.shortcuts.register({
      id: 'history.redo.shortcut',
      accelerator: 'CmdOrCtrl+Shift+Z',
      command: 'history.redo',
    });
  }
}
