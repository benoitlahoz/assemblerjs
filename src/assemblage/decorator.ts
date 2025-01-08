import type { Injection } from '@/injection/types';
import {
  ReflectIsAssemblageFlag,
  ReflectIsControllerFlag,
  ReflectIsSingletonFlag,
} from '@/common/constants';
import { defineCustomMetadata } from '@/common/reflection';

export interface AssemblageDefinition {
  singleton?: false;

  inject?: Injection<unknown>[][];

  tags?: string | string[];

  controller?: true;
  path?: string;

  metadata?: Record<string, any>;
}

export const Assemblage = (
  definition?: AssemblageDefinition
): ClassDecorator => {
  const definedDefinition: any = definition || {};

  return <TFunction extends Function>(target: TFunction): TFunction => {
    defineCustomMetadata(ReflectIsAssemblageFlag, true, target);

    // Assemblages are singletons by default.
    defineCustomMetadata(ReflectIsSingletonFlag, true, target);

    for (const property in definedDefinition) {
      if (definedDefinition.hasOwnProperty(property)) {
        switch (property) {
          case 'singleton': {
            if (definedDefinition.singleton === false) {
              defineCustomMetadata(ReflectIsSingletonFlag, false, target);
            }
            break;
          }

          case 'controller': {
            if (definedDefinition.controller === true) {
              if (typeof definedDefinition.path !== 'string') {
                throw new Error(
                  `Controller assemblage '${target.name}' must define a path.`
                );
              }

              defineCustomMetadata(ReflectIsControllerFlag, true, target);
            }
            break;
          }

          default: {
            // Other definition's properties can be accessed by their names.
            defineCustomMetadata(property, definedDefinition[property], target);
          }
        }
      }
    }

    return target;
  };
};
