import { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import type {
  SystemStateHealth,
  SystemStateServiceOptions,
  SystemStateSnapshot,
} from '@/common/types';

export abstract class AbstractSystemStateService implements AbstractAssemblage {
  public abstract getSnapshot(): Promise<SystemStateSnapshot>;

  public abstract startMonitoring(
    options?: Partial<SystemStateServiceOptions>,
  ): Promise<void>;

  public abstract stopMonitoring(): Promise<void>;

  public abstract setInterval(intervalMs: number): Promise<void>;

  public abstract onSnapshot(
    callback: (snapshot: SystemStateSnapshot) => void,
  ): () => void;

  public abstract onHealth(
    callback: (status: SystemStateHealth) => void,
  ): () => void;

  public abstract onDispose(
    context: AssemblerContext,
    configuration?: Record<string, any>,
  ): void | Promise<void>;
}
