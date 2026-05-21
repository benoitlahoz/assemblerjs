import type { KnownIpcChannel } from '@assemblerjs/electron';
import { exposeIpcBridge } from '@assemblerjs/electron/preload';
import { IpcChannels } from './ipc.channels';

const defaultChannels = [...Object.values(IpcChannels)] as ReadonlyArray<KnownIpcChannel>;

exposeIpcBridge(defaultChannels, {
  strict: true,
  autoWhitelist: [/^window:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/],
});
