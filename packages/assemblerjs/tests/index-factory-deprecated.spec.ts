import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { createParamIndexDecorator } from '@/shared/decorators/parameters/index-factory';
import { getOwnCustomMetadata } from '@/shared/common';

describe('index-factory.ts - Deprecated Parameter Index Decorator Factory', () => {
  describe('createParamIndexDecorator', () => {
    it('should create a decorator that stores parameter indexes', () => {
      const TEST_KEY = 'test:param.index';
      const TestDecorator = createParamIndexDecorator(TEST_KEY);

      class TestClass {
        constructor(@TestDecorator() _param1: string) {}
      }

      const indexes = getOwnCustomMetadata(TEST_KEY, TestClass);
      expect(indexes).toEqual([0]);
    });

    it('should handle multiple decorated parameters', () => {
      const TEST_KEY = 'test:multiple.param.index';
      const TestDecorator = createParamIndexDecorator(TEST_KEY);

      class TestClass {
        constructor(
          @TestDecorator() _param1: string,
          _param2: number,
          @TestDecorator() _param3: boolean
        ) {}
      }

      const indexes = getOwnCustomMetadata(TEST_KEY, TestClass);
      expect(indexes).toEqual([2, 0]);
    });

    it('should handle same parameter decorated multiple times', () => {
      const TEST_KEY = 'test:duplicate.param.index';
      const TestDecorator = createParamIndexDecorator(TEST_KEY);

      // This tests the legacy behavior where the same parameter could be decorated twice
      // and the indexes array would contain duplicates
      class TestClass {
        constructor(
          @TestDecorator()
          @TestDecorator()
          _param1: string
        ) {}
      }

      const indexes = getOwnCustomMetadata(TEST_KEY, TestClass);
      // Legacy behavior: stores the index twice if decorated twice
      expect(indexes).toEqual([0, 0]);
    });
  });
});
