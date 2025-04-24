/**
 * Check if a value is a class.
 *
 * @param { any } target The object to check.
 * @returns { boolean } `true` if the object is a class.
 */
/* #__PURE__ */
export const isClass = (
  target: any
): target is { new (...args: any[]): any } => {
  return (
    target &&
    typeof target === 'function' &&
    typeof target.constructor !== 'undefined'
  );
};

/**
 * Checks if a value is a string.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a string.
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Checks if a value is a symbol.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a symbol.
 */
export const isSymbol = (value: unknown): value is symbol =>
  typeof value === 'symbol';

/**
 * Checks if a value is a number.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a number.
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number';

/**
 * Checks if a value is a boolean.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a boolean.
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Checks if a value is strictly an object (i.e. with properties, not null and not an array).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is an object and not an array.
 */
export const isObject = (value: unknown): value is Record<any, any> =>
  typeof value === 'object' && isDefined(value) && !isArray(value);

/**
 * Checks if a value is a function.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a function.
 */
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

/**
 * Checks if a value is an array. An alias for `Array.isArray`.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is an array.
 */
export const isArray = Array.isArray;

/**
 * Checks if a value is a date object.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a date object.
 */
export const isDate = (value: unknown): value is Date =>
  isObject(value) && isFunction(value.getTime);

/**
 * Checks if a value is a `Promise`.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is a Promise.
 */
export const isPromise = <T = unknown>(value: unknown): value is Promise<T> =>
  isObject(value) && isFunction(value.then) && isFunction(value.catch);

/**
 * Checks if a function has been declared as asynchronous by testing its constructor name.
 *
 * @param { Function } value The function to test.
 * @returns { boolean } true if the function has been declared as asynchronous.
 */
export const isAsync = (value: unknown): boolean =>
  isFunction(value) && (value as Function).constructor.name === 'AsyncFunction';

/**
 * Checks if a value is undefined (i.e.: of type `undefined`).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is undefined.
 */
export const isUndefined = (value: unknown): value is undefined =>
  typeof value === 'undefined';

/**
 * Checks if a value is `null`.
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is null.
 */
export const isNull = (value: unknown): value is null => value === null;

/**
 * Checks if a value is defined (i.e.: is neither `undefined` nor `null`).
 *
 * @param { unknown } value The value to check.
 * @returns { boolean } `true` if the value is defined.
 */
export const isDefined = (value: unknown): boolean =>
  !isUndefined(value) && !isNull(value);

/**
 * Returns a function that checks if a value is of one of the passed types.
 *
 * @param { (...args: string[]) } types The types names to checks.
 * @returns { (value: unknown) => string | undefined } A function to check a value for types
 * (returns the type if it matches or undefined if not).
 */
export const isOfType =
  (...types: string[]) =>
  (value: unknown) => {
    if (!types.includes(typeof value)) return undefined;
    return typeof value;
  };

/**
 * Returns a function to check if a value has the same type as passed value
 * using `typeof`.
 *
 * @param { unknown } one The original value that will be compared.
 * @returns { (two: unknown) => boolean } The function to compare type.
 */
export const isTypeOf = (one: unknown) => (two: unknown) =>
  isOfType(typeof one)(two);

/**
 * Returns a function to check if a value is an instance of passed value
 * using `instanceof`.
 *
 * @param { unknown } one The original value that will be compared.
 * @returns { (klass: any) => boolean } The function to compare.
 */
export const isInstanceOf = (value: unknown) => (klass: any) =>
  value instanceof klass;

/**
 * Returns a function that checks if a given object has a constructor of given type.
 *
 * @param { any } obj The object to test.
 * @returns { (ctor: any) => boolean } The function to check if `obj` has a constructor of type `ctor`.
 */
export const hasCtor =
  (obj: any) =>
  (ctor: any): boolean =>
    obj.constructor && obj.constructor === ctor;

/**
 * Checks if a class is a subclass of another class.
 *
 * @param { unknown } superclass The superclass.
 * @param { unknown } subclass The subclass.
 * @returns { boolean } true if `superclass` is superclass of `subclass`.
 */
export const isPrototypeOf: (
  superclass: unknown,
  subclass: unknown
) => unknown | boolean = Function.call.bind(Object.prototype.isPrototypeOf);

/**
 * Checks if a method calls superclass same method. If passed the superclass property name, the
 * function will check if super.propertyName is included in the passed method.
 *
 * @param { any } method The subclass method to check.
 * @param { string } superProp The optional property of the superclass to check.
 * @returns { boolean } true if the method includes a call to `super`.
 *
 * @see https://stackoverflow.com/a/15123777/1060921
 * @see https://gist.github.com/DesignByOnyx/05c2241affc9dc498379e0d819c4d756
 */
export const hasSuper = (method: any, superProp?: string): boolean => {
  if (!isFunction(method)) return false;

  // Remove comments.
  const noCommentString = method
    .toString()
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');

  return superProp
    ? noCommentString.includes(`super.${superProp}`)
    : noCommentString.includes(`super`);
};

export default {
  isString,
  isSymbol,
  isNumber,
  isBoolean,
  isObject,
  isFunction,
  isArray,
  isDate,
  isPromise,
  isAsync,
  isUndefined,
  isNull,
  isDefined,
  isOfType,
  isTypeOf,
  isInstanceOf,
  hasCtor,
  isPrototypeOf,
  hasSuper,
};
