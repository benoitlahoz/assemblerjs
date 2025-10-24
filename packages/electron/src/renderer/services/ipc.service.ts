import { BindThis } from '@assemblerjs/core';
import { Assemblage } from 'assemblerjs';
import { AbstractIpcService } from './ipc.abstract';

@Assemblage()
export class IpcService implements AbstractIpcService {
  private bridge = window.ipc;

  public get channels(): ReadonlyArray<string> {
    return this.bridge.channels as ReadonlyArray<string>;
  }

  public get versions(): Record<string, string> {
    return this.bridge.versions as Record<string, string>;
  }

  @BindThis()
  public on(channel: string, listener: (data: any) => void): void {
    this.bridge.ipc.on(channel, listener);
  }

  @BindThis()
  public once(channel: string, listener: (data: any) => void): void {
    this.bridge.ipc.once(channel, listener);
  }

  @BindThis()
  public off(channel: string, listener: (data: any) => void): void {
    this.bridge.ipc.off(channel, listener);
  }

  @BindThis()
  public removeAllListeners(channel: string): void {
    this.bridge.ipc.removeAllListeners(channel);
  }

  @BindThis()
  public send(channel: string, data: any): void {
    this.bridge.ipc.send(channel, data);
  }

  @BindThis()
  public async invoke(channel: string, data: any): Promise<any> {
    return await this.bridge.ipc.invoke(channel, data);
  }

  @BindThis()
  public async emit(channel: string, data: any): Promise<void> {
    await this.bridge.ipc.emit(channel, data);
  }
}
