import { AbstractAssemblage } from 'assemblerjs';

/**
 * Abstract class for IPC (Inter-Process Communication) services.
 * Defines the contract for communication between Electron's main and renderer processes.
 */
export abstract class AbstractIpcService implements AbstractAssemblage {
  /**
   * The list of available IPC channels.
   */
  public abstract readonly channels: ReadonlyArray<string>;

  /**
   * Version information for various components.
   */
  public abstract readonly versions: Record<string, string>;

  /**
   * Registers a listener for the specified channel.
   * @param channel - The IPC channel name
   * @param listener - The callback function to handle received data
   */
  public abstract on(channel: string, listener: (data: any) => void): void;

  /**
   * Registers a one-time listener for the specified channel.
   * @param channel - The IPC channel name
   * @param listener - The callback function to handle received data
   */
  public abstract once(channel: string, listener: (data: any) => void): void;

  /**
   * Removes a specific listener from the specified channel.
   * @param channel - The IPC channel name
   * @param listener - The listener function to remove
   */
  public abstract off(channel: string, listener: (data: any) => void): void;

  /**
   * Removes all listeners from the specified channel.
   * @param channel - The IPC channel name
   */
  public abstract removeAllListeners(channel: string): void;

  /**
   * Sends a message to the main process via the specified channel.
   * @param channel - The IPC channel name
   * @param data - The data to send
   */
  public abstract send(channel: string, data: any): void;

  /**
   * Invokes a method in the main process and waits for a response.
   * @param channel - The IPC channel name
   * @param data - The data to send
   * @returns Promise that resolves with the response from the main process
   */
  public abstract invoke(channel: string, data: any): Promise<any>;

  /**
   * Emits an event to the main process via the specified channel.
   * @param channel - The IPC channel name
   * @param data - The data to emit
   * @returns Promise that resolves when the event is emitted
   */
  public abstract emit(channel: string, data: any): Promise<void>;
}
