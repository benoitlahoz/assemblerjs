import { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import type {
  ManagedWindowDescriptor,
  WindowBounds,
  WindowState,
} from '@/universal/types';

export interface WindowSnapshot {
  name: string;
  bounds?: WindowBounds;
  state?: WindowState;
  isFullscreen?: boolean;
  updatedAt: number;
}

export abstract class AbstractWindowRendererService implements AbstractAssemblage {
  public abstract listWindowNames(): Promise<string[]>;

  public abstract listManagedWindows(): Promise<ManagedWindowDescriptor[]>;

  public abstract hasWindow(name: string): Promise<boolean>;

  public abstract openWindow(
    name: string,
    configuration?: Record<string, any>,
  ): Promise<boolean>;

  public abstract closeWindow(name: string): Promise<boolean>;

  public abstract getBounds(name: string): Promise<WindowBounds | undefined>;

  public abstract focus(name: string): Promise<void>;

  public abstract setVisible(name: string, visible: boolean): Promise<void>;

  public abstract setMinimized(name: string, minimized: boolean): Promise<void>;

  public abstract setMaximized(name: string, maximized: boolean): Promise<void>;

  public abstract restore(name: string): Promise<void>;

  public abstract pin(
    name: string,
    pinned: boolean,
  ): Promise<boolean | undefined>;

  public abstract snapshot(name: string): WindowSnapshot | undefined;

  public abstract trackWindow(name: string): () => void;

  public abstract onBoundsChanged(
    name: string,
    callback: (bounds: WindowBounds) => void,
  ): () => void;

  public abstract onStateChanged(
    name: string,
    callback: (state: WindowState) => void,
  ): () => void;

  public abstract onFullscreenChanged(
    name: string,
    callback: (active: boolean) => void,
  ): () => void;

  public abstract onDispose(
    context: AssemblerContext,
    configuration?: Record<string, any>,
  ): void | Promise<void>;
}
