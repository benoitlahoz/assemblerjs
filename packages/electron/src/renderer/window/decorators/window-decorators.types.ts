export const WindowRendererSubMethods = Symbol('__WindowRendererSubMethods__');

export type WindowRendererIpcType = 'on' | 'once';

export interface WindowRendererSubMethod {
  event: string;
  type: WindowRendererIpcType;
}
