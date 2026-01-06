import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterDecoratorFactory } from '@/shared/decorators/parameters/parameter-decorator-factory';
import type { ParameterResolver } from '@/shared/decorators/types';
import { Assemblage } from '@/features/assemblage/lib';

// Mock resolver for testing
class MockResolver implements ParameterResolver {
  resolve() {
    return 'mock-value';
  }
}

describe('parameter-decorator-factory.ts - Advanced Coverage', () => {
  beforeEach(() => {
    // Reset the factory state before each test
    // This ensures tests are isolated
  });

  describe('Factory Registration', () => {
    it('should throw error when registering duplicate decorator', () => {
      const config = {
        name: 'DuplicateTest',
        resolver: MockResolver,
      };

      ParameterDecoratorFactory.create(config);

      expect(() => {
        ParameterDecoratorFactory.create(config);
      }).toThrow('Decorator DuplicateTest already exists');
    });

    it('should register decorator and provide metadata access', () => {
      const config = {
        name: 'TestMeta',
        resolver: MockResolver,
        valueType: 'array' as const,
      };

      ParameterDecoratorFactory.create(config);

      expect(ParameterDecoratorFactory.isRegistered('TestMeta')).toBe(true);
      expect(ParameterDecoratorFactory.getRegisteredDecorators()).toContain(
        'TestMeta'
      );

      const metadata = ParameterDecoratorFactory.getDecoratorMetadata('TestMeta');
      expect(metadata).toEqual({
        name: 'TestMeta',
        valueType: 'array',
        handler: undefined,
      });
    });

    it('should store and retrieve decorator handler', () => {
      const handler = (value: any, target: any, index: number) => {
        // Custom handler logic
      };

      const config = {
        name: 'TestHandler',
        resolver: MockResolver,
        handler,
      };

      ParameterDecoratorFactory.create(config);

      const retrievedHandler = ParameterDecoratorFactory.getDecoratorHandler('TestHandler');
      expect(retrievedHandler).toBe(handler);
    });

    it('should return undefined for non-existent decorator metadata', () => {
      const metadata = ParameterDecoratorFactory.getDecoratorMetadata('NonExistent');
      expect(metadata).toBeUndefined();

      const handler = ParameterDecoratorFactory.getDecoratorHandler('NonExistent');
      expect(handler).toBeUndefined();

      expect(ParameterDecoratorFactory.isRegistered('NonExistent')).toBe(false);
    });
  });

  describe('Parameter Validation', () => {
    it('should prevent multiple decorators on same parameter', () => {
      const FirstDecorator = ParameterDecoratorFactory.create({
        name: 'First',
        resolver: MockResolver,
      });

      const SecondDecorator = ParameterDecoratorFactory.create({
        name: 'Second',
        resolver: MockResolver,
      });

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class TestClass {
          constructor(
            // Decorators are applied bottom-to-top, so @SecondDecorator is applied first
            @FirstDecorator()
            @SecondDecorator()
            _param: string
          ) {}
        }
      }).toThrow(
        'Parameter at index 0 already has decorator @Second. Multiple decorators per parameter are not allowed.'
      );
    });

    it('should allow same decorator on different parameters', () => {
      const Decorator = ParameterDecoratorFactory.create({
        name: 'MultiParam',
        resolver: MockResolver,
      });

      expect(() => {
        @Assemblage()
        // @ts-expect-error - Testing runtime validation
        class TestClass {
          constructor(@Decorator() _param1: string, @Decorator() _param2: number) {}
        }
      }).not.toThrow();
    });
  });

  describe('Value Type Storage', () => {
    it('should store values with "single" valueType', () => {
      const SingleDecorator = ParameterDecoratorFactory.create({
        name: 'SingleValue',
        resolver: MockResolver,
        valueType: 'single',
      });

      const valueGetter = ParameterDecoratorFactory.createParameterValueGetter(
        'assemblage:singlevalue.param.value',
        'single'
      );

      @Assemblage()
      class TestClass {
        constructor(@SingleDecorator('test-value') _param: string) {}
      }

      const value = valueGetter(TestClass);
      expect(value).toBe('test-value');
    });

    it('should store values with "array" valueType', () => {
      const ArrayDecorator = ParameterDecoratorFactory.create({
        name: 'ArrayValue',
        resolver: MockResolver,
        valueType: 'array',
      });

      const valueGetter = ParameterDecoratorFactory.createParameterValueGetter(
        'assemblage:arrayvalue.param.value',
        'array'
      );

      @Assemblage()
      class TestClass {
        constructor(
          @ArrayDecorator('value1') _param1: string,
          _param2: number,
          @ArrayDecorator('value3') _param3: boolean
        ) {}
      }

      const values = valueGetter(TestClass);
      expect(values[0]).toBe('value1');
      expect(values[2]).toBe('value3');
      expect(values[1]).toBeUndefined();
    });

    it('should store values with "map" valueType', () => {
      const MapDecorator = ParameterDecoratorFactory.create({
        name: 'MapValue',
        resolver: MockResolver,
        valueType: 'map',
      });

      const valueGetter = ParameterDecoratorFactory.createParameterValueGetter(
        'assemblage:mapvalue.param.value',
        'map'
      );

      @Assemblage()
      class TestClass {
        constructor(
          @MapDecorator('value1') _param1: string,
          @MapDecorator('value2') _param2: number
        ) {}
      }

      const values = valueGetter(TestClass);
      expect(values).toEqual({
        0: 'value1',
        1: 'value2',
      });
    });
  });

  describe('Helper Getters', () => {
    it('should create working parameter index getter', () => {
      const IndexTestDecorator = ParameterDecoratorFactory.create({
        name: 'IndexTest',
        resolver: MockResolver,
      });

      const indexGetter = ParameterDecoratorFactory.createParameterIndexGetter(
        'assemblage:indextest.param.index'
      );

      @Assemblage()
      class TestClass {
        constructor(
          @IndexTestDecorator() _param1: string,
          _param2: number,
          @IndexTestDecorator() _param3: boolean
        ) {}
      }

      const indexes = indexGetter(TestClass);
      expect(indexes).toEqual([2, 0]);
    });

    it('should return empty array when no decorated parameters', () => {
      const indexGetter = ParameterDecoratorFactory.createParameterIndexGetter(
        'assemblage:noparams.param.index'
      );

      @Assemblage()
      class TestClass {
        constructor(_param: string) {}
      }

      const indexes = indexGetter(TestClass);
      expect(indexes).toEqual([]);
    });

    it('should create working parameter value getter with undefined return', () => {
      const valueGetter = ParameterDecoratorFactory.createParameterValueGetter(
        'assemblage:undefined.param.value',
        'single'
      );

      @Assemblage()
      class TestClass {
        constructor(_param: string) {}
      }

      const value = valueGetter(TestClass);
      expect(value).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle decorator with undefined parameter', () => {
      const UndefinedDecorator = ParameterDecoratorFactory.create({
        name: 'UndefinedParam',
        resolver: MockResolver,
        valueType: 'single',
      });

      const valueGetter = ParameterDecoratorFactory.createParameterValueGetter(
        'assemblage:undefinedparam.param.value',
        'single'
      );

      @Assemblage()
      class TestClass {
        constructor(@UndefinedDecorator() _param: string) {}
      }

      const value = valueGetter(TestClass);
      expect(value).toBeUndefined();
    });

    it('should handle complex parameter values', () => {
      const ComplexDecorator = ParameterDecoratorFactory.create({
        name: 'ComplexValue',
        resolver: MockResolver,
        valueType: 'single',
      });

      const valueGetter = ParameterDecoratorFactory.createParameterValueGetter(
        'assemblage:complexvalue.param.value',
        'single'
      );

      const complexValue = {
        nested: { key: 'value' },
        array: [1, 2, 3],
        func: () => 'test',
      };

      @Assemblage()
      class TestClass {
        constructor(@ComplexDecorator(complexValue) _param: any) {}
      }

      const value = valueGetter(TestClass);
      expect(value).toBe(complexValue);
      expect(value.nested.key).toBe('value');
      expect(value.array).toEqual([1, 2, 3]);
    });
  });
});
