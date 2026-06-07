import { getIpcContractChannels, setupIpcBridge } from '@assemblerjs/electron/preload';
import { ipcContracts } from './ipc.channels';

const defaultChannels = getIpcContractChannels(ipcContracts);

setupIpcBridge({
  channels: defaultChannels,
  strict: true,
  // Allow dynamic per-window and per-menu channels generated at runtime.
  autoWhitelist: [
    /^window:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
    /^menu:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
  ],
});
