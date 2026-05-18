import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenApiGenerator, type RestMetadataStorage } from './openapi-generator';
import { OpenApiMetadataStorageImpl } from '../metadata/openapi-metadata-storage';

// ---------------------------------------------------------------------------
// Helpers to build test doubles
// ---------------------------------------------------------------------------

function makeRestStorage(overrides?: Partial<RestMetadataStorage>): RestMetadataStorage {
  return {
    getAllControllers: vi.fn(() => []),
    getControllerPath: vi.fn(() => '/'),
    getRoutesForClass: vi.fn(() => []),
    ...overrides,
  };
}

function makeDtoExtractor(schema?: object): { extract(cls: Function): object } {
  return {
    extract: vi.fn(
      () =>
        schema ?? {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
          required: ['id', 'name'],
        }
    ),
  };
}

describe('OpenApiGenerator', () => {
  let generator: OpenApiGenerator;
  let openApiStorage: OpenApiMetadataStorageImpl;

  beforeEach(() => {
    generator = new OpenApiGenerator();
    openApiStorage = new OpenApiMetadataStorageImpl();
  });

  it('throws if generate() is called before configure()', () => {
    generator._setStorages(makeRestStorage(), openApiStorage);
    expect(() => generator.generate()).toThrow(/called before configure/);
  });

  it('returns a valid OpenAPI 3.0.3 envelope', () => {
    generator._setStorages(makeRestStorage(), openApiStorage);
    generator.configure({ info: { title: 'Test API', version: '0.1.0' } });
    const spec = generator.generate() as any;
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info).toMatchObject({ title: 'Test API', version: '0.1.0' });
    expect(spec.paths).toBeDefined();
  });

  it('includes servers when provided', () => {
    generator._setStorages(makeRestStorage(), openApiStorage);
    generator.configure({
      info: { title: 'T', version: '1' },
      servers: [{ url: 'http://localhost:3000' }],
    });
    expect((generator.generate() as any).servers).toEqual([{ url: 'http://localhost:3000' }]);
  });

  it('omits servers when not provided', () => {
    generator._setStorages(makeRestStorage(), openApiStorage);
    generator.configure({ info: { title: 'T', version: '1' } });
    expect((generator.generate() as any).servers).toBeUndefined();
  });

  it('generates a path entry for a registered route', () => {
    class CtrlA {}
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlA]),
        getControllerPath: vi.fn(() => '/users'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/', handlerName: 'getAll', summary: 'List all users' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;

    expect(spec.paths['/users']).toBeDefined();
    expect(spec.paths['/users']['get']).toMatchObject({
      tags: ['users'],
      summary: 'List all users',
    });
  });

  it('converts Express-style params to OpenAPI-style in path keys', () => {
    class CtrlB {}
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlB]),
        getControllerPath: vi.fn(() => '/users'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: ':id', handlerName: 'getOne', summary: '' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    expect((generator.generate() as any).paths['/users/{id}']).toBeDefined();
  });

  it('skips an ignored controller', () => {
    class CtrlIgnored {}
    openApiStorage.ignoreController(CtrlIgnored);
    generator._setStorages(
      makeRestStorage({ getAllControllers: vi.fn(() => [CtrlIgnored]) }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    expect(Object.keys((generator.generate() as any).paths)).toHaveLength(0);
  });

  it('skips an ignored handler but keeps other handlers', () => {
    class CtrlPartial {}
    openApiStorage.ignoreHandler(CtrlPartial, 'secret');
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlPartial]),
        getControllerPath: vi.fn(() => '/users'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/', handlerName: 'getAll', summary: '' },
          { method: 'GET', path: '/secret', handlerName: 'secret', summary: '' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.paths['/users']).toBeDefined();
    expect(spec.paths['/users/secret']).toBeUndefined();
  });

  it('adds declared responses to the operation', () => {
    class CtrlResponses {}
    openApiStorage.addResponse(CtrlResponses, 'getAll', { kind: 'returns', status: 200, description: 'OK' });
    openApiStorage.addResponse(CtrlResponses, 'getAll', { kind: 'throws', status: 500, description: 'Server error' });
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlResponses]),
        getControllerPath: vi.fn(() => '/items'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/', handlerName: 'getAll', summary: '' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.paths['/items']['get'].responses['200']).toMatchObject({ description: 'OK' });
    expect(spec.paths['/items']['get'].responses['500']).toMatchObject({ description: 'Server error' });
  });

  it('adds a DTO $ref and registers the schema in components', () => {
    class ItemDto {}
    class CtrlDto {}
    openApiStorage.addResponse(CtrlDto, 'getOne', { kind: 'returns', status: 200, dtoClass: ItemDto });
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlDto]),
        getControllerPath: vi.fn(() => '/items'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: ':id', handlerName: 'getOne', summary: '' },
        ]),
      }),
      openApiStorage,
      makeDtoExtractor()
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.components.schemas['ItemDto']).toBeDefined();
    expect(
      spec.paths['/items/{id}']['get'].responses['200'].content['application/json'].schema
    ).toEqual({ $ref: '#/components/schemas/ItemDto' });
  });

  it('@Operation summary takes priority over route info', () => {
    class CtrlOp {}
    openApiStorage.addOperation(CtrlOp, 'getAll', {
      summary: 'Custom summary',
      description: 'Long description.',
    });
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlOp]),
        getControllerPath: vi.fn(() => '/things'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/', handlerName: 'getAll', summary: 'Inline info' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.paths['/things']['get'].summary).toBe('Custom summary');
    expect(spec.paths['/things']['get'].description).toBe('Long description.');
  });

  it('falls back to route info when no @Operation summary', () => {
    class CtrlFallback {}
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlFallback]),
        getControllerPath: vi.fn(() => '/things'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/', handlerName: 'getAll', summary: 'Inline info' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.paths['/things']['get'].summary).toBe('Inline info');
  });

  it('derives tag from class name when base path is root', () => {
    class RootController {}
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [RootController]),
        getControllerPath: vi.fn(() => '/'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/ping', handlerName: 'ping', summary: '' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.paths['/ping']['get'].tags).toEqual(['Root']);
  });

  it('adds a default 200 response when no responses are decorated', () => {
    class CtrlDefault {}
    generator._setStorages(
      makeRestStorage({
        getAllControllers: vi.fn(() => [CtrlDefault]),
        getControllerPath: vi.fn(() => '/ping'),
        getRoutesForClass: vi.fn(() => [
          { method: 'GET', path: '/', handlerName: 'ping', summary: '' },
        ]),
      }),
      openApiStorage
    );

    generator.configure({ info: { title: 'T', version: '1' } });
    const spec = generator.generate() as any;
    expect(spec.paths['/ping']['get'].responses['200']).toMatchObject({ description: 'Success' });
  });
});
