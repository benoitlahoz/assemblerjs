import { describe, it, expect } from 'vitest';
import { Singleton } from './singleton.decorator';
import { StaticImplements } from './static-implements.decorator';

@Singleton
class TestSingleton {
  public value: string = 'foo';
}

describe('Singleton decorator', () => {
  it('should actually be a singleton.', () => {
    const singleton = new TestSingleton();
    const shouldBeSame = new TestSingleton();

    expect(singleton.value).toBe('foo');

    shouldBeSame.value = 'bar';
    expect(singleton.value).toBe('bar');
    expect(singleton.value).not.toBe('foo');

    expect(singleton.value).toBe(shouldBeSame.value);
    expect(singleton).toStrictEqual(shouldBeSame);
  });
});

abstract class AbstractTestStatic {
  public abstract execute(): boolean;
}

@StaticImplements<AbstractTestStatic>()
class TestStatic {
  public static execute(): boolean {
    return true;
  }
}

describe('Static implementation decorator', () => {
  it('methods should be static.', () => {
    const result: boolean = TestStatic.execute();

    expect(result).toBeTruthy();
  });
});
