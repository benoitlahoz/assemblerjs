export const Awaitable = (property: string, millis = 25) => {
  return (
    _target: any,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>
  ) => {
    let originalFn = descriptor.value!;

    descriptor.value = async function (): Promise<void> {
      return new Promise((resolve) => {
        if (this[property]) {
          originalFn.apply(this);
          resolve();
        } else {
          const interval = setInterval(() => {
            if (this[property]) {
              clearInterval(interval);
              originalFn.apply(this);
              resolve();
            }
          }, millis);
        }
      });
    };
  };
};
