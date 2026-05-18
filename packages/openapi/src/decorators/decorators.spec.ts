import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenApiMetadataStorageImpl } from '../metadata/openapi-metadata-storage';

// We test the decorators by injecting a fresh storage instance so tests remain
// isolated from the global singleton.

let storage: OpenApiMetadataStorageImpl;

// Helpers to build decorators bound to a custom storage instance.
function makeDecorators(s: OpenApiMetadataStorageImpl) {
  const Hidden = () => (target: any, propertyKey?: string | symbol): any => {
    if (propertyKey === undefined) {
      s.ignoreController(target);
    } else {
      s.ignoreHandler(target.constructor, propertyKey);
    }
  };

  const Operation =
    (meta: { summary?: string; description?: string; deprecated?: boolean }) =>
    (target: any, propertyKey: string | symbol) =>
      s.addOperation(target.constructor, propertyKey, meta);

  const Returns =
    (status: number, dtoClass?: Function, description?: string) =>
    (target: any, propertyKey: string | symbol) =>
      s.addResponse(target.constructor, propertyKey, {
        kind: 'returns',
        status,
        dtoClass,
        description,
      });

  const Throws =
    (status: number, description?: string) =>
    (target: any, propertyKey: string | symbol) =>
      s.addResponse(target.constructor, propertyKey, {
        kind: 'throws',
        status,
        description,
      });

  return { Hidden, Operation, Returns, Throws };
}

beforeEach(() => {
  storage = new OpenApiMetadataStorageImpl();
});

describe('@Hidden', () => {
  it('marks a method as ignored when used as method decorator', () => {
    const { Hidden } = makeDecorators(storage);

    class Ctrl {
      @Hidden()
      secret() {}
    }

    expect(storage.isIgnored(Ctrl, 'secret')).toBe(true);
    expect(storage.isIgnored(Ctrl, 'other')).toBe(false);
  });

  it('marks the whole controller as ignored when used as class decorator', () => {
    const { Hidden } = makeDecorators(storage);

    @Hidden()
    class InternalCtrl {}

    expect(storage.isIgnored(InternalCtrl)).toBe(true);
    expect(storage.isIgnored(InternalCtrl, 'anyHandler')).toBe(true);
  });
});

describe('@Operation', () => {
  it('stores summary and description', () => {
    const { Operation } = makeDecorators(storage);

    class Ctrl {
      @Operation({ summary: 'List all', description: 'Returns everything.' })
      getAll() {}
    }

    const op = storage.getOperation(Ctrl, 'getAll');
    expect(op?.summary).toBe('List all');
    expect(op?.description).toBe('Returns everything.');
  });

  it('stores deprecated flag', () => {
    const { Operation } = makeDecorators(storage);

    class Ctrl {
      @Operation({ deprecated: true })
      oldEndpoint() {}
    }

    expect(storage.getOperation(Ctrl, 'oldEndpoint')?.deprecated).toBe(true);
  });

  it('returns undefined for a handler with no @Operation', () => {
    class Ctrl { undecorated() {} }
    expect(storage.getOperation(Ctrl, 'undecorated')).toBeUndefined();
  });
});

describe('@Returns', () => {
  it('stores a success response without DTO', () => {
    const { Returns } = makeDecorators(storage);

    class Ctrl {
      @Returns(200)
      getAll() {}
    }

    const [resp] = storage.getResponsesForHandler(Ctrl, 'getAll');
    expect(resp.kind).toBe('returns');
    expect(resp.status).toBe(200);
    expect((resp as any).dtoClass).toBeUndefined();
  });

  it('stores a success response with DTO class', () => {
    const { Returns } = makeDecorators(storage);
    class MyDto {}

    class Ctrl {
      @Returns(200, MyDto, 'OK')
      getOne() {}
    }

    const [resp] = storage.getResponsesForHandler(Ctrl, 'getOne');
    expect(resp.kind).toBe('returns');
    expect((resp as any).dtoClass).toBe(MyDto);
    expect(resp.description).toBe('OK');
  });
});

describe('@Throws', () => {
  it('stores an error response', () => {
    const { Throws } = makeDecorators(storage);

    class Ctrl {
      @Throws(404, 'Not found')
      getOne() {}
    }

    const [resp] = storage.getResponsesForHandler(Ctrl, 'getOne');
    expect(resp.kind).toBe('throws');
    expect(resp.status).toBe(404);
    expect(resp.description).toBe('Not found');
  });

  it('stacks multiple error responses', () => {
    const { Throws } = makeDecorators(storage);

    class Ctrl {
      @Throws(400)
      @Throws(404)
      getOne() {}
    }

    expect(storage.getResponsesForHandler(Ctrl, 'getOne')).toHaveLength(2);
  });
});
