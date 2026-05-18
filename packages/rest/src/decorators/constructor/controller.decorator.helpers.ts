import type { AssemblerContext } from 'assemblerjs';
import { getAssemblageContext, getAssemblageDefinition } from 'assemblerjs';
import { cleanPath } from '@/controller/clean-path';
import type { ControllerDefinition } from './controller.decorator';

const BASE_PATH_KEY = Symbol.for('__assemblerjs_rest_base_path__');

/**
 * Builds the controller's own path from its decorator definition.
 * Stores the cleaned base path for later recursive propagation.
 */
export const buildOwnPath = (
  target: any,
  definition?: ControllerDefinition
): void => {
  const ownPath = definition?.path
    ? typeof definition.path === 'string'
      ? cleanPath(definition.path)
      : definition.path
    : '/';
  target.path = ownPath;
  (target as any)[BASE_PATH_KEY] = ownPath;
};

/**
 * Forces the assemblage to be a singleton.
 */
export const forceSingleton = (target: any): void => {
  const assemblageDefinition = getAssemblageDefinition(target.constructor);
  assemblageDefinition.singleton = true as any;
};

/**
 * Propagates the parent controller's path prefix to its injected sub-controllers,
 * recursively descending the injection tree.
 * Paths are normalised through `cleanPath` to avoid double slashes.
 * Each child's final path is computed from its **base path** (set at decoration time)
 * so re-propagation from a grandparent always produces the correct result.
 */
export const propagatePathToInjections = (
  target: any,
  context: AssemblerContext,
  parentPath?: string
): void => {
  const prefix = parentPath ?? target.path ?? '';
  const definition = getAssemblageDefinition(target.constructor);
  const injected = definition.provide || definition.inject || [];
  for (const injection of injected) {
    const injectable = injection[0];
    if (!context.has(injectable)) continue;
    const child: any = context.require(injectable);
    const childBase: string = (child as any)[BASE_PATH_KEY] ?? child.path ?? '';
    const newPath = cleanPath(`${prefix}${childBase}`);
    child.path = newPath;
    // Recurse so grandchildren are updated with the full path of this child.
    // Use the child's own context so it can resolve its own injections.
    const childContext = getAssemblageContext(child.constructor) ?? context;
    propagatePathToInjections(child, childContext, newPath);
  }
};
