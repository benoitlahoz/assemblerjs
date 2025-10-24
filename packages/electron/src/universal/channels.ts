export enum WindowIpcChannel {
  GetName = 'window:name.get',
  GetBounds = 'window:bounds.get',
  Pin = 'window:pin',
  OnResize = 'window:resize',
  OnEnterFullscreen = 'window:fullscreen.enter',
  OnLeaveFullscreen = 'window:fullscreen.leave',
}
