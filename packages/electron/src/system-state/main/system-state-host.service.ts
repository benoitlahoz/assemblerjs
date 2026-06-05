import os from 'node:os';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { screen } from 'electron';
import { Assemblage } from 'assemblerjs';
import { IpcListener, IpcSend } from '@/ipc/main';
import { IpcHandle } from '@/common';
import { SystemStateIpcChannel } from '@/common/channels';
import type {
  DisplayState,
  ProcessState,
  RuntimeStackInfo,
  SystemStateHealth,
  SystemStateServiceOptions,
  SystemStateSnapshot,
} from '@/common/types';

const DEFAULT_INTERVAL_MS = 1000;
const MIN_INTERVAL_MS = 100;
const MAX_INTERVAL_MS = 60_000;

function clampInterval(intervalMs: number): number {
  if (!Number.isFinite(intervalMs)) {
    return DEFAULT_INTERVAL_MS;
  }

  return Math.min(
    Math.max(Math.round(intervalMs), MIN_INTERVAL_MS),
    MAX_INTERVAL_MS,
  );
}

@IpcListener()
@Assemblage()
export class SystemStateHostService {
  private intervalMs = DEFAULT_INTERVAL_MS;
  private includeCpuPercent = false;
  private includeDisplays = true;
  private timer: ReturnType<typeof setInterval> | undefined;
  private previousCpuSample: NodeJS.CpuUsage | undefined;
  private previousCpuSampleAt: bigint | undefined;

  private collectRuntime(): RuntimeStackInfo {
    return {
      electron: process.versions.electron || 'unknown',
      chrome: process.versions.chrome || 'unknown',
      node: process.versions.node || 'unknown',
      platform: process.platform,
    };
  }

  private collectCpuPercent(): number | undefined {
    const now = process.hrtime.bigint();
    const current = process.cpuUsage();

    if (!this.previousCpuSample || !this.previousCpuSampleAt) {
      this.previousCpuSample = current;
      this.previousCpuSampleAt = now;
      return undefined;
    }

    const elapsedNs = Number(now - this.previousCpuSampleAt);
    if (elapsedNs <= 0) {
      this.previousCpuSample = current;
      this.previousCpuSampleAt = now;
      return undefined;
    }

    const deltaUser = current.user - this.previousCpuSample.user;
    const deltaSystem = current.system - this.previousCpuSample.system;
    const usedUs = Math.max(0, deltaUser + deltaSystem);

    this.previousCpuSample = current;
    this.previousCpuSampleAt = now;

    const elapsedUs = elapsedNs / 1000;
    const percent = (usedUs / elapsedUs) * 100;
    return Math.max(0, Math.round(percent * 100) / 100);
  }

  private collectProcess(): ProcessState {
    const memoryUsage = process.memoryUsage();

    return {
      pid: process.pid,
      uptimeSec: Math.max(0, Math.round(process.uptime() * 100) / 100),
      rssBytes: memoryUsage.rss,
      heapUsedBytes: memoryUsage.heapUsed,
      heapTotalBytes: memoryUsage.heapTotal,
      cpuPercent: this.includeCpuPercent ? this.collectCpuPercent() : undefined,
    };
  }

