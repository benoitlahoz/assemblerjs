import type {
  BuildBehaviorContext,
  BuildMenuTreeOptions,
  IndexedMenuItemMetadataEntry,
  MenuItemLabelResolverContext,
} from './types';

export function resolveTranslate(
  _instance: Record<string, unknown> | undefined,
  options?: BuildMenuTreeOptions,
): (key: string) => string {
  if (typeof options?.translate === 'function') {
    return options.translate;
  }

  return (key: string) => key;
}

export function resolveLabel(
  entry: IndexedMenuItemMetadataEntry,
  behavior: BuildBehaviorContext,
): string | undefined {
  if (typeof entry.label === 'string') {
    return entry.label;
  }

  if (typeof entry.label === 'function') {
    const context: MenuItemLabelResolverContext = {
      itemId: entry.id,
      path: entry.path,
      method: entry.method,
      source: behavior.instance,
      target: behavior.target,
      translate: behavior.translate,
    };

    return entry.label.call(behavior.instance, context);
  }

  return undefined;
}
