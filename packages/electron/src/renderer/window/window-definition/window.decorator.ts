import {
  normalizeWindowRendererDefinition,
  WindowRendererDefinitionMetadataKey,
  type WindowRendererDefinition,
  getWindowRendererDefinition,
  resolveWindowRendererName,
} from './window-definition';
import { setWindowRendererDefinitionMetadata } from '@/universal/metadata';
import { WindowListener } from '../window-listener/window-listener.decorator';

/**
 * Declares the target window name for a renderer scoped service.
 *
 * This decorator also applies `@WindowListener()` automatically,
 * so event subscriptions declared via `@WindowOn(...)` are wired
 * without requiring an explicit class-level `@WindowListener()`.
 */
export function Window(
  definition: string | WindowRendererDefinition,
): ClassDecorator {
  const listenerDecorator = WindowListener();

  return (target: Function) => {
    setWindowRendererDefinitionMetadata(
      target,
      normalizeWindowRendererDefinition(definition),
    );

    const decorated = listenerDecorator(target as any) as Function | void;
    return (decorated || target) as any;
  };
}

export {
  WindowRendererDefinitionMetadataKey,
  getWindowRendererDefinition,
  resolveWindowRendererName,
};
export type { WindowRendererDefinition };
