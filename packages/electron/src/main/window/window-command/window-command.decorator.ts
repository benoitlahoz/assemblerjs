import { ElectronMetadata } from '@/universal/metadata';
import { buildMetadataKey } from '@assemblerjs/common';

export const WindowCommandMethods = buildMetadataKey(
  'electron:window',
  'WindowCommand',
);

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
    ElectronMetadata.window.addCommand(target, propertyKey, command);
  } as MethodDecorator;
}

export function getWindowCommands(target: Function): WindowCommandMetadata[] {
  return ElectronMetadata.window.getCommands(target);
}
