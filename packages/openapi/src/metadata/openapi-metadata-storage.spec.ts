import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenApiMetadataStorageImpl } from './openapi-metadata-storage';

describe('OpenApiMetadataStorageImpl', () => {
  let storage: OpenApiMetadataStorageImpl;

  class MyController {}
  class OtherController {}

  beforeEach(() => {
    storage = new OpenApiMetadataStorageImpl();
  });

  // -------------------------------------------------------------------------
  // Responses
  // -------------------------------------------------------------------------

  describe('addResponse / getResponsesForHandler', () => {
    it('stores and retrieves a success response', () => {
      storage.addResponse(MyController, 'getAll', {
        kind: 'returns',
        status: 200,
        description: 'OK',
      });
      const responses = storage.getResponsesForHandler(MyController, 'getAll');
      expect(responses).toHaveLength(1);
      expect(responses[0]).toMatchObject({ kind: 'returns', status: 200 });
    });

    it('stores and retrieves an error response', () => {
      storage.addResponse(MyController, 'getOne', {
        kind: 'throws',
        status: 404,
        description: 'Not found',
      });
      const responses = storage.getResponsesForHandler(MyController, 'getOne');
      expect(responses[0]).toMatchObject({ kind: 'throws', status: 404 });
    });

    it('accumulates multiple responses for the same handler', () => {
      storage.addResponse(MyController, 'getOne', { kind: 'returns', status: 200 });
      storage.addResponse(MyController, 'getOne', { kind: 'throws', status: 404 });
      expect(storage.getResponsesForHandler(MyController, 'getOne')).toHaveLength(2);
    });

    it('returns empty array for an unregistered handler', () => {
      expect(storage.getResponsesForHandler(MyController, 'unknown')).toEqual([]);
    });

    it('isolates responses by controller', () => {
      storage.addResponse(MyController, 'h', { kind: 'returns', status: 200 });
      expect(storage.getResponsesForHandler(OtherController, 'h')).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Operations
  // -------------------------------------------------------------------------

  describe('addOperation / getOperation', () => {
    it('stores and retrieves an operation', () => {
      storage.addOperation(MyController, 'getAll', {
        summary: 'List all',
        description: 'Returns all items.',
        deprecated: false,
      });
      const op = storage.getOperation(MyController, 'getAll');
      expect(op?.summary).toBe('List all');
      expect(op?.description).toBe('Returns all items.');
    });

    it('returns undefined for an unregistered handler', () => {
      expect(storage.getOperation(MyController, 'missing')).toBeUndefined();
    });

    it('isolates operations by controller', () => {
      storage.addOperation(MyController, 'h', { summary: 'A' });
      expect(storage.getOperation(OtherController, 'h')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Ignore
  // -------------------------------------------------------------------------

  describe('ignoreHandler / ignoreController / isIgnored', () => {
    it('marks a specific handler as ignored', () => {
      storage.ignoreHandler(MyController, 'internalHandler');
      expect(storage.isIgnored(MyController, 'internalHandler')).toBe(true);
    });

    it('does not mark other handlers as ignored', () => {
      storage.ignoreHandler(MyController, 'internalHandler');
      expect(storage.isIgnored(MyController, 'publicHandler')).toBe(false);
    });

    it('marks an entire controller as ignored', () => {
      storage.ignoreController(MyController);
      expect(storage.isIgnored(MyController)).toBe(true);
    });

    it('controller-level ignore covers all handlers', () => {
      storage.ignoreController(MyController);
      expect(storage.isIgnored(MyController, 'anyHandler')).toBe(true);
    });

    it('does not affect other controllers', () => {
      storage.ignoreController(MyController);
      expect(storage.isIgnored(OtherController)).toBe(false);
    });

    it('returns false when nothing is registered', () => {
      expect(storage.isIgnored(MyController)).toBe(false);
      expect(storage.isIgnored(MyController, 'h')).toBe(false);
    });
  });
});
