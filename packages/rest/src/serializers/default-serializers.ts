import { GenericError } from '@/errors';
import type { ResponseSerializer } from './response-serializer.interface';

const ErrorSerializer: ResponseSerializer = {
  canHandle: (result) => result instanceof GenericError,
  serialize: (result: GenericError, res, _status) => {
    res.status(result.status).json({ error: result.message });
  },
};

const BufferSerializer: ResponseSerializer = {
  canHandle: (result) => Buffer.isBuffer(result),
  serialize: (result: Buffer, res, status) => {
    res.status(status).send(result);
  },
};

const StringSerializer: ResponseSerializer = {
  canHandle: (result) => typeof result === 'string',
  serialize: (result: string, res, status) => {
    res.status(status).send(result);
  },
};

const ArraySerializer: ResponseSerializer = {
  canHandle: (result) => Array.isArray(result),
  serialize: (result: any[], res, status) => {
    res.status(status).json(result);
  },
};

const ArrayBufferSerializer: ResponseSerializer = {
  canHandle: (result) => result instanceof ArrayBuffer,
  serialize: (result: ArrayBuffer, res, status) => {
    res.status(status).send(Buffer.from(result));
  },
};

const StreamSerializer: ResponseSerializer = {
  canHandle: (result) =>
    result !== null &&
    typeof result === 'object' &&
    typeof (result as any).pipe === 'function',
  serialize: (result: any, res) => {
    result.pipe(res);
  },
};

const ObjectSerializer: ResponseSerializer = {
  canHandle: (result) => typeof result === 'object' && result !== null,
  serialize: (result: object, res, status) => {
    res.status(status).json(result);
  },
};

const FallbackSerializer: ResponseSerializer = {
  canHandle: () => true,
  serialize: (result: any, res, status) => {
    res.status(status).send(result);
  },
};

/**
 * Default serializers applied in order. First match wins.
 * Prepend custom serializers via `ControllerService.addSerializer()` to override defaults.
 */
export const defaultSerializers: ResponseSerializer[] = [
  ErrorSerializer,
  BufferSerializer,
  StringSerializer,
  ArraySerializer,
  ArrayBufferSerializer,
  StreamSerializer,
  ObjectSerializer,
  FallbackSerializer,
];
