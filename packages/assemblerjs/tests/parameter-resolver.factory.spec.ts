import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterResolverFactory } from '../src/shared/decorators/resolvers/parameter-resolver.factory';
import { ResolverStore } from '../src/shared/decorators/resolvers/resolver-store';
import type { ParameterResolver } from '../src/shared/decorators/types';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import type { Concrete } from '@assemblerjs/core';

// Mock resolver for testing
class TestResolver implements ParameterResolver {
  resolve(_index: number, _injectable: AbstractInjectable<any>, _concrete: Concrete<any>): any {
    return 'test-value';
  }
}

describe('ParameterResolverFactory', () => {
  beforeEach(() => {
    ResolverStore.clear();
  });

  describe('getResolver', () => {
    it('should get a resolver from the store', () => {
      ResolverStore.register('Test', TestResolver);
      const resolver = ParameterResolverFactory.getResolver('Test');
      
      expect(resolver).toBeInstanceOf(TestResolver);
    });

    it('should throw for non-existent resolver', () => {
      expect(() => ParameterResolverFactory.getResolver('NonExistent')).toThrow();
    });
  });

  describe('registerResolver', () => {
    it('should register a resolver in the store', () => {
      ParameterResolverFactory.registerResolver('Test', TestResolver);
      
      expect(ResolverStore.hasResolver('Test')).toBe(true);
      const resolver = ParameterResolverFactory.getResolver('Test');
      expect(resolver).toBeInstanceOf(TestResolver);
    });

    it('should allow registering multiple resolvers', () => {
      ParameterResolverFactory.registerResolver('Test1', TestResolver);
      ParameterResolverFactory.registerResolver('Test2', TestResolver);
      
      expect(ParameterResolverFactory.hasResolver('Test1')).toBe(true);
      expect(ParameterResolverFactory.hasResolver('Test2')).toBe(true);
    });
  });

  describe('hasResolver', () => {
    it('should return true for registered resolver', () => {
      ParameterResolverFactory.registerResolver('Test', TestResolver);
      expect(ParameterResolverFactory.hasResolver('Test')).toBe(true);
    });

    it('should return false for unregistered resolver', () => {
      expect(ParameterResolverFactory.hasResolver('NonExistent')).toBe(false);
    });
  });
});
