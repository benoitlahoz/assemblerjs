import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Assemblage } from '@/features/assemblage/lib';
import {
  validateDefinition,
  getDefinition,
  getDefinitionValue,
  setDefinitionValue,
} from '@/features/assemblage/lib/definition/schema';

describe('schema.ts - Definition Schema Validation', () => {
  describe('validateDefinition', () => {
    it('should reject invalid property names', () => {
      expect(() =>
        validateDefinition({
          invalidProperty: 'test',
        })
      ).toThrow(
        "Property 'invalidProperty' is not a valid assemblage definition property."
      );
    });

    it('should reject invalid singleton type', () => {
      expect(() =>
        validateDefinition({
          singleton: 'invalid',
        })
      ).toThrow(
        "'singleton' property must be of type 'boolean' or 'undefined'."
      );
    });

    it('should reject invalid events type', () => {
      expect(() =>
        validateDefinition({
          events: 'not-an-array',
        })
      ).toThrow(
        "'events' property must be an array of strings or 'undefined'."
      );

      expect(() =>
        validateDefinition({
          events: [123, 456],
        })
      ).toThrow(
        "'events' property must be an array of strings or 'undefined'."
      );
    });

    it('should reject invalid inject type', () => {
      expect(() =>
        validateDefinition({
          inject: 'not-an-array',
        })
      ).toThrow(
        "'inject' property must be an array of tuples of length 1, 2 or 3."
      );

      expect(() =>
        validateDefinition({
          inject: [[1, 2, 3, 4]], // too long
        })
      ).toThrow(
        "'inject' property must be an array of tuples of length 1, 2 or 3."
      );
    });

    it('should reject invalid use type', () => {
      expect(() =>
        validateDefinition({
          use: 'not-an-array',
        })
      ).toThrow("'use' property must be an array of tuples of length 2 with [identifier, instance | factory].");

      expect(() =>
        validateDefinition({
          use: [[1, 2, 3]], // wrong length
        })
      ).toThrow("'use' property must be an array of tuples of length 2 with [identifier, instance | factory].");
    });

    it('should reject invalid engage type', () => {
      expect(() =>
        validateDefinition({
          engage: 'not-an-array',
        })
      ).toThrow(
        "'engage' property must be an array of tuples of length 1, 2 or 3."
      );

      expect(() =>
        validateDefinition({
          engage: [[1, 2, 3, 4]], // too long
        })
      ).toThrow(
        "'engage' property must be an array of tuples of length 1, 2 or 3."
      );
    });

    it('should reject invalid tags type', () => {
      expect(() =>
        validateDefinition({
          tags: 123,
        })
      ).toThrow(
        "'tags' property must be a string or an array of strings."
      );

      expect(() =>
        validateDefinition({
          tags: [123, 456],
        })
      ).toThrow(
        "'tags' property must be a string or an array of strings."
      );
    });

    it('should reject invalid metadata type', () => {
      expect(() =>
        validateDefinition({
          metadata: [],
        })
      ).toThrow(
        "'metadata' property must be of type 'object' or 'undefined'."
      );
    });

    it('should reject invalid global type', () => {
      expect(() =>
        validateDefinition({
          global: [],
        })
      ).toThrow("'global' property must be of type 'object' or 'undefined'.");
    });

    it('should transform singleton undefined to true', () => {
      const result = validateDefinition({});
      expect(result.singleton).toBe(true);
    });

    it('should transform tags string to array', () => {
      const result = validateDefinition({
        tags: 'single-tag',
      });
      expect(result.tags).toEqual(['single-tag']);
    });

    it('should keep tags array as is', () => {
      const result = validateDefinition({
        tags: ['tag1', 'tag2'],
      });
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('should accept valid definition with all properties', () => {
      const definition = {
        singleton: false,
        events: ['event1', 'event2'],
        inject: [[Symbol.for('Logger')]],
        use: [[String, new String('test')]],
        engage: [[Symbol.for('Transversal')]],
        tags: ['tag1'],
        metadata: { key: 'value' },
        global: { id: 'test' },
      };

      const result = validateDefinition(definition);
      expect(result.singleton).toBe(false);
      expect(result.events).toEqual(['event1', 'event2']);
      expect(result.tags).toEqual(['tag1']);
    });
  });

  describe('getDefinition, getDefinitionValue, setDefinitionValue', () => {
    @Assemblage({ tags: 'test' })
    class TestAssemblage {}

    class NotAnAssemblage {}

    it('should throw when getting definition of non-assemblage', () => {
      expect(() => getDefinition(NotAnAssemblage)).toThrow(
        "Class 'NotAnAssemblage' is not an assemblage or transversal."
      );
    });

    it('should get definition value', () => {
      const tags = getDefinitionValue('tags', TestAssemblage);
      expect(tags).toEqual(['test']);
    });

    it('should set and validate definition value', () => {
      const result = setDefinitionValue(
        'events',
        ['event1', 'event2'],
        TestAssemblage
      );
      expect(result.events).toEqual(['event1', 'event2']);
    });

    it('should throw when setting invalid definition value', () => {
      expect(() =>
        setDefinitionValue('events', 'not-an-array', TestAssemblage)
      ).toThrow(
        "'events' property must be an array of strings or 'undefined'."
      );
    });
  });
});
