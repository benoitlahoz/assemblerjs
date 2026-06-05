import type {
  DefaultIpcContractMap,
  IpcContractMap,
  KnownIpcChannel,
} from '../common/types';

export type RendererListener = (...args: any[]) => void;
export type ElectronListener = (_event: unknown, ...args: any[]) => void;
export type RendererRpcHandler = (...args: any[]) => any;

export type BridgeContracts<Contracts extends IpcContractMap> = Contracts &
  DefaultIpcContractMap;

export type AutoWhitelistRule =
  | string
  | RegExp
  | ((channel: string) => boolean);

export interface IpcBridgeOptions {
  strict?: boolean;
  autoWhitelist?: ReadonlyArray<AutoWhitelistRule>;
  debug?: boolean;
}

export interface SetupIpcBridgeOptions<
  Contracts extends IpcContractMap,
> extends IpcBridgeOptions {
  channels?: ReadonlyArray<KnownIpcChannel<Contracts>>;
}
