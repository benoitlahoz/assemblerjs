import { getIpcContractChannels, setupIpcBridge } from '@assemblerjs/electron/preload';
import { ipcContracts } from './ipc.channels';

const defaultChannels = getIpcContractChannels(ipcContracts);

setupIpcBridge({
  channels: defaultChannels,
  strict: true,
  autoWhitelist: [/^window:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/],
});
