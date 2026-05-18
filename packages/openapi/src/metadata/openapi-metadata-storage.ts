import type { OperationMeta, ResponseMeta } from './openapi-metadata.types';

export interface OpenApiMetadataStorage {
  isIgnored(cls: Function, handlerName?: string | symbol): boolean;
  getOperation(cls: Function, handlerName: string | symbol): OperationMeta | undefined;
  getResponsesForHandler(cls: Function, handlerName: string | symbol): ResponseMeta[];
}

export class OpenApiMetadataStorageImpl implements OpenApiMetadataStorage {
  private readonly responses: Map<
    Function,
    Map<string | symbol, ResponseMeta[]>
  > = new Map();

  private readonly operations: Map<
    Function,
    Map<string | symbol, OperationMeta>
  > = new Map();

  private readonly ignoredHandlers: Map<
    Function,
    Set<string | symbol>
  > = new Map();

  private readonly ignoredControllers: Set<Function> = new Set();

  ////////////////////////////////////////////////////////////////////////////
  // Internal: prototype-chain lookup
  ////////////////////////////////////////////////////////////////////////////

  private lookupMap<V>(map: Map<Function, V>, cls: Function): V | undefined {
    let current: Function | null = cls;
    while (current && current !== Function.prototype) {
      if (map.has(current)) return map.get(current);
      current = Object.getPrototypeOf(current);
    }
    return undefined;
  }

  ////////////////////////////////////////////////////////////////////////////
  // Responses (@Success / @Error)
  ////////////////////////////////////////////////////////////////////////////

  public addResponse(
    controller: Function,
    handlerName: string | symbol,
    meta: ResponseMeta
  ): void {
    if (!this.responses.has(controller)) {
      this.responses.set(controller, new Map());
    }
    const byHandler = this.responses.get(controller)!;
    if (!byHandler.has(handlerName)) {
      byHandler.set(handlerName, []);
    }
    byHandler.get(handlerName)!.push(meta);
  }

  public getResponsesForHandler(
    controller: Function,
    handlerName: string | symbol
  ): ResponseMeta[] {
    return this.lookupMap(this.responses, controller)?.get(handlerName) ?? [];
  }

  ////////////////////////////////////////////////////////////////////////////
  // Operations (@Operation)
  ////////////////////////////////////////////////////////////////////////////

  public addOperation(
    controller: Function,
    handlerName: string | symbol,
    meta: OperationMeta
  ): void {
    if (!this.operations.has(controller)) {
      this.operations.set(controller, new Map());
    }
    this.operations.get(controller)!.set(handlerName, meta);
  }

  public getOperation(
    controller: Function,
    handlerName: string | symbol
  ): OperationMeta | undefined {
    return this.lookupMap(this.operations, controller)?.get(handlerName);
  }

  ////////////////////////////////////////////////////////////////////////////
  // Ignored (@Ignore)
  ////////////////////////////////////////////////////////////////////////////

  public ignoreHandler(
    controller: Function,
    handlerName: string | symbol
  ): void {
    if (!this.ignoredHandlers.has(controller)) {
      this.ignoredHandlers.set(controller, new Set());
    }
    this.ignoredHandlers.get(controller)!.add(handlerName);
  }

  public ignoreController(controller: Function): void {
    this.ignoredControllers.add(controller);
  }

  public isIgnored(
    controller: Function,
    handlerName?: string | symbol
  ): boolean {
    // Check ignored controllers (walk prototype chain)
    let current: Function | null = controller;
    while (current && current !== Function.prototype) {
      if (this.ignoredControllers.has(current)) return true;
      current = Object.getPrototypeOf(current);
    }
    if (handlerName === undefined) return false;
    return this.lookupMap(this.ignoredHandlers, controller)?.has(handlerName) ?? false;
  }
}

export const OpenApiMetadataStorage = new OpenApiMetadataStorageImpl();
