/**
 * Menu-specific metadata types.
 */

import type { RendererIpcSubscriptionType } from './window.types';

// Re-export shared type
export type { RendererIpcSubscriptionType };

export interface MenuDefinitionMetadata {
  window?: string;
  name: string;
}

export interface MenuRendererDefinitionMetadata {
  window?: string;
  name: string;
}

export interface MenuItemLabelResolverContext {
  itemId: string;
  method: string;
  source?: object;
  target: Function;
  translate: (key: string) => string;
}

export type MenuItemLabelValue =
  | string
  | ((this: any, context?: MenuItemLabelResolverContext) => string | undefined);

export interface MenuItemMetadata {
  method: string;
  id: string;
  label?: MenuItemLabelValue;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  role?: string;
  accelerator?: string;
  order?: number;
  before?: string;
  after?: string;
  handleInMain?: boolean;
  forwardToRenderer?: boolean;
  _submenuPath?: string; // Internal: generated from @MenuItem class labels and @SubMenu hierarchy
}

export interface MenuRendererSubscriptionMetadata {
  method: string;
  event: string;
  type: RendererIpcSubscriptionType;
}
