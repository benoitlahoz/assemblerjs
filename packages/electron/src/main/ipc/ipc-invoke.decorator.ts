import { randomUUID } from 'node:crypto';
import { BrowserWindow, ipcMain } from 'electron';
import { RpcIpcChannel } from '@/universal/channels';
import {
  getIpcChannelParameterIndices,
  getIpcResultParameterIndices,
} from '@/universal/metadata';

interface MainIpcInvokeOptions {
  name?: string;
  timeoutMs?: number;
}

interface RendererRpcRequestEnvelope {
  requestId: string;
  channel: string;
  args: unknown[];
}

interface RendererRpcResponseEnvelope {
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface PendingRpcCall {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingCalls = new Map<string, PendingRpcCall>();
let isResponseListenerRegistered = false;

function toError(error?: RendererRpcResponseEnvelope['error']): Error {
  if (!error) {
    return new Error('Unknown renderer RPC error.');
  }

  const parsed = new Error(error.message || 'Renderer RPC failed.');
  parsed.name = error.name || 'Error';
  if (error.stack) {
    parsed.stack = error.stack;
  }

  return parsed;
}

function isRendererRpcResponseEnvelope(
  value: unknown,
): value is RendererRpcResponseEnvelope {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as RendererRpcResponseEnvelope).requestId === 'string' &&
    typeof (value as RendererRpcResponseEnvelope).ok === 'boolean',
  );
}

function ensureRpcResponseListener(): void {
  if (isResponseListenerRegistered) {
    return;
  }

  ipcMain.on(RpcIpcChannel.Response, (_event, payload: unknown) => {
    if (!isRendererRpcResponseEnvelope(payload)) {
      return;
    }

    const pending = pendingCalls.get(payload.requestId);
    if (!pending) {
      return;
    }

    pendingCalls.delete(payload.requestId);
    clearTimeout(pending.timeout);

    if (payload.ok) {
      pending.resolve(payload.data);
      return;
    }

    pending.reject(toError(payload.error));
  });

  isResponseListenerRegistered = true;
}

function resolveWindow(name?: string): BrowserWindow {
  const windows = BrowserWindow.getAllWindows().filter(
    (window) => !window.isDestroyed(),
  ) as Array<BrowserWindow & { name?: string }>;

  if (windows.length === 0) {
    throw new Error('No renderer window available for RPC invocation.');
  }

  if (!name) {
    return windows[0];
  }

  const target = windows.find((window) => window.name === name);
  if (!target) {
    throw new Error(`Renderer window "${name}" not found for RPC invocation.`);
  }

  return target;
}

function invokeRenderer(
  channel: string,
  args: unknown[],
  options: MainIpcInvokeOptions,
): Promise<unknown> {
  const target = resolveWindow(options.name);
  const requestId = randomUUID();
  const timeoutMs = options.timeoutMs ?? 10_000;

  return new Promise<unknown>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingCalls.delete(requestId);
      reject(
        new Error(
          `Renderer RPC timeout after ${timeoutMs}ms for channel "${channel}".`,
        ),
      );
    }, timeoutMs);

    pendingCalls.set(requestId, {
      resolve,
      reject,
      timeout,
    });

    const payload: RendererRpcRequestEnvelope = {
      requestId,
      channel,
      args,
    };

    target.webContents.send(RpcIpcChannel.Request, payload);
  });
}

/**
 * Invokes an IPC handler registered in a renderer process and waits for the response.
 */
export function IpcInvoke<C extends string = string>(
  channel?: C,
  options: MainIpcInvokeOptions = {},
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (...args: any[]): Promise<any> {
      ensureRpcResponseListener();

      const channelParameters = getIpcChannelParameterIndices(
        target,
        propertyKey,
      );

      let resolvedChannel: string | undefined = channel;
      if (!resolvedChannel) {
        if (channelParameters.length === 0) {
          throw new Error(
            `@IpcInvoke on method '${String(
              propertyKey,
            )}' requires a channel name or a parameter decorated with @IpcChannel.`,
          );
        }

        if (channelParameters.length > 1) {
          throw new Error(
            `@IpcInvoke on method '${String(
              propertyKey,
            )}' can only have one parameter decorated with @IpcChannel.`,
          );
        }

        resolvedChannel = args[channelParameters[0]];
      }

      if (!resolvedChannel || typeof resolvedChannel !== 'string') {
        throw new Error(
          `@IpcInvoke on method '${String(
            propertyKey,
          )}' requires a valid channel name. Got: ${resolvedChannel}`,
        );
      }

      const ipcResultParameters = getIpcResultParameterIndices(
        target,
        propertyKey,
      );
      const excludedParameters = new Set([
        ...channelParameters,
        ...ipcResultParameters,
      ]);

      const result = await invokeRenderer(
        resolvedChannel,
        args.filter((_, i) => !excludedParameters.has(i)),
        options,
      );

      ipcResultParameters.forEach((index) => {
        args[index] = result;
      });

      return await originalMethod.call(this, ...args);
    };

    return descriptor;
  };
}
