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
  menu?: unknown;
  slots?: unknown;
  layout?: unknown;
  state?: unknown;
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

export interface MenuItemMetadataEntry {
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
