/**
 * Legacy compatibility types kept for public API stability.
 * Runtime source of truth now lives in metadata storage.
 */
import { warnLegacyUsage } from '@/legacy/universal/deprecation';

warnLegacyUsage(
  'WindowRendererSubMethods',
  'ElectronMetadataStorage + WindowListener runtime binders',
);

export const WindowRendererSubMethodsLegacy =
  '__legacy:window-renderer-submethods__';

export type WindowRendererIpcType = 'on' | 'once';

export interface WindowRendererSubMethod {
  event: string;
  type: WindowRendererIpcType;
}
