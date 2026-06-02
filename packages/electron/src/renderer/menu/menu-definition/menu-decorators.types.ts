/**
 * @deprecated Backward compatibility token. Prefer metadata/runtime binders.
 */
export const MenuRendererSubMethods = '__legacy:menu-renderer-submethods__';

export type MenuRendererIpcType = 'on' | 'once';

export interface MenuRendererSubMethod {
  event: string;
  method: string;
  type: MenuRendererIpcType;
}
