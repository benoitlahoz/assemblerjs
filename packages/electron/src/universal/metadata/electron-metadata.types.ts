export interface ElectronWindowDefinitionMetadata {
  name: string;
  multiple: boolean;
  router?: {
    file?: string;
    dev?: string;
    route?: string;
  };
  options: unknown;
}

export interface ElectronMenuDefinitionMetadata {
  window?: string;
  name: string;
}

export interface WindowUseMenuDefinitionMetadata {
  menu: unknown;
  layout?: unknown;
  state?: unknown;
}

export interface MenuItemLabelResolverContext {
  itemId: string;
  path: string;
  method: string;
  source?: object;
  target: Function;
  translate: (key: string) => string;
}

export type MenuItemLabelValue =
  | string
  | ((this: any, context?: MenuItemLabelResolverContext) => string | undefined);

export interface MenuItemMetadataEntry {
  method: string;
  id: string;
  path?: string;
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
}

export type RendererIpcSubscriptionType = 'on' | 'once';

export interface WindowRendererSubscriptionMetadata {
  method: string;
  event: string;
  type: RendererIpcSubscriptionType;
}

export interface MenuRendererSubscriptionMetadata {
  method: string;
  event: string;
  type: RendererIpcSubscriptionType;
}

export interface WindowMainSubscriptionMetadata {
  method: string;
  channel: string;
}
