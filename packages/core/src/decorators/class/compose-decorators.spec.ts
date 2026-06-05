import { describe, it, expect, vi } from 'vitest';
import { composeDecorators } from './compose-decorators';

describe('composeDecorators', () => {
  it('should apply decorators in order', () => {
    const order: number[] = [];

    const decorator1 = (): ClassDecorator => {
      return (target: Function) => {
        order.push(1);
        return target;
      };
    };

    const decorator2 = (): ClassDecorator => {
      return (target: Function) => {
        order.push(2);
        return target;
      };
    };

    const decorator3 = (): ClassDecorator => {
      return (target: Function) => {
        order.push(3);
        return target;
      };
    };

    const composed = composeDecorators(
      decorator1(),
      decorator2(),
      decorator3(),
    );

    @(composed as any)
    class TestClass {}

    expect(order).toEqual([1, 2, 3]);
  });

  it('should pass the result of each decorator to the next', () => {
    const decorator1 = (): ClassDecorator => {
      return (target: Function) => {
        const extended = class extends (target as any) {
          public prop1 = 'decorator1';
        };
        return extended as any;
      };
    };

    const decorator2 = (): ClassDecorator => {
      return (target: Function) => {
        const extended = class extends (target as any) {
          public prop2 = 'decorator2';
        };
        return extended as any;
      };
    };

    const composed = composeDecorators(decorator1(), decorator2());

    @(composed as any)
    class TestClass {}

    const instance = new (TestClass as any)();

    expect(instance.prop1).toBe('decorator1');
    expect(instance.prop2).toBe('decorator2');
  });

  it('should handle decorators that do not return a value', () => {
    const decorator1 = (): ClassDecorator => {
      return (target: Function) => {
        (target as any).staticProp = 'test';
        // No return - should use original target
      };
    };

    const decorator2 = (): ClassDecorator => {
      return (target: Function) => {
        (target as any).staticProp2 = 'test2';
        return target;
      };
    };

    const composed = composeDecorators(decorator1(), decorator2());

    @(composed as any)
    class TestClass {}

    expect((TestClass as any).staticProp).toBe('test');
    expect((TestClass as any).staticProp2).toBe('test2');
  });

  it('should work with a single decorator', () => {
    const decorator = (): ClassDecorator => {
      return (target: Function) => {
        (target as any).staticProp = 'single';
        return target;
      };
    };

    const composed = composeDecorators(decorator());

    @(composed as any)
    class TestClass {}

    expect((TestClass as any).staticProp).toBe('single');
  });

  it('should work with no decorators', () => {
    const composed = composeDecorators();

    @(composed as any)
    class TestClass {
      public prop = 'original';
    }

    const instance = new TestClass();
    expect(instance.prop).toBe('original');
  });

  it('should preserve the target when decorators mutate without returning', () => {
    const calls: string[] = [];

    const decorator1 = (): ClassDecorator => {
      return (target: Function) => {
        calls.push('decorator1');
        (target.prototype as any).method1 = () => 'method1';
      };
    };

    const decorator2 = (): ClassDecorator => {
      return (target: Function) => {
        calls.push('decorator2');
        (target.prototype as any).method2 = () => 'method2';
      };
    };

    const composed = composeDecorators(decorator1(), decorator2());

    @(composed as any)
    class TestClass {}

    const instance = new (TestClass as any)();

    expect(calls).toEqual(['decorator1', 'decorator2']);
    expect(instance.method1()).toBe('method1');
    expect(instance.method2()).toBe('method2');
  });
});
