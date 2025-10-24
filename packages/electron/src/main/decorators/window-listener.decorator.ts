import { createConstructorDecorator } from 'assemblerjs';

export const WindowSubMethods = Symbol('__WindowListenerSubMethods__');

export const WindowListener = createConstructorDecorator(function (this: any) {
  const subMethods = this.constructor.prototype[WindowSubMethods];
  if (subMethods) {
    subMethods.forEach((channel: string, method: string) => {
      this.on(channel as any, (...args: any[]) => {
        if (this[method]) return this[method](...args);
      });
    });
  }
});
