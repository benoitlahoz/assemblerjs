import { describe, it, expect } from 'vitest';
import { Await } from './await.decorator';

describe('Await Decorator', () => {
  it('should wait for a boolean property to become truthy', async () => {
    class MyClass {
      public ready = false;
      public calls = 0;

      @Await('ready', 1)
      public async run(value: number): Promise<number> {
        this.calls++;
        return value + 1;
      }
    }

    const instance = new MyClass();
    const pending = instance.run(2);

    setTimeout(() => {
      instance.ready = true;
    }, 5);

    expect(await pending).toBe(3);
    expect(instance.calls).toBe(1);
  });

  it('should support a sync function condition referenced by property name', async () => {
    class MyClass {
      public ready = false;
      public calls = 0;

      public isReady(): boolean {
        return this.ready;
      }

      @Await('isReady', 1)
      public async run(value: number): Promise<number> {
        this.calls++;
        return value + 2;
      }
    }

    const instance = new MyClass();
    const pending = instance.run(2);

    setTimeout(() => {
      instance.ready = true;
    }, 5);

    expect(await pending).toBe(4);
    expect(instance.calls).toBe(1);
  });

  it('should support an async external function condition with no instance usage', async () => {
    let ready = false;

    class MyClass {
      public calls = 0;

      @Await(async () => ready, 1)
      public async run(value: number): Promise<number> {
        this.calls++;
        return value * 2;
      }
    }

    const instance = new MyClass();
    const pending = instance.run(3);

    setTimeout(() => {
      ready = true;
    }, 5);

    expect(await pending).toBe(6);
    expect(instance.calls).toBe(1);
  });
});