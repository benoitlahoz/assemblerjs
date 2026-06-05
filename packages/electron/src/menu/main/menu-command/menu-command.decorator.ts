import { ElectronMetadata } from '@/common/metadata';
import { buildMetadataKey } from '@assemblerjs/common';

export const MenuCommandMethods = buildMetadataKey(
  'electron:menu',
  'MenuCommand',
);

export interface MenuCommandMetadata {
  method: string;
  command: string;
}

export function MenuCommand(command: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    ElectronMetadata.menu.addCommand(target, propertyKey, command);
  } as MethodDecorator;
}

export function getMenuCommands(target: Function): MenuCommandMetadata[] {
  return ElectronMetadata.menu.getCommands(target);
}
