import { ElectronAPI } from '@electron-toolkit/preload';
import type {
  DefaultIpcContractMap,
  IpcArgsFor,
  IpcContractMap,
  IpcResponseFor,
  KnownIpcChannel,
  TypedIpcBridge,
} from './src/universal/types';

declare global {
  type ElectronListener = (...args: any[]) => void;

  type IpcBridge<
    Contracts extends IpcContractMap = DefaultIpcContractMap
  > = TypedIpcBridge<Contracts>;

  type IpcChannel<
    Contracts extends IpcContractMap = DefaultIpcContractMap
  > = KnownIpcChannel<Contracts>;

  type IpcChannelArgs<
    Contracts extends IpcContractMap,
    Channel extends KnownIpcChannel<Contracts>
  > = IpcArgsFor<Contracts, Channel>;

  type IpcChannelResponse<
    Contracts extends IpcContractMap,
    Channel extends KnownIpcChannel<Contracts>
  > = IpcResponseFor<Contracts, Channel>;

  interface Window {
    electron: ElectronAPI;
    ipc: Readonly<IpcBridge>;
  }
}
