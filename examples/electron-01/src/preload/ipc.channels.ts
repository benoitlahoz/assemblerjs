type LocalIpcContract<Args extends unknown[] = unknown[], Response = unknown> = {
  args: Args;
  response: Response;
};

const ipcContract = <Args extends unknown[] = unknown[], Response = unknown>(): LocalIpcContract<
  Args,
  Response
> => {
  return {
    args: [] as unknown as Args,
    response: undefined as unknown as Response,
  };
};

const defineIpcContracts = <Contracts extends Record<string, LocalIpcContract>>(
  contracts: Contracts,
): Contracts => {
  return contracts;
};

export enum IpcChannels {
  // Handshake
  Ping = 'ping',
  Pong = 'pong',
  // Main -> renderer RPC
  GetRendererMetrics = 'get-renderer-metrics',
  // Process
  GetVersions = 'get-versions',
  GetPlatform = 'get-platform',
}

export const ipcContracts = defineIpcContracts({
  [IpcChannels.Ping]: ipcContract<[], void>(),
  [IpcChannels.Pong]: ipcContract<[], void>(),
  [IpcChannels.GetRendererMetrics]: ipcContract<
    [],
    {
      feedback: string;
      averageLatencyMs?: number;
    }
  >(),
  [IpcChannels.GetVersions]: ipcContract<[], NodeJS.ProcessVersions>(),
  [IpcChannels.GetPlatform]: ipcContract<[], NodeJS.Platform>(),
});
