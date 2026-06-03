import {
  ElectronMetadataStorage,
  addWindowCommandMetadata,
  getWindowCommandMetadata,
} from '@/universal/metadata';

export const WindowCommandMethods =
  ElectronMetadataStorage.getKey('WindowCommand');

export interface WindowCommandMetadata {
  method: string;
  command: string;
}

export function WindowCommand(command: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    addWindowCommandMetadata(target, propertyKey, command);
  } as MethodDecorator;
}

export function getWindowCommands(target: Function): WindowCommandMetadata[] {
  return getWindowCommandMetadata(target);
}
