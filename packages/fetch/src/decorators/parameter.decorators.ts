export enum ReflectParameters {
  Param = 'fetch:param.decorator',
  Query = 'fetch:query.decorator',
  Placeholder = 'fetch:placeholder.decorator',
}

export interface ReflectParametersValues {
  metadata: Record<string, string | symbol>;
  length: number;
}

const decoratorFactory =
  (reflectKey: string) =>
  (identifier: string | symbol) =>
  (target: any, propertyKey: string | symbol | undefined, index: number) => {
    // Get existing identifiers for this decorator.
    const identifiers: Record<string, string | symbol> =
      Reflect.getMetadata(reflectKey, target[String(propertyKey)]) || {};
    identifiers[String(index)] = identifier;

    // Cache the token passed as identifier.
    Reflect.defineMetadata(
      reflectKey,
      identifiers,
      target[String(propertyKey)]
    );
  };

/**
 * Path transformer builder.
 */
const transformPath =
  (
    fn: (
      path: string,
      decoratorValues: ReflectParametersValues,
      ...args: any[]
    ) => string
  ) =>
  (path: string, decoratorValues: ReflectParametersValues, ...args: any[]) =>
    fn(path, decoratorValues, ...args);

/**
 * Get reflected values for given decorator.
 */
export const getParameterDecoratorValues = (
  reflectKey: string,
  target: any,
  propertyKey: string | symbol
): ReflectParametersValues => {
  const metadata: Record<string, string | symbol> = Reflect.getMetadata(
    reflectKey,
    target[String(propertyKey)]
  );

  return {
    metadata: metadata || {},
    length: Object.keys(metadata || {}).length,
  };
};

// Decorators.

export const Query = decoratorFactory(ReflectParameters.Query);
export const Param = decoratorFactory(ReflectParameters.Param);
export const Placeholder = decoratorFactory(ReflectParameters.Placeholder);

// Path transformers.

export const transformPlaceholder = transformPath(
  (path: string, decoratorValues: ReflectParametersValues, ...args: any[]) => {
    let newPath = path;
    // Replace in existing decorators values.
    for (const [key, value] of Object.entries(decoratorValues.metadata)) {
      const index = Number(key);
      if (typeof args[index] === 'undefined') {
        newPath = newPath.replaceAll(String(value), '');
      } else {
        newPath = newPath.replaceAll(String(value), args[index]);
      }
    }
    return newPath;
  }
);

export const transformParam = transformPath(
  (path: string, decoratorValues: ReflectParametersValues, ...args: any[]) => {
    let newPath = path;
    for (const [key, value] of Object.entries(decoratorValues.metadata)) {
      let paramValue = String(value);
      if (!paramValue.startsWith(':')) paramValue = `:${paramValue}`; // Ensure the key starts with ':'
      newPath = newPath.replaceAll(paramValue, args[Number(key)]);
    }
    return newPath;
  }
);

export const transformQuery = transformPath(
  (path: string, decoratorValues: ReflectParametersValues, ...args: any[]) => {
    const url = new URL(path);
    const urlParameters = url.searchParams;

    for (let index = 0; index < args.length; index++) {
      const key = decoratorValues.metadata[String(index)];
      if (key) {
        let value: any = args[index];
        if (Array.isArray(value)) {
          value = value.join(',');
        } else {
          value = String(value);
        }
        urlParameters.set(String(key), value);
      }
    }

    const questionMark = Array.from(urlParameters).length > 0 ? '?' : '';

    return `${url.origin}${
      url.pathname
    }${questionMark}${urlParameters.toString()}`;
  }
);
