import {
  ElectronMetadataStorage,
  addMenuCommandMetadata,
  getMenuCommandMetadata,
} from '@/universal/metadata';

export const MenuCommandMethods = ElectronMetadataStorage.getKey('MenuCommand');

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
    addMenuCommandMetadata(target, propertyKey, command);
  } as MethodDecorator;
}

export function getMenuCommands(target: Function): MenuCommandMetadata[] {
  return getMenuCommandMetadata(target);
}
