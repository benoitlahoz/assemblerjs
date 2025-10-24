import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  type ElectronListener = (event: any, ...args: any[]) => void;

  interface IpcBridge {
    readonly versions: Readonly<NodeJS.ProcessVersions>;
    readonly channels: Array<string>;
    /**
     * IPC functions.
     */
    readonly ipc: {
      on: (channel: string, listener: ElectronListener) => void;
      once: (channel: string, listener: ElectronListener) => void;
      off: (channel: string, listener: ElectronListener) => void;
      removeAllListeners: (channel: string) => void;
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      emit: (channel: string, ...args: any[]) => Promise<void>;
    };
  }

  interface Window {
    electron: ElectronAPI;
    ipc: Readonly<IpcBridge>;
  }
}
