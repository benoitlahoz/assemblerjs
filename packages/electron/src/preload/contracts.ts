import type {
  IpcChannelDefinition,
  IpcContractMap,
} from '../common/types';

export function ipcContract<
  Args extends unknown[] = unknown[],
  Response = unknown,
>(): IpcChannelDefinition<Args, Response> {
  return {
    args: [] as unknown as Args,
    response: undefined as unknown as Response,
  };
}

export function defineIpcContracts<Contracts extends IpcContractMap>(
  contracts: Contracts,
): Contracts {
  return contracts;
}

export function getIpcContractChannels(
  contracts: IpcContractMap,
): ReadonlyArray<string> {
  return Object.keys(contracts);
}
