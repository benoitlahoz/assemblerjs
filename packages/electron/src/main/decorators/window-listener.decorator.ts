import { createConstructorDecorator } from 'assemblerjs';
import { bindCleanupToEvent, registerCleanup } from '@/universal/lifecycle';

export const WindowSubMethods = Symbol('__WindowListenerSubMethods__');

export const WindowListener = createConstructorDecorator(function (this: any) {
  const subMethods = this.constructor.prototype[WindowSubMethods];
  if (subMethods) {
    bindCleanupToEvent(this, 'closed');

    subMethods.forEach((channel: string, method: string) => {
      const listener = (...args: any[]) => {
        if (this[method]) return this[method](...args);
      };

      this.on(channel as any, listener);
      registerCleanup(this, () => {
        this.removeListener(channel as any, listener);
      });
    });
  }
});
