interface RendererRpcRequestEnvelope {
  requestId: string;
  channel: string;
  args: unknown[];
}

export interface RendererRpcResponseEnvelope {
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export function toErrorPayload(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'Error',
    message: typeof error === 'string' ? error : String(error),
  };
}

export function isRendererRpcRequestEnvelope(
  value: unknown,
): value is RendererRpcRequestEnvelope {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as RendererRpcRequestEnvelope).requestId === 'string' &&
    typeof (value as RendererRpcRequestEnvelope).channel === 'string' &&
    Array.isArray((value as RendererRpcRequestEnvelope).args),
  );
}
