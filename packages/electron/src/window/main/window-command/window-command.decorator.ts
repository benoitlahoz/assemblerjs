import { ElectronMetadata } from '@/common/metadata';
import { buildMetadataKey } from '@assemblerjs/common';

export const WindowCommandMethods = buildMetadataKey(
  'electron:window',
  'WindowCommand',
);

export interface WindowCommandMetadata {
  method: string;
  command: string;
}

export function WindowCommand(command?: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    // Infer command name from method name if not provided
    const commandName = command ?? propertyKey;
    ElectronMetadata.window.addCommand(target, propertyKey, commandName);
  } as MethodDecorator;
}

export function getWindowCommands(target: Function): WindowCommandMetadata[] {
  return ElectronMetadata.window.getCommands(target);
}
