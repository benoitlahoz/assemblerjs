import type {
  MenuItemLabelResolverContext,
  MenuItemMetadata,
} from '@/common/metadata';
import type { ElectronMenuItem } from '../../model/electron-menu-item';

export interface IndexedMenuItemMetadataEntry extends MenuItemMetadata {
  declarationIndex: number;
  source?: Record<string, unknown>;
  _submenuPath: string; // Generated hierarchy path
}

export interface GroupNode {
  pathKey: string;
  item: ElectronMenuItem;
  childGroups: Map<string, GroupNode>;
  leafEntries: IndexedMenuItemMetadataEntry[];
}

export interface BuiltMenuTree {
  roots: ElectronMenuItem[];
  itemsById: Map<string, ElectronMenuItem>;
}

export interface BuildMenuTreeOptions {
  translate?: (key: string) => string;
  declarationIndexOffset?: number;
}

export interface BuildBehaviorContext {
  instance?: Record<string, unknown>;
  target: Function;
  translate: (key: string) => string;
}

export interface OrderingKey {
  order: number;
  declarationIndex: number;
}

export interface MenuItemOrderingMetadata extends OrderingKey {
  stableId: string;
}

export type {
  MenuItemLabelResolverContext,
  MenuItemMetadata,
  ElectronMenuItem,
};
