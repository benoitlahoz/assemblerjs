import { AbstractAssemblage, AssemblerContext } from 'assemblerjs';
import type {
  DefaultIpcContractMap,
  IpcArgsFor,
  IpcContractMap,
  IpcResponseFor,
  KnownIpcChannel,
} from '@/universal/types';

/**
 * Abstract class for IPC (Inter-Process Communication) services.
 * Defines the contract for communication between Electron's main and renderer processes.
 */
export abstract class AbstractIpcService<
  Contracts extends IpcContractMap = DefaultIpcContractMap
> implements AbstractAssemblage {
  /**
   * The list of available IPC channels.
   */
  public abstract readonly channels: ReadonlyArray<KnownIpcChannel<Contracts>>;

  /**
   * Version information for various components.
   */
  public abstract readonly versions: Record<string, string>;

  /**
   * Registers a listener for the specified channel.
   * @param channel - The IPC channel name
   * @param listener - The callback function to handle received data
   */
  public abstract on<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): () => void;
  public abstract on(
    channel: string,
    listener: (...args: any[]) => void
  ): () => void;

  /**
   * Registers a one-time listener for the specified channel.
   * @param channel - The IPC channel name
   * @param listener - The callback function to handle received data
   */
  public abstract once<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): () => void;
  public abstract once(
    channel: string,
    listener: (...args: any[]) => void
  ): () => void;

  /**
   * Removes a specific listener from the specified channel.
   * @param channel - The IPC channel name
   * @param listener - The listener function to remove
   */
  public abstract off<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    listener: (...args: IpcArgsFor<Contracts, Channel>) => void
  ): void;
  public abstract off(channel: string, listener: (...args: any[]) => void): void;

  /**
   * Removes all listeners from the specified channel.
   * @param channel - The IPC channel name
   */
  public abstract removeAllListeners(channel: KnownIpcChannel<Contracts>): void;
  public abstract removeAllListeners(channel: string): void;

  /**
   * Sends a message to the main process via the specified channel.
   * @param channel - The IPC channel name
   * @param data - The data to send
   */
  public abstract send<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): void;
  public abstract send(channel: string, ...args: any[]): void;

  /**
   * Invokes a method in the main process and waits for a response.
   * @param channel - The IPC channel name
   * @param data - The data to send
   * @returns Promise that resolves with the response from the main process
   */
  public abstract invoke<Channel extends KnownIpcChannel<Contracts>>(
    channel: Channel,
    ...args: IpcArgsFor<Contracts, Channel>
  ): Promise<IpcResponseFor<Contracts, Channel>>;
  public abstract invoke(channel: string, ...args: any[]): Promise<any>;

  public abstract onDispose(context: AssemblerContext, configuration?: Record<string, any>): void | Promise<void>;
}
