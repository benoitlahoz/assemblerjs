import type { Tuple } from '@/types';
import {
    clearInstance, conditionally, forIn, forOf, isDefined, isOfType, pipe, proxifyIterable
} from '@/utils';

import { AbstractListenerCollection } from './listener-collection.abstract';

import type { Listener, EventChannel } from './listener-collection.abstract';
export class ListenerCollection implements AbstractListenerCollection {
  /**
   * Class is indexable by `EventChannel`.
   */
  [key: string]: Listener[] | any;

  /**
   * Internal listeners `Object`.
   */
  public readonly collection: Record<EventChannel, Array<Listener>> = {};

  constructor() {
    const proxy = proxifyIterable(this, ListenerCollection);
    return proxy;
  }

  /**
   * Clean up the collection by removing all listeners and channels
   * and deleting listeners private property.
   */
  public dispose(): void {
    clearInstance(this, ListenerCollection);
  }

  /**
   * Add a listener to the collection.
   *
   * @param { EventChannel } channel The channel to add the listener to.
   * @param { Listener } listener The callback function to run when the event is emitted.
   * @returns { ListenerCollection } This collection.
   */
  public add(channel: EventChannel, listener: Listener): ListenerCollection;
  /**
   * Add a listener to the collection.
   *
   * @param { Tuple<EventChannel, Listener> } tuple The channel and its listener in a tuple.
   * @returns { ListenerCollection } This collection.
   */
  public add(tuple: Tuple<[EventChannel, Listener]>): ListenerCollection;
  public add(
    ...args: (EventChannel | Listener | Tuple<[EventChannel, Listener]>)[]
  ): ListenerCollection {
    // Add listener to channel.

    const push = (res: { channel: EventChannel; listener: Listener }) =>
      this.collection[res.channel].push(res.listener);

    // Parse arguments (may be a tuple).

    const parseArgs = conditionally({
      if: () => args.length === 2,
      then: () => {
        return {
          channel: args[0] as string,
          listener: args[1] as Listener,
        };
      },
      else: () => {
        const tuple = args[0] as Tuple<[EventChannel, Listener]>;
        return {
          channel: tuple[0] as string,
          listener: tuple[1] as Listener,
        };
      },
    });

    // Check if channel exists or create it if not.

    const checkAndPush = conditionally({
      if: (res: { channel: EventChannel; listener: Listener }) =>
        !isDefined(this.collection[res.channel]),
      then: (res: { channel: EventChannel; listener: Listener }) => {
        this.collection[res.channel] = [];
        push(res);
      },
      else: (res: { channel: EventChannel; listener: Listener }) => {
        push(res);
      },
    });

    // Run.

    pipe(parseArgs, checkAndPush)();

    return this;
  }

  /**
   * Removes a listener or all listeners for a given channel.
   * If the channel or the provided listener does not exist, fails silently.
   *
   * @param { EventChannel } channel The channel the listener is listening to.
   * @param { Listener } listener The listener to remove. If not provided, remove all listeners for given channel.
   * @returns { ListenerCollection } This collection.
   */
  public remove(channel: string, listener?: Listener): ListenerCollection {
    // Delete listener from specific channel.

    const deleteAtIndex = (index: number) =>
      this.collection[channel].splice(index, 1);

    // Delete full channel array if empty.

    const deleteChannel = conditionally({
      if: () =>
        this.collection[channel] && this.collection[channel].length === 0,
      then: () => delete this.collection[channel],
    });

    // Check if listener was provided in args.

    const listenerProvided = conditionally({
      if: () => isDefined(listener),
      then: () => deleteAtIndex(this.collection[channel].indexOf(listener!)),
      else: () => delete this.collection[channel],
    });

    const channelRegistered = conditionally({
      if: (channel: EventChannel) => this.has(channel),
      then: (channel: EventChannel) => this.collection[channel],
    });

    // Run.

    pipe(channelRegistered, listenerProvided, deleteChannel)();

    return this;
  }

  /**
   * Checks if the collection includes a specific channel or listener.
   *
   * @param { EventChannel | Listener } value The channel or the listener to find in the collection.
   * @returns { boolean } true if the collection includes this channel / this listener,
   * false if not.
   */
  public has(value: EventChannel): boolean;
  public has(value: Listener): boolean;
  public has(...args: (EventChannel | Listener)[]): boolean {
    if (isOfType('string')(args[0])) {
      return Object.keys(this.collection).includes(args[0] as string);
    } else if (isOfType('function')(args[0])) {
      return Object.values(this.collection)
        .flat()
        .includes(args[0] as Listener);
    }
    return false;
  }

  /**
   * Get a specific channel listeners array or a specific listener channels array.
   *
   * @param { EventChannel | Listener } value The channel or the listener to find in the collection.
   * @returns { EventChannel[] | Listener[] } An array of channels or listeners.
   */
  public get(value: EventChannel): Listener[];
  public get(value: Listener): EventChannel[];
  public get(
    ...args: (EventChannel | Listener)[]
  ): EventChannel[] | Listener[] {
    if (isOfType('string')(args[0])) {
      return this.collection[args[0] as string];
    } else if (isOfType('function')(args[0])) {
      return Object.values(this.collection)
        .flat()
        .filter((listener: Listener) => listener === args[0]);
    }
    return [];
  }

  /**
   * Clear the entire collction.
   *
   * @returns { ListenerCollection } This collection.
   */
  public clear(): ListenerCollection {
    const traverseCollection = forIn(this.collection);
    const traverseChannel = (channel: EventChannel) =>
      forOf(this.collection[channel])((listener: Listener) =>
        this.remove(channel, listener)
      );

    traverseCollection((channel: EventChannel) => traverseChannel(channel));

    return this;
  }

  /**
   * The listeners of this collection flatten in a single array.
   */
  public get listeners(): Listener[] {
    return Object.values(this.collection).flat();
  }

  /**
   * The listeners collection channels.
   */
  public get channels(): EventChannel[] {
    return Object.keys(this.collection);
  }

  /**
   * Returns the total listeners length.
   */
  public get length(): number {
    return Object.values(this.collection).flat().length;
  }

  /**
   * Allows iterating over listeners in specific channel with 'for... of...' loop.
   *
   * @returns { Listener } A listener function.
   *
   * @example
   * // Iterates listeners in a specific channel.
   * for (const listener of myListenerCollection) {
   *   // Calls the registered listener.
   *   listener();
   * }
   */
  public [Symbol.iterator](): Iterator<EventChannel> {
    let index = -1;
    const data: Array<string> = this.collection
      ? Object.keys(this.collection)
      : [];

    return {
      next: () => ({
        value: data[++index],
        done: !(index in data),
      }),
    };
  }
}
