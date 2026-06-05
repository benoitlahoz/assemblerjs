import { BaseScopedMetadataStorage } from '@assemblerjs/common';
import type {
  WindowDefinitionMetadata,
  WindowRendererDefinitionMetadata,
  WindowUseMenuDefinitionMetadata,
  WindowRendererSubscriptionMetadata,
  WindowMainSubscriptionMetadata,
  RendererIpcSubscriptionType,
} from '../types/window.types';

/**
 * Helper to ensure unique entries by method name.
 */
function uniqueByMethod<T extends { method: string }>(entries: T[]): T[] {
  const unique = new Map<string, T>();
  for (const entry of entries) {
    if (!unique.has(entry.method)) {
      unique.set(entry.method, entry);
    }
  }
  return [...unique.values()];
}

/**
 * Window-specific metadata storage.
 * Manages all Window-related decorators: @Window, @WindowCommand, @WindowEmit, etc.
 */
export class WindowMetadataStorage extends BaseScopedMetadataStorage {
  constructor() {
    super('electron:window');
  }

  // ============================================================================
  // Class-level definitions
  // ============================================================================

  /**
   * Store @Window definition metadata.
   */
  public setDefinition(
    target: Function,
    definition: WindowDefinitionMetadata,
  ): void {
    this.setClass('definition', target, definition);
  }

  /**
   * Retrieve @Window definition metadata.
   */
  public getDefinition(target: Function): WindowDefinitionMetadata | undefined {
    return this.getClass('definition', target);
  }

  /**
   * Store @WindowRenderer definition metadata.
   */
  public setRendererDefinition(
    target: Function,
    definition: WindowRendererDefinitionMetadata,
  ): void {
    this.setClass('renderer.definition', target, definition);
  }

  /**
   * Retrieve @WindowRenderer definition metadata.
   */
  public getRendererDefinition(
    target: Function,
  ): WindowRendererDefinitionMetadata | undefined {
    return this.getClass('renderer.definition', target);
  }

  /**
   * Store @UseMenu definition metadata.
   */
  public setUseMenuDefinition(
    target: Function,
    definition: WindowUseMenuDefinitionMetadata,
  ): void {
    this.setClass('use-menu.definition', target, definition);
  }

  /**
   * Retrieve @UseMenu definition metadata.
   */
  public getUseMenuDefinition(
    target: Function,
  ): WindowUseMenuDefinitionMetadata | undefined {
    return this.getClass('use-menu.definition', target);
  }

  // ============================================================================
  // Method-level collections
  // ============================================================================

  /**
   * Add @WindowCommand metadata entry.
   */
  public addCommand(target: object, method: string, command: string): void {
    this.addMethodEntry('command', target, method, {
      method,
      command,
    });
  }

  /**
   * Retrieve all @WindowCommand metadata entries.
   */
  public getCommands<T extends { method: string; command: string }>(
    target: Function,
  ): T[] {
    return uniqueByMethod(this.getMethodEntries<T>('command', target));
  }

  /**
   * Add @WindowEmit metadata entry.
   */
  public addEmit(target: object, method: string, event: string): void {
    this.addMethodEntry('emit', target, method, {
      method,
      event,
    });
  }

  /**
   * Retrieve all @WindowEmit metadata entries.
   * Note: Does NOT deduplicate by method - a single method can emit multiple events.
   */
  public getEmits<T extends { method: string; event: string }>(
    target: Function,
  ): T[] {
    return this.getMethodEntries<T>('emit', target);
  }

  /**
   * Retrieve @WindowEmit metadata for a specific method.
   */
  public getEmitForMethod<T extends { method: string; event: string }>(
    target: Function | object,
    method: string,
  ): T | undefined {
    const ctor = typeof target === 'function' ? target : target.constructor;
    const entries = this.getMethodEntries<T>('emit', ctor, method);
    return entries[0];
  }

  /**
   * Add @WindowRendererSubscription metadata entry.
   */
  public addRendererSubscription(
    target: object,
    method: string,
    event: string,
    type: RendererIpcSubscriptionType,
  ): void {
    this.addMethodEntry('renderer.subscription', target, method, {
      method,
      event,
      type,
    } as WindowRendererSubscriptionMetadata);
  }

  /**
   * Retrieve all @WindowRendererSubscription metadata entries.
   * Note: Does NOT deduplicate by method - a single method can listen to multiple events.
   */
  public getRendererSubscriptions(
    target: Function,
  ): WindowRendererSubscriptionMetadata[] {
    return this.getMethodEntries<WindowRendererSubscriptionMetadata>(
      'renderer.subscription',
      target,
    );
  }

  /**
   * Add @WindowMainSubscription metadata entry.
   */
  public addMainSubscription(
    target: object,
    method: string,
    channel: string,
  ): void {
    this.addMethodEntry('main.subscription', target, method, {
      method,
      channel,
    } as WindowMainSubscriptionMetadata);
  }

  /**
   * Retrieve all @WindowMainSubscription metadata entries.
   * Note: Does NOT deduplicate by method - a single method can listen to multiple channels.
   */
  public getMainSubscriptions(
    target: Function,
  ): WindowMainSubscriptionMetadata[] {
    return this.getMethodEntries<WindowMainSubscriptionMetadata>(
      'main.subscription',
      target,
    );
  }
}
