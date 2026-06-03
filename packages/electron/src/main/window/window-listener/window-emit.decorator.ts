import type { WindowIpcChannel } from '@/universal/channels';
import {
  ElectronMetadataStorage,
  addWindowEmitMetadata,
  getWindowEmitMetadata,
  getWindowEmitMetadataForMethod,
} from '@/universal/metadata';

export const WindowEmitMethods = ElectronMetadataStorage.getKey('WindowEmit');

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
    addWindowEmitMetadata(target, propertyKey, event);
  } as MethodDecorator;
}

export function getWindowEmitEvent(
  target: object,
  method: string,
): string | undefined {
  return getWindowEmitMetadataForMethod(target, method)?.event;
}

export function getWindowEmitEvents(target: Function): WindowEmitMetadata[] {
  return getWindowEmitMetadata(target);
}
