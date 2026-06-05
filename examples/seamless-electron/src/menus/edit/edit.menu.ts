import { Assemblage } from 'assemblerjs';
import { MenuItem } from '@assemblerjs/electron';
import { I18nService } from '@features/i18n/main';

export const EditMenuConfig = {
  Undo: { id: 'edit.undo', order: 10 },
  Redo: { id: 'edit.redo', order: 20 },
  SeparatorUndoClipboard: { id: 'edit.separator.undo-clipboard', order: 30 },
  Cut: { id: 'edit.cut', order: 40 },
  Copy: { id: 'edit.copy', order: 50 },
  Paste: { id: 'edit.paste', order: 60 },
  PasteAndMatchStyle: { id: 'edit.pasteAndMatchStyle', order: 70 },
  Delete: { id: 'edit.delete', order: 80 },
  SeparatorClipboardSelect: { id: 'edit.separator.clipboard-select', order: 90 },
  SelectAll: { id: 'edit.selectAll', order: 100 },
} as const;

@MenuItem('Edit')
@Assemblage()
export class EditMenu {
  constructor(public readonly i18n: I18nService) {}

  @MenuItem({
    id: EditMenuConfig.Undo.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.undo');
    },
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo',
    order: EditMenuConfig.Undo.order,
  })
  private undo(): void {}

  @MenuItem({
    id: EditMenuConfig.Redo.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.redo');
    },
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo',
    order: EditMenuConfig.Redo.order,
  })
  private redo(): void {}

  @MenuItem({
    id: EditMenuConfig.SeparatorUndoClipboard.id,
    type: 'separator',
    order: EditMenuConfig.SeparatorUndoClipboard.order,
  })
  private separatorUndoClipboard(): void {}

  @MenuItem({
    id: EditMenuConfig.Cut.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.cut');
    },
    accelerator: 'CmdOrCtrl+X',
    role: 'cut',
    order: EditMenuConfig.Cut.order,
  })
  private cut(): void {}

  @MenuItem({
    id: EditMenuConfig.Copy.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.copy');
    },
    accelerator: 'CmdOrCtrl+C',
    role: 'copy',
    order: EditMenuConfig.Copy.order,
  })
  private copy(): void {}

  @MenuItem({
    id: EditMenuConfig.Paste.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.paste');
    },
    accelerator: 'CmdOrCtrl+V',
    role: 'paste',
    order: EditMenuConfig.Paste.order,
  })
  private paste(): void {}

  @MenuItem({
    id: EditMenuConfig.PasteAndMatchStyle.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.pasteAndMatchStyle');
    },
    accelerator: 'Shift+CmdOrCtrl+V',
    role: 'pasteAndMatchStyle',
    order: EditMenuConfig.PasteAndMatchStyle.order,
  })
  private pasteAndMatchStyle(): void {}

  @MenuItem({
    id: EditMenuConfig.Delete.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.delete');
    },
    role: 'delete',
    order: EditMenuConfig.Delete.order,
  })
  private delete(): void {}

  @MenuItem({
    id: EditMenuConfig.SeparatorClipboardSelect.id,
    type: 'separator',
    order: EditMenuConfig.SeparatorClipboardSelect.order,
  })
  private separatorClipboardSelect(): void {}

  @MenuItem({
    id: EditMenuConfig.SelectAll.id,
    label(this: EditMenu) {
      return this.i18n.translate('menu.edit.selectAll');
    },
    accelerator: 'CmdOrCtrl+A',
    role: 'selectAll',
    order: EditMenuConfig.SelectAll.order,
  })
  private selectAll(): void {}
}
