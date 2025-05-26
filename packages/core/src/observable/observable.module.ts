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
    const value = buildObservableValue(_value, this);
    this._value = value;
  }

  public set value(newValue: T) {
    const previous = this._value; // TODO: Object deep clone?
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

  public patch(...properties: string[]) {
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

    for (const property of properties) {
      if (property === 'constructor') {
        throw new Error(`Patching constructor is forbidden.`);
      }

      if (
        Object.keys(ownDescriptors).includes(property) &&
        typeof ownDescriptors[property].value === 'function'
      ) {
        patch(ownDescriptors, property);
        continue;
      }

      if (
        Object.keys(prototypeDescriptors).includes(property) &&
        typeof prototypeDescriptors[property].value === 'function'
      ) {
        patch(prototypeDescriptors, property);
        continue;
      }

      throw new Error(
        `Descriptors of '${this.value}' do not include property '${property}'.`
      );
    }

    return this;
  }

  public watch(fn: (value: T, previous?: T) => void) {
    this._observers.push(fn);
    return this;
  }

  public immediate() {
    for (const observer of this._observers) {
      observer(this.value, this.value);
    }
  }

  public unwatch(fn: (value: T, previous?: T) => void) {
    this._removeListener(fn);
    return this;
  }
}

export const observable = <T>(value: T) => {
  return new Observable(value);
};

// Kept as reference and for future usages.
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