  private collectDisplays(): DisplayState[] {
    if (!this.includeDisplays) {
      return [];
    }

    return screen.getAllDisplays().map((display) => ({
      id: display.id,
      isPrimary: display.id === screen.getPrimaryDisplay().id,
      bounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
      },
      workArea: {
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: display.workArea.height,
      },
      scaleFactor: display.scaleFactor,
    }));
  }

  /**
   * Calculate available memory on macOS using native sysctl.
   * macOS memory types that can be reclaimed:
   * - Free: completely unused pages
   * - Speculative: cached file data that can be discarded
   * - Purgeable: voluntary purgeable memory from apps
   * - Pageable external: file cache (file-backed pages)
   * - Reusable: deactivated volatile memory
   *
   * This matches how Activity Monitor and MemoryCleaner calculate available memory.
   */
  private getMacOsAvailableMemory(): number | undefined {
    try {
      const output = execFileSync(
        '/usr/sbin/sysctl',
        [
          '-n',
          'vm.pagesize',
          'vm.page_free_count',
          'vm.page_speculative_count',
          'vm.page_purgeable_count',
          'vm.page_pageable_external_count',
          'vm.page_reusable_count',
        ],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      );

      const values = output
        .trim()
        .split(/\s+/)
        .map((value) => Number.parseInt(value, 10));

      if (values.length === 6 && values.every(Number.isFinite)) {
        const [
          pageSize,
          freePages,
          speculativePages,
          purgeablePages,
          pageableExternalPages,
          reusablePages,
        ] = values;

        const availablePages = Math.max(
          0,
          freePages +
            speculativePages +
            purgeablePages +
            pageableExternalPages +
            reusablePages,
        );

        return Math.max(0, Math.round(availablePages * pageSize));
      }
    } catch {
      // Fall through
    }

    return undefined;
  }

  /**
   * Get available memory on Linux from /proc/meminfo.
   * MemAvailable was introduced in kernel 3.14 (2014) and is the standard
   * metric used by free, htop, and all modern Linux monitoring tools.
   * It estimates how much memory is available for starting new applications,
   * including reclaimable cache and buffers.
   */
  private getLinuxAvailableMemory(): number | undefined {
    try {
      const meminfo = readFileSync('/proc/meminfo', 'utf8');
      const match = meminfo.match(/^MemAvailable:\s+(\d+)\s+kB$/im);
      if (match) {
        return Math.max(0, Number.parseInt(match[1], 10) * 1024);
      }
    } catch {
      // Fall through
    }

    return undefined;
  }

  /**
   * Get system memory info using native Electron/Node.js APIs.
   * Strategy varies by platform for accurate "available" memory:
   *
   * - macOS: sysctl vm statistics (Free + Speculative + Purgeable + File cache + Reusable)
   *   Matches Activity Monitor calculations
   *
   * - Linux: /proc/meminfo MemAvailable (kernel 3.14+)
   *   Standard metric used by htop, free, and all modern Linux tools
   *
   * - Windows: Electron's getSystemMemoryInfo().free
   *   Uses Windows API GlobalMemoryStatusEx() -> ullAvailPhys
   *   This is the correct "Available" metric shown in Task Manager
   *
   * - Fallback: Node.js availableMemory() (v22+) or os.freemem()
   */
  private collectMemorySnapshot(): {
    totalMemBytes: number;
    freeMemBytes: number;
    availableMemBytes?: number;
    memorySource:
      | 'electron-native'
      | 'node-native'
      | 'platform-sysctl'
      | 'node-os-fallback';
  } {
    // First, try to get total memory from Electron (more accurate)
    let totalMemBytes = os.totalmem();
    let freeMemBytes = os.freemem();

    try {
      const electronMemInfo = process.getSystemMemoryInfo();
      if (electronMemInfo && Number.isFinite(electronMemInfo.total)) {
        // Electron reports in KB, convert to bytes
        totalMemBytes = Math.max(0, Math.round(electronMemInfo.total * 1024));
        freeMemBytes = Math.max(
          0,
          Math.round((electronMemInfo.free || 0) * 1024),
        );
      }
    } catch {
      // Keep os module values
    }

    // Platform-specific available memory calculation
    if (process.platform === 'darwin') {
      const available = this.getMacOsAvailableMemory();
      if (available !== undefined) {
        return {
          totalMemBytes,
          freeMemBytes,
          availableMemBytes: available,
          memorySource: 'platform-sysctl',
        };
      }
    }

    if (process.platform === 'linux') {
      const available = this.getLinuxAvailableMemory();
      if (available !== undefined) {
        return {
          totalMemBytes,
          freeMemBytes,
          availableMemBytes: available,
          memorySource: 'platform-sysctl',
        };
      }
    }

    // On Windows or if platform-specific methods failed, use Electron's native API.
    // On Windows, getSystemMemoryInfo().free uses GlobalMemoryStatusEx() which
    // returns the correct "Available" memory metric (Task Manager's value).
    if (process.platform === 'win32') {
      return {
        totalMemBytes,
        freeMemBytes,
        availableMemBytes: freeMemBytes,
        memorySource: 'electron-native',
      };
    }

    // Try Node.js 22+ availableMemory() as fallback
    if (typeof process.availableMemory === 'function') {
      try {
        const availableMemBytes = process.availableMemory();
        if (Number.isFinite(availableMemBytes)) {
          return {
            totalMemBytes,
            freeMemBytes,
            availableMemBytes: Math.max(0, availableMemBytes),
            memorySource: 'node-native',
          };
        }
      } catch {
        // Fall through
      }
    }

    // Last resort: use os.freemem() (inaccurate on macOS/Linux)
    return {
      totalMemBytes,
      freeMemBytes,
      availableMemBytes: freeMemBytes,
      memorySource: 'node-os-fallback',
    };
  }

  private async emitHealthEvent(health: SystemStateHealth): Promise<void> {
    await this.emitHealth(health);
  }

  private async publishSnapshot(): Promise<void> {
    try {
      const snapshot = this.buildSnapshot();
      await this.emitSnapshot(snapshot);
      await this.emitHealthEvent('running');
    } catch {
      await this.emitHealthEvent('degraded');
    }
  }

  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    this.timer = setInterval(() => {
      this.publishSnapshot().catch(() => undefined);
    }, this.intervalMs);
  }

  private buildSnapshot(): SystemStateSnapshot {
    const [loadAvg1m, loadAvg5m, loadAvg15m] = os.loadavg();
    const memorySnapshot = this.collectMemorySnapshot();

    return {
      timestampMs: Date.now(),
      runtime: this.collectRuntime(),
      process: this.collectProcess(),
      os: {
        totalMemBytes: memorySnapshot.totalMemBytes,
        freeMemBytes: memorySnapshot.freeMemBytes,
        availableMemBytes: memorySnapshot.availableMemBytes,
        memorySource: memorySnapshot.memorySource,
        loadAvg1m,
        loadAvg5m,
        loadAvg15m,
      },
      displays: this.collectDisplays(),
    };
  }

  @IpcHandle(SystemStateIpcChannel.GetSnapshot)
  public async getSnapshotCommand(): Promise<SystemStateSnapshot> {
    return this.buildSnapshot();
  }

  @IpcHandle(SystemStateIpcChannel.StartMonitoring)
  public async startMonitoringCommand(
    options?: Partial<SystemStateServiceOptions>,
  ): Promise<void> {
    if (options?.intervalMs !== undefined) {
      this.intervalMs = clampInterval(options.intervalMs);
    }

    if (options?.includeCpuPercent !== undefined) {
      this.includeCpuPercent = options.includeCpuPercent;
      this.previousCpuSample = undefined;
      this.previousCpuSampleAt = undefined;
    }

    if (options?.includeDisplays !== undefined) {
      this.includeDisplays = options.includeDisplays;
    }

    this.startTimer();
    await this.publishSnapshot();
  }

  @IpcHandle(SystemStateIpcChannel.StopMonitoring)
  public async stopMonitoringCommand(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    await this.emitHealthEvent('stopped');
  }

  @IpcHandle(SystemStateIpcChannel.SetInterval)
  public async setIntervalCommand(intervalMs: number): Promise<void> {
    this.intervalMs = clampInterval(intervalMs);

    if (!this.timer) {
      return;
    }

    this.startTimer();
  }

  @IpcSend(SystemStateIpcChannel.OnSnapshot)
  private async emitSnapshot(
    snapshot: SystemStateSnapshot,
  ): Promise<SystemStateSnapshot> {
    return snapshot;
  }

  @IpcSend(SystemStateIpcChannel.OnHealth)
  private async emitHealth(
    health: SystemStateHealth,
  ): Promise<SystemStateHealth> {
    return health;
  }

  public onDispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
