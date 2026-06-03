import type { Identifier } from 'assemblerjs';
import type { ElectronMenuItem } from '@/main/menu';

export interface MenuStatePatch {
  id: string;
  enabled?: boolean;
  checked?: boolean;
  visible?: boolean;
}

export interface MenuStatePolicyContext {
  windowName: string;
  menuName?: string;
  focusedWindowName?: string;
  data?: Readonly<Record<string, unknown>>;
}

export abstract class AbstractMenuStatePolicy {
  public abstract resolvePatches(
    roots: ReadonlyArray<ElectronMenuItem>,
    context: MenuStatePolicyContext,
  ): MenuStatePatch[];
}

export type MenuStatePolicyToken = Identifier<AbstractMenuStatePolicy>;
