import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { MetadataStorageImpl } from './metadata-storage';

describe('MetadataStorageImpl', () => {
  let storage: MetadataStorageImpl;

  beforeEach(() => {
    storage = new MetadataStorageImpl();
  });

  describe('routes', () => {
    it('adds and retrieves a route', () => {
      class C { myHandler() {} }
      const instance = new C();
      storage.addRoute(instance, 'get', 'users', 'myHandler', 'GET /users');
      const routes = storage.getRoutes(instance);
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({
        method: 'get',
        path: 'users',
        handlerName: 'myHandler',
      });
    });

    it('returns empty array when no routes registered', () => {
      class Empty {}
      expect(storage.getRoutes(new Empty())).toEqual([]);
    });
  });

  describe('HTTP statuses', () => {
    it('adds and retrieves an HTTP status for a handler', () => {
      class C { h() {} }
      const instance = new C();
      storage.addHttpStatus(instance, 'h', 201);
      const status = storage.getHttpStatusForHandler(instance, 'h');
      expect(status?.status).toBe(201);
    });

    it('returns undefined when no status set', () => {
      class C { h() {} }
      expect(storage.getHttpStatusForHandler(new C(), 'h')).toBeUndefined();
    });
  });

  describe('redirects', () => {
    it('adds and retrieves a redirect for a handler', () => {
      class C { h() {} }
      const instance = new C();
      storage.addRedirect(instance, 'h', '/target', 302);
      const redirect = storage.getRedirectForHandler(instance, 'h');
      expect(redirect).toMatchObject({ location: '/target', status: 302 });
    });

    it('returns undefined when no redirect set', () => {
      class C { h() {} }
      expect(storage.getRedirectForHandler(new C(), 'h')).toBeUndefined();
    });
  });
});
