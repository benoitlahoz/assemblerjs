/**
 * Window IPC channels for global window registry operations.
 *
 * Instance-specific commands (getBounds, focus, etc.) are now handled via @WindowCommand.
 * Event forwarding (resize, move, etc.) is now handled via @WindowForward with auto-generated channels.
 */
export enum WindowIpcChannel {
  ListWindowNames = 'window:names.list',
  ListManagedWindows = 'window:managed.list',
  HasWindow = 'window:has',
  OpenWindow = 'window:open',
  CloseWindow = 'window:close',
}

export enum MenuIpcChannel {
  OnItemClicked = 'menu:item.clicked',
  OnItemStateChanged = 'menu:item.state.changed',
  OnTemplateChanged = 'menu:template.changed',
  GetSnapshot = 'menu:snapshot.get',
  SetItemEnabled = 'menu:item.enabled.set',
  SetItemChecked = 'menu:item.checked.set',
}

export enum RpcIpcChannel {
  Request = 'asm:rpc:request',
  Response = 'asm:rpc:response',
}

export enum SystemStateIpcChannel {
  GetSnapshot = 'system-state:get-snapshot',
  StartMonitoring = 'system-state:start',
  StopMonitoring = 'system-state:stop',
  SetInterval = 'system-state:set-interval',
  OnSnapshot = 'system-state:snapshot',
  OnHealth = 'system-state:health',
}
