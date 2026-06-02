/**
 * Legacy compatibility types kept for public API stability.
 * Runtime source of truth now lives in metadata storage.
 */
import { warnLegacyUsage } from '@/legacy/universal/deprecation';

warnLegacyUsage(
  'MenuRendererSubMethods',
  'ElectronMetadataStorage + MenuListener runtime binders',
);

export const MenuRendererSubMethodsLegacy =
  '__legacy:menu-renderer-submethods__';

export type MenuRendererIpcType = 'on' | 'once';

export interface MenuRendererSubMethod {
  event: string;
  type: MenuRendererIpcType;
}
