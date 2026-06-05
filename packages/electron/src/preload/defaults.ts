import {
  MenuIpcChannel,
  RpcIpcChannel,
  WindowIpcChannel,
} from '../common/channels';
import type { KnownIpcChannel } from '../common/types';
import type { AutoWhitelistRule } from './types';

export { RpcIpcChannel };

export const defaultChannels = [
  ...Object.values(WindowIpcChannel),
  ...Object.values(MenuIpcChannel),
] as ReadonlyArray<KnownIpcChannel>;

export const defaultAutoWhitelistRules: ReadonlyArray<AutoWhitelistRule> = [
  // Supports dynamic channels emitted/handled by window decorators:
  // window:<windowName>.<commandOrEvent>
  /^window:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
  // Supports dynamic menu scoped channels:
  // menu:<windowName>.<commandOrEvent>
  /^menu:[A-Za-z0-9_-]+\.[A-Za-z0-9:_-]+$/,
];
