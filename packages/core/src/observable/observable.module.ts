import { removeIfDefined } from '@/array.utils';
import type { AnyFunction } from '@/function.types';

export class Observable<T> {
  private _observers: AnyFunction<T, void | Promise<void>>[] = [];
  private _removeListener = removeIfDefined(this._observers);

  constructor(private _value: T) {}

  public set value(newValue: T) {
    this._value = newValue;
    for (const observer of this._observers) {
      observer(this.value);
    }
  }

  public get value(): T {
    return this._value;
  }

  public dispose() {
    this._observers.length = 0;
  }

  public watch(fn: (value: T) => void) {
    this._observers.push(fn);
  }

  public unwatch(fn: (value: T) => void) {
    this._removeListener(fn);
  }
}

export const obs = <T>(value: T) => {
  return new Observable(value);
};
