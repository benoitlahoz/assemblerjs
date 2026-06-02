import {
  getMenuContributionDefinitionMetadata,
  setMenuContributionDefinitionMetadata,
} from '@/universal/metadata';

export interface MenuContributionDefinition {
  target: string;
  priority?: number;
  path?: string;
  states?: MenuContributionStateDefinition[];
}

export interface MenuContributionStateDefinition {
  itemId: string;
  priority?: number;
  enabled?: boolean;
  checked?: boolean;
  whenWindowFocused?: string;
}

export interface NormalizedMenuContributionDefinition {
  target: string;
  priority: number;
  path?: string;
  states?: NormalizedMenuContributionStateDefinition[];
}

export interface NormalizedMenuContributionStateDefinition {
  itemId: string;
  priority: number;
  enabled?: boolean;
  checked?: boolean;
  whenWindowFocused?: string;
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`@MenuContribution requires a non-empty '${field}'.`);
  }

  return value.trim();
}

function normalizePath(path: string): string {
  const normalized = path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');

  if (normalized.length === 0) {
    throw new Error("@MenuContribution requires a valid non-empty 'path'.");
  }

  return normalized;
}

function normalizeStateDefinition(
  definition: MenuContributionStateDefinition,
): NormalizedMenuContributionStateDefinition {
  if (
    typeof definition.enabled !== 'boolean' &&
    typeof definition.checked !== 'boolean'
  ) {
    throw new Error(
      '@MenuContribution state requires at least one state field among enabled/checked.',
    );
  }

  return {
    itemId: assertNonEmptyString(definition.itemId, 'itemId'),
    priority: typeof definition.priority === 'number' ? definition.priority : 0,
    enabled: definition.enabled,
    checked: definition.checked,
    whenWindowFocused:
      typeof definition.whenWindowFocused === 'string'
        ? assertNonEmptyString(
            definition.whenWindowFocused,
            'whenWindowFocused',
          )
        : undefined,
  };
}

export function normalizeMenuContributionDefinition(
  definition: MenuContributionDefinition,
): NormalizedMenuContributionDefinition {
  return {
    target: assertNonEmptyString(definition.target, 'target'),
    priority: typeof definition.priority === 'number' ? definition.priority : 0,
    path:
      typeof definition.path === 'string'
        ? normalizePath(definition.path)
        : undefined,
    states: definition.states?.map((state) => normalizeStateDefinition(state)),
  };
}

export function MenuContribution(
  definition: MenuContributionDefinition,
): ClassDecorator {
  return (target: Function) => {
    setMenuContributionDefinitionMetadata(
      target,
      normalizeMenuContributionDefinition(definition),
    );
  };
}

export function getMenuContributionDefinition(
  target: Function,
): NormalizedMenuContributionDefinition | undefined {
  return getMenuContributionDefinitionMetadata(target) as
    | NormalizedMenuContributionDefinition
    | undefined;
}
