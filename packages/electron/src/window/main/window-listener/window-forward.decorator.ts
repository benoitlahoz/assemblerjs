import { WindowOn } from './window-on.decorator';
import { WindowEmit } from './window-emit.decorator';

/**
 * Combines `@WindowOn` and `@WindowEmit` into a single decorator that forwards
 * BrowserWindow events to the renderer process.
 *
 * The IPC channel is automatically generated at runtime using the window name
 * and the event name: `window:${windowName}.${event}`.
 *
 * This guarantees no channel collisions between different windows while avoiding
 * the need to manually specify channel names.
 *
 * @param event - The BrowserWindow event to listen for (e.g., 'resize', 'move')
 *
 * @example
 * ```typescript
 * @Window({ name: 'main', width: 800, height: 600 })
 * @Assemblage()
 * export class MainWindow extends ElectronWindow {
 *   // Listens to 'resize' event and emits result to 'window:main.resize'
 *   @WindowForward('resize')
 *   public onResize() {
 *     return this.getBounds();
 *   }
 *
 *   // Listens to 'move' event and emits result to 'window:main.move'
 *   @WindowForward('move')
 *   public onMove() {
 *     return this.getBounds();
 *   }
 * }
 * ```
 *
 * @remarks
 * If you need a custom channel that doesn't follow the convention, you can
 * still use `@WindowOn` + `@WindowEmit` separately.
 */
export function WindowForward(event: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // Store the BrowserWindow event name for @WindowOn
    WindowOn(event)(target, propertyKey, descriptor);

    // Store the same event name for @WindowEmit
    // The runtime will use buildWindowEventChannel(windowName, event) to generate the IPC channel
    WindowEmit(event)(target, propertyKey, descriptor);

    return descriptor;
  } as MethodDecorator;
}
