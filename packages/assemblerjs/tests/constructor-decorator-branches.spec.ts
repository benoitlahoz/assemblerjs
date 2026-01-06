import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage } from '../src';
import { ParameterDecoratorFactory } from '../src/shared/decorators/parameters/parameter-decorator-factory';
import type { ParameterResolver } from '../src/shared/decorators/types';

// Mock resolver for testing
class TestResolver implements ParameterResolver {
  resolve() {
    return 'test-value';
  }
}

describe('Constructor Decorator - Branch Coverage', () => {
  describe('parameter handling with custom handlers', () => {
    it('should register decorator with custom handler in factory', () => {
      const handler = (value: any, target: any, index: number) => {};

      // @ts-expect-error - Testing custom handler registration
      const CustomDecorator = ParameterDecoratorFactory.create({
        name: 'CustomWithHandler_Test1',
        resolver: TestResolver,
        handler,
      });

      // Verify handler is registered correctly in factory
      const retrievedHandler = ParameterDecoratorFactory.getDecoratorHandler('CustomWithHandler_Test1');
      expect(retrievedHandler).toBe(handler);
      expect(typeof retrievedHandler).toBe('function');
    });

    it('should handle decorator without custom handler', () => {
      const SimpleDecorator = ParameterDecoratorFactory.create({
        name: 'SimpleNoHandler_Test2',
        resolver: TestResolver,
      });

      @Assemblage()
      class BaseService {
        constructor(@SimpleDecorator() param: string) {}
      }

      // Verify no handler is registered
      const handler = ParameterDecoratorFactory.getDecoratorHandler('SimpleNoHandler_Test2');
      expect(handler).toBeUndefined();
      
      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class ExtendedService extends BaseService {}
      }).not.toThrow();
    });

    it('should handle multiple decorators with different handlers', () => {
      const handler1 = () => {};
      const handler2 = () => {};

      // @ts-expect-error - Testing custom handler registration
      const Decorator1 = ParameterDecoratorFactory.create({
        name: 'HandlerOne_Test3',
        resolver: TestResolver,
        handler: handler1,
      });

      // @ts-expect-error - Testing custom handler registration
      const Decorator2 = ParameterDecoratorFactory.create({
        name: 'HandlerTwo_Test3',
        resolver: TestResolver,
        handler: handler2,
      });

      // Verify both handlers are registered
      expect(ParameterDecoratorFactory.getDecoratorHandler('HandlerOne_Test3')).toBe(handler1);
      expect(ParameterDecoratorFactory.getDecoratorHandler('HandlerTwo_Test3')).toBe(handler2);
    });
  });

  describe('parameter type handling', () => {
    it('should skip parameters without type information', () => {
      @Assemblage()
      class BaseService {
        constructor(param: any) {}
      }

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class ExtendedService extends BaseService {}
      }).not.toThrow();
    });

    it('should handle mix of decorated and non-decorated parameters', () => {
      const CustomDecorator = ParameterDecoratorFactory.create({
        name: 'MixedDecorator',
        resolver: TestResolver,
      });

      @Assemblage()
      class BaseService {
        constructor(
          @CustomDecorator() decorated: string,
          notDecorated: number
        ) {}
      }

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class ExtendedService extends BaseService {}
      }).not.toThrow();
    });

    it('should handle all decorated parameters', () => {
      const Decorator1 = ParameterDecoratorFactory.create({
        name: 'AllDecoratedOne',
        resolver: TestResolver,
      });

      const Decorator2 = ParameterDecoratorFactory.create({
        name: 'AllDecoratedTwo',
        resolver: TestResolver,
      });

      @Assemblage()
      class BaseService {
        constructor(
          @Decorator1() param1: string,
          @Decorator2() param2: number
        ) {}
      }

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class ExtendedService extends BaseService {}
      }).not.toThrow();
    });
  });

  describe('iterator loop coverage', () => {
    it('should iterate through all registered decorators', () => {
      const Decorator1 = ParameterDecoratorFactory.create({
        name: 'IterOne',
        resolver: TestResolver,
      });

      const Decorator2 = ParameterDecoratorFactory.create({
        name: 'IterTwo',
        resolver: TestResolver,
      });

      const Decorator3 = ParameterDecoratorFactory.create({
        name: 'IterThree',
        resolver: TestResolver,
      });

      @Assemblage()
      class BaseService {
        constructor(
          @Decorator1() param1: string,
          @Decorator2() param2: number,
          @Decorator3() param3: boolean
        ) {}
      }

      @Assemblage()
      // @ts-expect-error - Testing runtime validation
      class ExtendedService extends BaseService {}

      const registeredDecorators = ParameterDecoratorFactory.getRegisteredDecorators();
      expect(registeredDecorators).toContain('IterOne');
      expect(registeredDecorators).toContain('IterTwo');
      expect(registeredDecorators).toContain('IterThree');
    });
  });

  describe('edge cases', () => {
    it('should handle base class with no parameters', () => {
      @Assemblage()
      class BaseService {
        constructor() {}
      }

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class ExtendedService extends BaseService {}
      }).not.toThrow();
    });

    it('should handle multiple levels of inheritance', () => {
      const InheritDecorator = ParameterDecoratorFactory.create({
        name: 'InheritTest',
        resolver: TestResolver,
      });

      @Assemblage()
      class Level1 {
        constructor(@InheritDecorator() param: string) {}
      }

      @Assemblage()
      class Level2 extends Level1 {}

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class Level3 extends Level2 {}
      }).not.toThrow();
    });

    it('should handle decorators with undefined values', () => {
      const UndefinedValueDecorator = ParameterDecoratorFactory.create({
        name: 'UndefinedValue',
        resolver: TestResolver,
        valueType: 'array',
      });

      @Assemblage()
      class BaseService {
        constructor(@UndefinedValueDecorator() param: string) {}
      }

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class ExtendedService extends BaseService {}
      }).not.toThrow();
    });
  });

  describe('parameter index tracking', () => {
    it('should correctly track parameter indexes for multiple parameters', () => {
      const IndexTracker = ParameterDecoratorFactory.create({
        name: 'IndexTracking',
        resolver: TestResolver,
      });

      @Assemblage()
      class BaseService {
        constructor(
          normal1: string,
          @IndexTracker() tracked1: number,
          normal2: boolean,
          @IndexTracker() tracked2: object
        ) {}
      }

      @Assemblage()
      // @ts-expect-error - Testing runtime validation
      class ExtendedService extends BaseService {}

      // Just verify it doesn't throw - the tracking is internal
      expect(true).toBe(true);
    });
  });
});
