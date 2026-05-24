export const WindowCommandMethods = Symbol('__WindowCommandMethods__');

export interface WindowCommandMetadata {
  method: string;
  command: string;
}

export function WindowCommand(command: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    target[WindowCommandMethods] = target[WindowCommandMethods] || new Map();
    target[WindowCommandMethods].set(propertyKey, command);
  } as MethodDecorator;
}

export function getWindowCommands(target: Function): WindowCommandMetadata[] {
  const commands = new Map<string, string>();

  let prototype: any = target.prototype;
  while (prototype && prototype !== Object.prototype) {
    const methods: Map<string, string> | undefined =
      prototype[WindowCommandMethods];
    if (methods) {
      for (const [method, command] of methods.entries()) {
        if (!commands.has(method)) {
          commands.set(method, command);
        }
      }
    }
    prototype = Object.getPrototypeOf(prototype);
  }

  return [...commands.entries()].map(([method, command]) => ({
    method,
    command,
  }));
}
