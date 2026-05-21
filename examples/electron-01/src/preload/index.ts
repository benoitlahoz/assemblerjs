import type { KnownIpcChannel } from '@assemblerjs/electron';
import { exposeIpcBridge, WindowIpcChannel, MenuIpcChannel } from '@assemblerjs/electron/preload';
import { IpcChannels } from './ipc.channels';

const defaultChannels = [
  ...Object.values(WindowIpcChannel),
  ...Object.values(MenuIpcChannel),
  ...Object.values(IpcChannels),
] as ReadonlyArray<KnownIpcChannel>;

exposeIpcBridge(defaultChannels, { strict: true });
