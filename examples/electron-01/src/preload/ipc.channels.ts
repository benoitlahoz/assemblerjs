export enum IpcChannels {
  // Handshake
  Ping = 'ping',
  Pong = 'pong',
  // Process
  GetVersions = 'get-versions',
  GetPlatform = 'get-platform',
}
