/**
 * Window-specific metadata types.
 */

export interface WindowDefinitionMetadata {
  name: string;
  multiple: boolean;
  router?: {
    file?: string;
    dev?: string;
    route?: string;
  };
  options: unknown;
}

export interface WindowRendererDefinitionMetadata {
  name: string;
}

export interface WindowUseMenuDefinitionMetadata {
  menu?: unknown;
  slots?: unknown;
  layout?: unknown;
  state?: unknown;
}

export type RendererIpcSubscriptionType = 'on' | 'once';

export interface WindowRendererSubscriptionMetadata {
  method: string;
  event: string;
  type: RendererIpcSubscriptionType;
}

export interface WindowMainSubscriptionMetadata {
  method: string;
  channel: string;
}
