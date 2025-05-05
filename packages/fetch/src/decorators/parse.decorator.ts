export enum ReflectParse {
  ExpectedType = 'parse.decorator:type.expected',
}

export type ResponseMethod = string &
  ('text' | 'json' | 'blob' | 'arrayBuffer' | 'bytes' | 'formData');

export const Parse = (type: ResponseMethod): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: TypedPropertyDescriptor<any>
  ) => {
    const prop = String(propertyKey);

    Reflect.defineMetadata(
      ReflectParse.ExpectedType,
      type,
      (target as any)[prop]
    );
  };
};
