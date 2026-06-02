import {
  getMenuFragmentDefinitionMetadata,
  setMenuFragmentDefinitionMetadata,
} from '@/universal/metadata';

export interface MenuFragmentDefinition {
  path?: string;
}

function normalizeFragmentPath(path: string): string {
  const normalized = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');

  if (normalized.length === 0) {
    throw new Error("@MenuFragment requires a valid non-empty 'path'.");
  }

  return normalized;
}

/**
 * Marks an assemblage as a menu fragment that can contribute
 * @MenuItem definitions to a root @Menu via DI provide/inject.
 */
export function MenuFragment(
  definition?: MenuFragmentDefinition,
): ClassDecorator {
  return (target: Function) => {
    setMenuFragmentDefinitionMetadata(target, {
      enabled: true,
      path:
        typeof definition?.path === 'string'
          ? normalizeFragmentPath(definition.path)
          : undefined,
    });
  };
}

export function isMenuFragment(target: Function): boolean {
  const metadata = getMenuFragmentDefinitionMetadata(target);
  return metadata?.enabled === true;
}
