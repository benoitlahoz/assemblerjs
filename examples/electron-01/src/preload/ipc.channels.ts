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
  // System state v1
  SystemStateGetSnapshot = 'system-state:get-snapshot',
  SystemStateStart = 'system-state:start',
  SystemStateStop = 'system-state:stop',
  SystemStateSetInterval = 'system-state:set-interval',
  SystemStateOnSnapshot = 'system-state:snapshot',
  SystemStateOnHealth = 'system-state:health',
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
  [IpcChannels.SystemStateGetSnapshot]: ipcContract<
    [],
    {
      timestampMs: number;
      runtime: {
        electron: string;
        chrome: string;
        node: string;
        platform: NodeJS.Platform;
      };
      process: {
        pid: number;
        uptimeSec: number;
        rssBytes: number;
        heapUsedBytes: number;
        heapTotalBytes: number;
        cpuPercent?: number;
      };
      os: {
        totalMemBytes: number;
        freeMemBytes: number;
        availableMemBytes?: number;
        memorySource?: 'platform-estimate' | 'electron-native' | 'node-os-fallback';
        loadAvg1m: number;
        loadAvg5m: number;
        loadAvg15m: number;
      };
      displays: Array<{
        id: number;
        isPrimary: boolean;
        bounds: { x: number; y: number; width: number; height: number };
        workArea: { x: number; y: number; width: number; height: number };
        scaleFactor: number;
      }>;
    }
  >(),
  [IpcChannels.SystemStateStart]: ipcContract<
    [
      options?: {
        autoStart?: boolean;
        intervalMs?: number;
        includeCpuPercent?: boolean;
        includeDisplays?: boolean;
      },
    ],
    void
  >(),
  [IpcChannels.SystemStateStop]: ipcContract<[], void>(),
  [IpcChannels.SystemStateSetInterval]: ipcContract<[intervalMs: number], void>(),
  [IpcChannels.SystemStateOnSnapshot]: ipcContract<
    [
      snapshot: {
        timestampMs: number;
        runtime: {
          electron: string;
          chrome: string;
          node: string;
          platform: NodeJS.Platform;
        };
        process: {
          pid: number;
          uptimeSec: number;
          rssBytes: number;
          heapUsedBytes: number;
          heapTotalBytes: number;
          cpuPercent?: number;
        };
        os: {
          totalMemBytes: number;
          freeMemBytes: number;
          availableMemBytes?: number;
          memorySource?: 'platform-estimate' | 'electron-native' | 'node-os-fallback';
          loadAvg1m: number;
          loadAvg5m: number;
          loadAvg15m: number;
        };
        displays: Array<{
          id: number;
          isPrimary: boolean;
          bounds: { x: number; y: number; width: number; height: number };
          workArea: { x: number; y: number; width: number; height: number };
          scaleFactor: number;
        }>;
      },
    ],
    void
  >(),
  [IpcChannels.SystemStateOnHealth]: ipcContract<
    [health: 'running' | 'stopped' | 'degraded'],
    void
  >(),
});
