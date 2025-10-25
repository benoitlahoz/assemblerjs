import { createConstructorDecorator } from 'assemblerjs';
import { app } from 'electron';

export const AppSubMethods = Symbol('__AppListenerSubMethods__');

/**
 * Class decorator to allow using 'AppOn' decorator.
 * @see https://stackoverflow.com/a/61448736/1060921
 */
export const AppListener = createConstructorDecorator(function (this: any) {
  // Since the class returned by this decorator is a wrapper of `Assemblage` get the constructor methods.
  const subMethods = this.constructor.prototype[AppSubMethods];
  if (subMethods) {
    subMethods.forEach(
      (config: { channel: string; wait: boolean }, method: string) => {
        if (config.wait) {
          app.whenReady().then(() => {
            app.on(config.channel as any, (...args: any[]) =>
              this[method](...args)
            );
          });
        } else {
          app.on(config.channel as any, (...args: any[]) =>
            this[method](...args)
          );
        }
      }
    );
  }
});
