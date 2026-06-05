import { createConstructorDecorator } from 'assemblerjs';
import { app } from 'electron';
import { registerCleanup } from '@/common/lifecycle';

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
        let disposed = false;
        let listener: ((...args: any[]) => any) | null = null;

        registerCleanup(this, () => {
          disposed = true;
          if (listener) {
            app.off(config.channel as any, listener);
          }
        });

        if (config.wait) {
          app.whenReady().then(() => {
            if (disposed) {
              return;
            }

            listener = (...args: any[]) => this[method](...args);
            app.on(config.channel as any, listener);
          });
        } else {
          listener = (...args: any[]) => this[method](...args);
          app.on(config.channel as any, listener);
        }
      }
    );
  }
});
