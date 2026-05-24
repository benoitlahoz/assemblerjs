import {
  normalizeWindowRendererDefinition,
  WindowRendererDefinitionMetadataKey,
  type WindowRendererDefinition,
  getWindowRendererDefinition,
  resolveWindowRendererName,
} from './window-definition';
import { WindowListener } from './window-listener.decorator';

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
    Reflect.defineMetadata(
      WindowRendererDefinitionMetadataKey,
      normalizeWindowRendererDefinition(definition),
      target,
    );

    listenerDecorator(target as any);
  };
}

export {
  WindowRendererDefinitionMetadataKey,
  getWindowRendererDefinition,
  resolveWindowRendererName,
};
export type { WindowRendererDefinition };
