import type { KnownIpcChannel } from '@assemblerjs/electron';
import { exposeIpcBridge, WindowIpcChannel, MenuIpcChannel } from '@assemblerjs/electron/preload';

const defaultChannels = [
  ...Object.values(WindowIpcChannel),
  ...Object.values(MenuIpcChannel),
  'ping',
] as ReadonlyArray<KnownIpcChannel>;

exposeIpcBridge(defaultChannels, { strict: true });
