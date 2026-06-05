import 'reflect-metadata';
import { buildMetadataKey } from './metadata-keys';
import type { MetadataStore, MethodName } from './metadata-storage';
import { MetadataStorage } from './metadata-storage';

/**
 * Base class for scoped metadata storage implementations.
 * Provides typed, concern-specific metadata storage with automatic key scoping.
 *
 * @example
 * ```typescript
 * export class WindowMetadataStorage extends BaseScopedMetadataStorage {
 *   constructor() {
 *     super('electron:window');
 *   }
 *
 *   setDefinition(target: Function, definition: WindowDefinition): void {
 *     this.setClass('definition', target, definition);
 *   }
 *
 *   getDefinition(target: Function): WindowDefinition | undefined {
 *     return this.getClass('definition', target);
 *   }
 * }
 * ```
 */
export abstract class BaseScopedMetadataStorage {
  protected readonly store: MetadataStore;

  /**
   * @param scope - The metadata scope (e.g., 'electron:window', 'rest:route')
   * @param store - The underlying metadata store (defaults to singleton MetadataStorage)
   */
  constructor(
    protected readonly scope: string,
    store?: MetadataStore,
  ) {
    this.store = store ?? MetadataStorage;
  }

  /**
   * Build a fully scoped metadata key.
   * @param name - The metadata name within this scope
   * @returns Full key in format 'assemblerjs:<scope>:<name>'
   */
  protected getKey(name: string): string {
    return buildMetadataKey(this.scope, name);
  }

  /**
   * Store class-level metadata.
   */
  protected setClass<T>(name: string, target: Function, value: T): void {
    this.store.setClass(this.getKey(name), target, value);
  }

  /**
   * Retrieve class-level metadata.
   */
  protected getClass<T>(name: string, target: Function): T | undefined {
    return this.store.getClass<T>(this.getKey(name), target);
  }

  /**
   * Add an entry to a method-level metadata collection.
   */
  protected addMethodEntry<T>(
    name: string,
    target: object,
    method: MethodName,
    value: T,
  ): void {
    this.store.addMethodEntry(this.getKey(name), target, method, value);
  }

  /**
   * Retrieve all entries for a method-level metadata collection.
   * If method is specified, returns only entries for that method.
   */
  protected getMethodEntries<T>(
    name: string,
    target: Function,
    method?: MethodName,
  ): T[] {
    return this.store.getMethodEntries<T>(this.getKey(name), target, method);
  }

  /**
   * Store parameter indices for a method.
   */
  protected setParamIndices(
    name: string,
    target: object,
    method: MethodName,
    indices: number[],
  ): void {
    this.store.setParamIndices(this.getKey(name), target, method, indices);
  }

  /**
   * Retrieve parameter indices for a method.
   */
  protected getParamIndices(
    name: string,
    target: object,
    method: MethodName,
  ): number[] {
    return this.store.getParamIndices(this.getKey(name), target, method);
  }

  /**
   * Get the prototype chain for traversal.
   */
  protected getPrototypeChain(
    target: Function | object,
  ): Array<Function | object> {
    return this.store.getPrototypeChain(target);
  }
}
