import type {
  MenuItemLabelResolverContext,
  MenuItemMetadataEntry,
} from '@/universal/metadata/electron-metadata.types';
import type { ElectronMenuItem } from '../../model/electron-menu-item';

export interface IndexedMenuItemMetadataEntry extends MenuItemMetadataEntry {
  path: string;
  declarationIndex: number;
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
  pathFallback?: string;
  declarationIndexOffset?: number;
}

export interface BuildBehaviorContext {
  handleInMainMethods: Set<string>;
  forwardToRendererMethods: Set<string>;
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
  MenuItemMetadataEntry,
  ElectronMenuItem,
};
