/**
 * Check at given interval if a property is defined and truthy to call an async method.
 *
 * @param { string } property The name of the class proprty to wait for.
 * @param { number | undefined } interval The interval in milliseconds at which the value is checked (defaults to 25 milliseconds).
 * @returns { Promise<void> } A promise that calls the original method when resolving.
 */
export const Await = (property: string, interval = 25): MethodDecorator => {
  return ((
    _target: any,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>
  ) => {
    const originalFn = descriptor.value!;

    descriptor.value = async function (): Promise<void> {
      return new Promise((resolve) => {
        if (this[property]) {
          originalFn.apply(this);
          resolve();
        } else {
          const timeInterval = setInterval(() => {
            if (this[property]) {
              clearInterval(timeInterval);
              originalFn.apply(this);
              resolve();
            }
          }, interval);
        }
      });
    };
  }) as MethodDecorator;
};
