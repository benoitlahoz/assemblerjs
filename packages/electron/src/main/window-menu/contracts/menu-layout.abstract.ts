import type { Identifier } from 'assemblerjs';
import type { ElectronMenuItem } from '@/main/menu';

export interface MenuLayoutContext {
  windowName: string;
  menuName?: string;
}

export abstract class AbstractMenuLayout {
  public abstract resolveRootIds(
    roots: ReadonlyArray<ElectronMenuItem>,
    context: MenuLayoutContext,
  ): string[];
}

export type MenuLayoutToken = Identifier<AbstractMenuLayout>;
