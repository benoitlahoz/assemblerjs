/**
 * Very simple implementation of an Observable.
 *
 * See also:
 * https://dev.to/dperrymorrow/create-an-observable-object-using-proxy-3h62
 * https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf
 * https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p
 */

import { removeIfDefined } from '@/array.utils';

export class Observable<T> {
  private _observers: ((value: T, previous?: T) => void)[] = [];
  private _removeListener = removeIfDefined(this._observers);

  constructor(private _value: T) {
    // FIXME/ Test of deepClone is OK here.
    const value = buildObservableValue(_value, this);
    this._value = value;
  }

  public set value(newValue: T) {
    const previous = this._value; // TODO: Object deep clone? or deep trigger subobservables.
    this._value = newValue;
    for (const observer of this._observers) {
      observer(this.value, previous);
    }
  }

  public get value(): T {
    return this._value;
  }

  public dispose() {
    this._observers.length = 0;
  }

  /**
   * Wrap given methods of the observable's value to trigger change.
   *
   * @param { string[] } methodsNames The methods' names that will trigger a change for watchers.
   * @returns { Observable<T> } `this` observable.
   */
  public patch(...methodsNames: string[]) {
    const ownDescriptors = Object.getOwnPropertyDescriptors(this.value);
    const prototypeDescriptors = Object.getOwnPropertyDescriptors(
      Object.getPrototypeOf(this.value)
    );

    const patch = (
      descriptors: { [x: string]: PropertyDescriptor },
      propertyName: string
    ) => {
      const old = descriptors[propertyName].value.bind(this.value);

      const wrapperFn = function (this: Observable<T>, ...args: any[]) {
        const res = old(...args);
        for (const observer of this._observers) {
          observer(this.value);
        }

        return res;
      };

      Object.defineProperty(this.value, propertyName, {
        ...descriptors[propertyName],
        value: wrapperFn.bind(this),
      });
    };

    for (const method of methodsNames) {
      if (method === 'constructor') {
        throw new Error(`Patching constructor is forbidden.`);
      }

      if (
        Object.keys(ownDescriptors).includes(method) &&
        typeof ownDescriptors[method].value === 'function'
      ) {
        patch(ownDescriptors, method);
        continue;
      }

      if (
        Object.keys(prototypeDescriptors).includes(method) &&
        typeof prototypeDescriptors[method].value === 'function'
      ) {
        patch(prototypeDescriptors, method);
        continue;
      }

      throw new Error(
        `Descriptors of '${this.value}' do not include property '${method}'.`
      );
    }

    return this;
  }

  /**
   * Add a listener to the observable changes.
   *
   * @param { (value: T, previous?: T) => void } fn The listener to add.
   * @returns { Observable<T> } `this` observable.
   */
  public watch(fn: (value: T, previous?: T) => void) {
    this._observers.push(fn);
    return this;
  }

  // TODO: chain transformers to be used instead of unique `watch`.
  // public map(fn: (value: T) => T): this

  /**
   * Triggers immediately the listeners set by `watch`.
   *
   * @returns { Observable<T> } `this` observable.
   */
  public immediate() {
    for (const observer of this._observers) {
      observer(this.value);
    }
    return this;
  }

  /**
   * An alias of `immediate`.
   *
   * @returns { Observable<T> } `this` observable.
   */
  public trigger() {
    return this.immediate();
  }

  public unwatch(fn: (value: T, previous?: T) => void) {
    this._removeListener(fn);
    return this;
  }
}

export const observable = <T>(value: T) => {
  return new Observable(value);
};

// TODO: deep.
export const buildObservableValue = <T>(value: T, _target: Observable<T>) => {
  /*
  console.log('VAL', value);
  if (value !== null && typeof value === 'object') {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const names = Object.getOwnPropertyNames(value);
    console.log(
      'OBJ',
      descriptors,
      names,
      Object.getOwnPropertyDescriptors(Object.getPrototypeOf(value))
    );
    // Call the functions then inform the subscribers.
    for (const propertyName in descriptors) {
      if (typeof descriptors[propertyName].value === 'function') {
        const old = descriptors[propertyName].value.bind(value);
        console.log('BUILD', propertyName);
        const wrapperFn = function (...args: any[]) {
          const res = old(...args);

          for (const observer of (target as any)._observers) {
            observer(value);
          }

          return res;
        };

        Object.defineProperty(value, propertyName, {
          ...descriptors[propertyName],
          value: wrapperFn,
        });
      }

      // Should recurse if not a function but an object.
      // else if
      // If subobject value changes, call the super object observers.
    }
    return value;
  }
  */
  return value;
};
