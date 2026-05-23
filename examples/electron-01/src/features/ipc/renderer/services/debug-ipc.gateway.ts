import { AbstractAssemblage, Assemblage } from 'assemblerjs';
import {
  IpcHandle,
  IpcListener,
  IpcInvoke,
  IpcOn,
  IpcResult,
  IpcSend,
} from '@assemblerjs/electron/renderer';
import { IpcChannels } from '@preload/ipc.channels';
import { computed, ref } from 'vue';

@IpcListener()
@Assemblage()
export class DebugIpcGateway implements AbstractAssemblage {
  private readonly lastPingSentAt = ref<number | undefined>(undefined);

  public readonly lastPongAt = ref<number | undefined>(undefined);
  public readonly lastLatencyMs = ref<number | undefined>(undefined);
  public readonly latencyHistory = ref<number[]>([]);
  public readonly ipcFeedback = ref('Idle');
  public readonly averageLatencyMs = computed<number | undefined>(() => {
    if (this.latencyHistory.value.length === 0) {
      return undefined;
    }

    const total = this.latencyHistory.value.reduce((sum, value) => sum + value, 0);
    return Math.round(total / this.latencyHistory.value.length);
  });

  @IpcSend(IpcChannels.Ping)
  public sendPing(): void {
    this.lastPingSentAt.value = performance.now();
    this.ipcFeedback.value = 'Ping sent...';
  }

  public clearFeedback(): void {
    this.ipcFeedback.value = 'Idle';
    this.lastPingSentAt.value = undefined;
    this.lastPongAt.value = undefined;
    this.lastLatencyMs.value = undefined;
    this.latencyHistory.value = [];
  }

  @IpcHandle(IpcChannels.GetRendererMetrics)
  public async getRendererMetrics(): Promise<{
    feedback: string;
    averageLatencyMs?: number;
  }> {
    return {
      feedback: this.ipcFeedback.value,
      averageLatencyMs: this.averageLatencyMs.value,
    };
  }

  @IpcOn(IpcChannels.Pong)
  public onPong(): void {
    if (this.lastPingSentAt.value !== undefined) {
      const latency = Math.max(0, Math.round(performance.now() - this.lastPingSentAt.value));
      this.lastLatencyMs.value = latency;
      this.latencyHistory.value = [latency, ...this.latencyHistory.value].slice(0, 120);
      this.lastPingSentAt.value = undefined;
    }

    this.lastPongAt.value = Date.now();
    this.ipcFeedback.value =
      `Pong ${this.lastLatencyMs.value !== undefined ? `${this.lastLatencyMs.value} ms` : ''}`.trim();
  }

  @IpcInvoke(IpcChannels.GetVersions)
  public async getVersions(
    @IpcResult() versions?: NodeJS.ProcessVersions,
  ): Promise<NodeJS.ProcessVersions | undefined> {
    return versions;
  }

  @IpcInvoke(IpcChannels.GetPlatform)
  public async getPlatform(
    @IpcResult() platform?: NodeJS.Platform,
  ): Promise<NodeJS.Platform | undefined> {
    return platform;
  }
}
