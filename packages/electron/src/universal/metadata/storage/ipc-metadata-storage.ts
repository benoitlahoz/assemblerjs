import {
  BaseScopedMetadataStorage,
  type MethodName,
} from '@assemblerjs/common';

/**
 * IPC-specific metadata storage.
 * Manages @IpcChannel and @IpcResult parameter indices.
 */
export class IpcMetadataStorage extends BaseScopedMetadataStorage {
  constructor() {
    super('electron:ipc');
  }

  /**
   * Store parameter indices decorated with @IpcChannel.
   */
  public setChannelParameterIndices(
    target: object,
    method: MethodName,
    indices: number[],
  ): void {
    this.setParamIndices('channel.parameters', target, method, indices);
  }

  /**
   * Retrieve parameter indices decorated with @IpcChannel.
   */
  public getChannelParameterIndices(
    target: object,
    method: MethodName,
  ): number[] {
    return this.getParamIndices('channel.parameters', target, method);
  }

  /**
   * Store parameter indices decorated with @IpcResult.
   */
  public setResultParameterIndices(
    target: object,
    method: MethodName,
    indices: number[],
  ): void {
    this.setParamIndices('result.parameters', target, method, indices);
  }

  /**
   * Retrieve parameter indices decorated with @IpcResult.
   */
  public getResultParameterIndices(
    target: object,
    method: MethodName,
  ): number[] {
    return this.getParamIndices('result.parameters', target, method);
  }
}
