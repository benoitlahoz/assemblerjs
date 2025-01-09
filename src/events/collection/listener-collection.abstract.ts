/**
 * `EventChannel` extends `string`.
 */
export type EventChannel = string;

/**
 * Describes a list of event channels as Record<EventChannel, string>
 */
export type EventChannelList = Record<EventChannel, string>;

/**
 * Describes a listener type as a function taking any number of arguments and returning `void`.
 */
export type Listener = (...args: any[]) => void | Promise<void>;

/**
 * An abstract class for `ListenerCollection` implementation.
 */
export abstract class AbstractListenerCollection {
  [key: EventChannel]: any;

  public abstract listeners: Listener[];
  public abstract channels: EventChannel[];

  public abstract add(
    channel: EventChannel,
    listener: Listener
  ): AbstractListenerCollection;

  public abstract remove(
    channel: EventChannel,
    listener?: Listener
  ): AbstractListenerCollection;

  public abstract has(...args: (EventChannel | Listener)[]): boolean;

  public abstract get(
    ...args: (EventChannel | Listener)[]
  ): (EventChannel | Listener)[];

  public abstract clear(): AbstractListenerCollection;

  public abstract [Symbol.iterator](): Iterator<EventChannel>;
}
