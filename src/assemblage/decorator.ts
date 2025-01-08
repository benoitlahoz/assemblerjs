import type { Injection } from '@/injection/types';
import {
  ReflectIsAssemblageFlag,
  ReflectIsControllerFlag,
  ReflectIsSingletonFlag,
} from '@/common/constants';
import { defineCustomMetadata } from '@/common/reflection';

export interface AssemblageDefinition {
  singleton?: false;
  events?: string[];

  inject?: Injection<unknown>[][];

  tags?: string | string[];

  controller?: true;
  path?: string;

  metadata?: Record<string, any>;
}

export const Assemblage = (
  definition?: AssemblageDefinition
): ClassDecorator => {
  const safeDefinition: any = definition || {};

  return <TFunction extends Function>(target: TFunction): TFunction => {
    defineCustomMetadata(ReflectIsAssemblageFlag, true, target);

    // Assemblages are singletons by default.
    defineCustomMetadata(ReflectIsSingletonFlag, true, target);

    for (const property in safeDefinition) {
      if (safeDefinition.hasOwnProperty(property)) {
        switch (property) {
          case 'singleton': {
            if (safeDefinition.singleton === false) {
              // Mark assemblage as transient.

              defineCustomMetadata(ReflectIsSingletonFlag, false, target);
            }
            break;
          }

          case 'controller': {
            if (safeDefinition.controller === true) {
              if (typeof safeDefinition.path !== 'string') {
                throw new Error(
                  `Controller assemblage '${target.name}' must define a path.`
                );
              }

              // Mark assemblage as controller.

              defineCustomMetadata(ReflectIsControllerFlag, true, target);
            }
            break;
          }

          case 'tags': {
            if (typeof safeDefinition.tags !== 'undefined') {
              if (typeof safeDefinition.tags === 'string') {
                defineCustomMetadata('tags', [safeDefinition.tags], target);
              } else if (Array.isArray(safeDefinition.tags)) {
                defineCustomMetadata('tags', safeDefinition.tags, target);
              } else {
                throw new Error(
                  `Assemblage's 'tags' must be o type 'string' or 'Array'.`
                );
              }
            }
            break;
          }

          // Type guards.

          case 'inject': {
            // Check injections are valid.

            if (!Array.isArray(safeDefinition.inject)) {
              throw new Error(
                `Assemblage's definition 'inject' property must be an array of 'Injection' tuples.`
              );
            }

            for (const injection of safeDefinition.inject) {
              if (!Array.isArray(injection)) {
                throw new Error(`'Injection' must be an 'Array'.`);
              }
            }
          }

          default: {
            // Not caught definition's properties can be accessed by their names.
            defineCustomMetadata(property, safeDefinition[property], target);
          }
        }
      }
    }

    return target;
  };
};
