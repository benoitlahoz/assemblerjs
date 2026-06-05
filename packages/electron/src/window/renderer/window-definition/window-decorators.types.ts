/**
 * @deprecated Backward compatibility token. Prefer metadata/runtime binders.
 */
export const WindowRendererSubMethods = '__legacy:window-renderer-submethods__';

export type WindowRendererIpcType = 'on' | 'once';

export interface WindowRendererSubMethod {
  event: string;
  method: string;
  type: WindowRendererIpcType;
}
