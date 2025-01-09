import { Listener } from './collection';

export abstract class AbstractEventManager {
  public abstract dispose(): void;
  public abstract addChannels(...channels: string[]): AbstractEventManager;
  public abstract removeChannels(...channels: string[]): AbstractEventManager;
  public abstract on(channel: string, callback: Listener): AbstractEventManager;
  public abstract once(
    channel: string,
    callback: Listener
  ): AbstractEventManager;
  public abstract off(
    channel: string,
    callback?: Listener
  ): AbstractEventManager;
  public abstract emit(channel: string, ...args: any[]): AbstractEventManager;
}
