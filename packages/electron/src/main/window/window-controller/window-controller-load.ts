import { getAssemblageContext } from 'assemblerjs';
import {
  loadWindowContent,
  type WindowContentTarget,
} from '@/main/window/load-window-content';
import type {
  ManagedWindowDefinition,
  WindowRuntimeHandle,
} from './window-controller.types';

export function isWindowContentTarget(
  instance: WindowRuntimeHandle,
): instance is WindowRuntimeHandle & WindowContentTarget {
  return (
    typeof instance.loadURL === 'function' &&
    typeof instance.loadFile === 'function'
  );
}

function looksLikeLiteralPathOrUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.includes('/') ||
    value.includes('\\') ||
    value.endsWith('.html')
  );
}

function resolveRouterValue(
  context: ReturnType<typeof getAssemblageContext>,
  value?: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const fromGlobal = context.global(value);
  if (typeof fromGlobal === 'string' && fromGlobal.length > 0) {
    return fromGlobal;
  }

  if (looksLikeLiteralPathOrUrl(value)) {
    return value;
  }

  return undefined;
}

export async function loadManagedWindowContent(
  context: ReturnType<typeof getAssemblageContext>,
  managed: ManagedWindowDefinition,
  instance: WindowRuntimeHandle,
): Promise<void> {
  const router = managed.definition.router;
  if (!router) {
    return;
  }

  const file = resolveRouterValue(context, router.file);
  if (!file) {
    throw new Error(
      `Missing router file for window '${managed.definition.name}'. Define router.file as a global key or literal file path.`,
    );
  }

  const devUrl = resolveRouterValue(context, router.dev);

  if (!isWindowContentTarget(instance)) {
    throw new Error(
      `Window '${managed.definition.name}' does not implement loadURL/loadFile required for router-based content loading.`,
    );
  }

  await loadWindowContent(instance, {
    devUrl,
    file,
    route: router.route,
  });
}
