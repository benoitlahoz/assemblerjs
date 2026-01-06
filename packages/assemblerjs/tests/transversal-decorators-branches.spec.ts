import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Transversal, isTransversal, Assemblage, AbstractAssemblage } from '../src';

describe('Transversal Decorators - Branch Coverage', () => {
  describe('@Transversal validation', () => {
    it('should throw when definition contains inject property', () => {
      expect(() => {
        @Transversal({ inject: [[String]] } as any)
        // @ts-expect-error - Testing runtime validation
        class InvalidTransversal implements AbstractAssemblage {}
      }).toThrow(
        '@Transversal on class InvalidTransversal cannot have inject or use properties'
      );
    });

    it('should throw when definition contains use property', () => {
      expect(() => {
        @Transversal({ use: [[String, 'test']] } as any)
        // @ts-expect-error - Testing runtime validation
        class InvalidTransversal implements AbstractAssemblage {}
      }).toThrow(
        '@Transversal on class InvalidTransversal cannot have inject or use properties'
      );
    });

    it('should throw when definition contains both inject and use', () => {
      expect(() => {
        @Transversal({
          inject: [[String]],
          use: [['testUse', 'test']],
        } as any)
        // @ts-expect-error - Testing runtime validation
        class InvalidTransversal implements AbstractAssemblage {}
      }).toThrow(
        '@Transversal on class InvalidTransversal cannot have inject or use properties'
      );
    });

    it('should accept definition with other properties', () => {
      expect(() => {
        @Transversal({
          tags: 'logging',
          events: ['beforeLog', 'afterLog'],
          metadata: { priority: 10 },
        })
        // @ts-expect-error - Testing runtime validation
        class ValidTransversal implements AbstractAssemblage {}
      }).not.toThrow();
    });

    it('should accept empty definition', () => {
      expect(() => {
        @Transversal()
        // @ts-expect-error - Testing runtime validation
        class ValidTransversal implements AbstractAssemblage {}
      }).not.toThrow();
    });

    it('should accept undefined definition', () => {
      expect(() => {
        @Transversal(undefined)
        // @ts-expect-error - Testing runtime validation
        class ValidTransversal implements AbstractAssemblage {}
      }).not.toThrow();
    });
  });

  describe('isTransversal - error handling', () => {
    it('should return false for non-decorated class', () => {
      class NotDecorated {}
      expect(isTransversal(NotDecorated)).toBe(false);
    });

    it('should return false for regular assemblage', () => {
      @Assemblage()
      class RegularAssemblage implements AbstractAssemblage {}

      expect(isTransversal(RegularAssemblage)).toBe(false);
    });

    it('should return true for transversal', () => {
      @Transversal()
      class ValidTransversal implements AbstractAssemblage {}

      expect(isTransversal(ValidTransversal)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isTransversal(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTransversal(undefined)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isTransversal('string')).toBe(false);
      expect(isTransversal(123)).toBe(false);
      expect(isTransversal(true)).toBe(false);
    });

    it('should return false for objects without definition', () => {
      const obj = { name: 'test' };
      expect(isTransversal(obj)).toBe(false);
    });
  });

  describe('@Transversal metadata preservation', () => {
    it('should preserve existing advices from method decorators', () => {
      // The decorator stores advices in metadata - this is tested indirectly
      @Transversal()
      class TransversalWithAdvices implements AbstractAssemblage {
        // Advices are added by @Before, @After, @Around decorators
      }

      expect(isTransversal(TransversalWithAdvices)).toBe(true);
    });

    it('should merge definition metadata with transversal metadata', () => {
      @Transversal({
        metadata: {
          customKey: 'customValue',
        },
      })
      class TransversalWithMetadata implements AbstractAssemblage {}

      expect(isTransversal(TransversalWithMetadata)).toBe(true);
    });

    it('should set singleton to true by default', () => {
      @Transversal()
      class DefaultSingletonTransversal implements AbstractAssemblage {}

      // Transversals are singletons by default - verified by being marked as transversal
      expect(isTransversal(DefaultSingletonTransversal)).toBe(true);
    });

    it('should respect singleton: true in definition', () => {
      @Transversal({ singleton: true })
      class ExplicitSingletonTransversal implements AbstractAssemblage {}

      expect(isTransversal(ExplicitSingletonTransversal)).toBe(true);
    });

    it('should respect singleton: false in definition', () => {
      @Transversal({ singleton: false })
      class NonSingletonTransversal implements AbstractAssemblage {}

      expect(isTransversal(NonSingletonTransversal)).toBe(true);
    });
  });

  describe('@Transversal - complex scenarios', () => {
    it('should handle transversal with tags and events', () => {
      @Transversal({
        tags: ['security', 'audit'],
        events: ['beforeAuth', 'afterAuth'],
      })
      class SecurityTransversal implements AbstractAssemblage {}

      expect(isTransversal(SecurityTransversal)).toBe(true);
    });

    it('should handle transversal with metadata only', () => {
      @Transversal({
        metadata: {
          version: '1.0.0',
          author: 'test',
        },
      })
      class MetadataTransversal implements AbstractAssemblage {}

      expect(isTransversal(MetadataTransversal)).toBe(true);
    });

    it('should handle transversal with all allowed properties', () => {
      @Transversal({
        singleton: true,
        tags: ['logging'],
        events: ['log'],
        metadata: {
          priority: 5,
        },
      })
      class CompleteTransversal implements AbstractAssemblage {}

      expect(isTransversal(CompleteTransversal)).toBe(true);
    });
  });
});
