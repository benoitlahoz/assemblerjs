import type { WindowIpcChannel } from '@/universal/channels';
import { ElectronMetadata } from '@/universal/metadata';
import { buildMetadataKey } from '@assemblerjs/common';

export const WindowEmitMethods = buildMetadataKey(
  'electron:window',
  'WindowEmit',
);

export interface WindowEmitMetadata {
  method: string;
  event: string;
}

export function WindowEmit(event: WindowIpcChannel | string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    ElectronMetadata.window.addEmit(target, propertyKey, event);
  } as MethodDecorator;
}

export function getWindowEmitEvent(
  target: object,
  method: string,
): string | undefined {
  return ElectronMetadata.window.getEmitForMethod(target, method)?.event;
}

export function getWindowEmitEvents(target: Function): WindowEmitMetadata[] {
  return ElectronMetadata.window.getEmits(target);
}
