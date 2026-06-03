import { getMenuItems } from '@/main/menu/menu-item/menu-item.decorator';
import { buildGroupHierarchy } from './hierarchy';
import { resolveTranslate } from './labels';
import { materializeGroup } from './materialize';
import { sortMenuItemsByOrdering } from './ordering';
import { resolveEntryPath } from './path';
import type {
  BuildBehaviorContext,
  BuildMenuTreeOptions,
  BuiltMenuTree,
  ElectronMenuItem,
} from './types';

export function buildMenuTreeFromMetadata(
  targetOrInstance: Function | object,
  options?: BuildMenuTreeOptions,
): BuiltMenuTree {
  const target =
    typeof targetOrInstance === 'function'
      ? targetOrInstance
      : targetOrInstance.constructor;
  const instance =
    typeof targetOrInstance === 'function'
      ? undefined
      : (targetOrInstance as Record<string, unknown>);

  const metadata = getMenuItems(targetOrInstance).map((entry, index) => {
    const sourceFromEntry = (entry as { source?: Record<string, unknown> })
      .source;

    return {
      ...entry,
      source: sourceFromEntry ?? instance,
      path: resolveEntryPath(entry, options?.pathFallback),
      declarationIndex: (options?.declarationIndexOffset || 0) + index,
    };
  });

  const behavior: BuildBehaviorContext = {
    instance,
    target,
    translate: resolveTranslate(instance, options),
  };

  if (metadata.length === 0) {
    return {
      roots: [],
      itemsById: new Map<string, ElectronMenuItem>(),
    };
  }

  const root = buildGroupHierarchy(metadata, behavior.translate);
  const itemsById = new Map<string, ElectronMenuItem>();

  const roots = sortMenuItemsByOrdering(
    [...root.childGroups.values()].map((group) =>
      materializeGroup(group, itemsById, behavior),
    ),
  );

  return {
    roots,
    itemsById,
  };
}
