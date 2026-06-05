import type { Identifier } from 'assemblerjs';
import type { ElectronWindow } from '@/window/main/classes/electron-window';
import type { NormalizedWindowDefinition } from '../window-definition/window.decorator';

export type WindowToken = Identifier<any>;
export type TypedWindowToken<TWindow extends ElectronWindow> =
  Identifier<TWindow>;

export interface ManagedWindowCommand {
  method: string;
  command: string;
  channel: string;
}

export interface ManagedWindowEvent {
  method: string;
  event: string;
  channel: string;
}

export interface ManagedWindowDefinition {
  token: WindowToken;
  concrete: Function;
  definition: NormalizedWindowDefinition;
  commands: ManagedWindowCommand[];
  events: ManagedWindowEvent[];
}

export interface WindowControllerState {
  managed: ManagedWindowDefinition[];
  opened: Map<string, Set<any>>;
  registeredHandlers: Set<string>;
}

export interface WindowRuntimeHandle {
  loadURL?: (url: string) => Promise<unknown>;
  loadFile?: (
    path: string,
    options?: {
      hash?: string;
    },
  ) => Promise<unknown>;
  once?: (event: string, callback: () => void) => void;
  close?: () => void;
  isDestroyed?: () => boolean;
  [key: string]: unknown;
}

export interface WindowControllerRegistry {
  listWindows(): ElectronWindow[];
  listWindowNames(): string[];
  listWindowChannels(): string[];
  listManagedWindows(): Array<{
    token: WindowToken;
    concrete: Function;
    name: string;
    multiple: boolean;
  }>;
  openWindow<TWindow extends ElectronWindow>(
    token: TypedWindowToken<TWindow>,
    configuration?: Record<string, any>,
  ): Promise<TWindow>;
  openWindow(
    tokenOrName: WindowToken | string,
    configuration?: Record<string, any>,
  ): Promise<any>;
  closeWindow<TWindow extends ElectronWindow>(
    token: TypedWindowToken<TWindow>,
  ): boolean;
  closeWindow(tokenOrName: WindowToken | string): boolean;
  closeAllWindows<TWindow extends ElectronWindow>(
    token: TypedWindowToken<TWindow>,
  ): number;
  closeAllWindows(tokenOrName?: WindowToken | string): number;
  getWindow(name: string): ElectronWindow | undefined;
  hasWindow(name: string): boolean;
  requireWindow(name: string): ElectronWindow;
}

export type TypedWindowControllerRegistry<
  Windows extends Record<string, ElectronWindow>,
> = Omit<
  WindowControllerRegistry,
  | 'openWindow'
  | 'closeWindow'
  | 'closeAllWindows'
  | 'getWindow'
  | 'hasWindow'
  | 'requireWindow'
> & {
  openWindow<Name extends keyof Windows & string>(
    name: Name,
    configuration?: Record<string, any>,
  ): Promise<Windows[Name]>;
  openWindow<TWindow extends ElectronWindow>(
    token: TypedWindowToken<TWindow>,
    configuration?: Record<string, any>,
  ): Promise<TWindow>;
  openWindow(
    tokenOrName: WindowToken | string,
    configuration?: Record<string, any>,
  ): Promise<any>;

  closeWindow<Name extends keyof Windows & string>(name: Name): boolean;
  closeWindow<TWindow extends ElectronWindow>(
    token: TypedWindowToken<TWindow>,
  ): boolean;
  closeWindow(tokenOrName: WindowToken | string): boolean;

  closeAllWindows<Name extends keyof Windows & string>(name?: Name): number;
  closeAllWindows<TWindow extends ElectronWindow>(
    token: TypedWindowToken<TWindow>,
  ): number;
  closeAllWindows(tokenOrName?: WindowToken | string): number;

  getWindow<Name extends keyof Windows & string>(
    name: Name,
  ): Windows[Name] | undefined;
  getWindow(name: string): ElectronWindow | undefined;

  hasWindow<Name extends keyof Windows & string>(name: Name): boolean;
  hasWindow(name: string): boolean;

  requireWindow<Name extends keyof Windows & string>(name: Name): Windows[Name];
  requireWindow(name: string): ElectronWindow;
};
