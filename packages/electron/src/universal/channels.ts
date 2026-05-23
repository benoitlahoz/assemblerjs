export enum WindowIpcChannel {
  // Queries
  GetName = 'window:name.get',
  GetBounds = 'window:bounds.get',
  // Window control
  Pin = 'window:pin',
  SetVisible = 'window:visible.set',
  SetMinimized = 'window:minimized.set',
  SetMaximized = 'window:maximized.set',
  Restore = 'window:restore',
  Focus = 'window:focus',
  // Events
  OnBoundsChanged = 'window:bounds.changed',
  OnStateChanged = 'window:state.changed',
  OnEnterFullscreen = 'window:fullscreen.enter',
  OnLeaveFullscreen = 'window:fullscreen.leave',
}

export enum MenuIpcChannel {
  OnItemClicked = 'menu:item.clicked',
}

export enum RpcIpcChannel {
  Request = 'asm:rpc:request',
  Response = 'asm:rpc:response',
}
