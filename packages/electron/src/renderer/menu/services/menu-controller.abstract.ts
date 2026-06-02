import { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import type {
  MenuItemClickedEvent,
  MenuItemState,
  MenuSnapshot,
} from '@/universal/types';

export abstract class AbstractMenuControllerService implements AbstractAssemblage {
  public abstract getSnapshot(
    windowName: string,
  ): Promise<MenuSnapshot | undefined>;

  public abstract setItemEnabled(
    windowName: string,
    itemId: string,
    enabled: boolean,
  ): Promise<boolean>;

  public abstract setItemChecked(
    windowName: string,
    itemId: string,
    checked: boolean,
  ): Promise<boolean>;

  public abstract snapshot(windowName: string): MenuSnapshot | undefined;

  public abstract onItemClicked(
    windowName: string,
    callback: (event: MenuItemClickedEvent) => void,
  ): () => void;

  public abstract onItemStateChanged(
    windowName: string,
    callback: (state: MenuItemState) => void,
  ): () => void;

  public abstract onTemplateChanged(
    windowName: string,
    callback: (menuName: string) => void,
  ): () => void;

  public abstract onDispose(
    context: AssemblerContext,
    configuration?: Record<string, any>,
  ): void | Promise<void>;
}
