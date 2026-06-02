/**
 * Legacy compatibility symbol placeholder.
 * New implementations use metadata storage and runtime binders.
 */
import { warnLegacyUsage } from '@/legacy/universal/deprecation';

warnLegacyUsage(
  'WindowSubMethods',
  'ElectronMetadataStorage + bindMainEventListeners runtime binder',
);

export const WindowSubMethodsLegacy = '__legacy:window-main-submethods__';
