import { describe, it, expect, beforeEach } from 'vitest';
import { ResolverStore } from '../src/shared/decorators/resolvers/resolver-store';
import type { ParameterResolver } from '../src/shared/decorators/types';
import type { AbstractInjectable } from '@/features/injectable/model/abstract';
import type { Concrete } from '@assemblerjs/core';

// Mock resolver for testing
class MockResolver implements ParameterResolver {
  resolve(_index: number, _injectable: AbstractInjectable<any>, _concrete: Concrete<any>): any {
    return 'mock-value';
  }
}

class AnotherMockResolver implements ParameterResolver {
  resolve(_index: number, _injectable: AbstractInjectable<any>, _concrete: Concrete<any>): any {
    return 'another-mock-value';
  }
}

describe('ResolverStore', () => {
  beforeEach(() => {
    // Clear store before each test
    ResolverStore.clear();
  });

  describe('register', () => {
    it('should register a resolver for a type', () => {
      ResolverStore.register('Mock', MockResolver);
      expect(ResolverStore.hasResolver('Mock')).toBe(true);
    });

    it('should allow registering multiple resolvers', () => {
      ResolverStore.register('Mock1', MockResolver);
      ResolverStore.register('Mock2', AnotherMockResolver);
      
      expect(ResolverStore.hasResolver('Mock1')).toBe(true);
      expect(ResolverStore.hasResolver('Mock2')).toBe(true);
    });
  });

  describe('getResolver', () => {
    it('should return a resolver instance for a registered type', () => {
      ResolverStore.register('Mock', MockResolver);
      const resolver = ResolverStore.getResolver('Mock');
      
      expect(resolver).toBeInstanceOf(MockResolver);
      expect(resolver.resolve(0, {} as any, {} as any)).toBe('mock-value');
    });

    it('should throw an error for unregistered type', () => {
      expect(() => ResolverStore.getResolver('NonExistent')).toThrow(
        'No resolver found for decorator type: NonExistent'
      );
    });

    it('should return different instances on each call', () => {
      ResolverStore.register('Mock', MockResolver);
      const resolver1 = ResolverStore.getResolver('Mock');
      const resolver2 = ResolverStore.getResolver('Mock');
      
      expect(resolver1).not.toBe(resolver2);
      expect(resolver1).toBeInstanceOf(MockResolver);
      expect(resolver2).toBeInstanceOf(MockResolver);
    });
  });

  describe('hasResolver', () => {
    it('should return true for registered type', () => {
      ResolverStore.register('Mock', MockResolver);
      expect(ResolverStore.hasResolver('Mock')).toBe(true);
    });

    it('should return false for unregistered type', () => {
      expect(ResolverStore.hasResolver('NonExistent')).toBe(false);
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return empty array when no resolvers registered', () => {
      expect(ResolverStore.getRegisteredTypes()).toEqual([]);
    });

    it('should return all registered types', () => {
      ResolverStore.register('Mock1', MockResolver);
      ResolverStore.register('Mock2', AnotherMockResolver);
      ResolverStore.register('Mock3', MockResolver);
      
      const types = ResolverStore.getRegisteredTypes();
      expect(types).toContain('Mock1');
      expect(types).toContain('Mock2');
      expect(types).toContain('Mock3');
      expect(types).toHaveLength(3);
    });
  });

  describe('clear', () => {
    it('should clear all registered resolvers', () => {
      ResolverStore.register('Mock1', MockResolver);
      ResolverStore.register('Mock2', AnotherMockResolver);
      
      expect(ResolverStore.getRegisteredTypes()).toHaveLength(2);
      
      ResolverStore.clear();
      
      expect(ResolverStore.getRegisteredTypes()).toHaveLength(0);
      expect(ResolverStore.hasResolver('Mock1')).toBe(false);
      expect(ResolverStore.hasResolver('Mock2')).toBe(false);
    });
  });
});
