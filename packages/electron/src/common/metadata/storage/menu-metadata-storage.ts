import { BaseScopedMetadataStorage } from '@assemblerjs/common';
import type {
  MenuDefinitionMetadata,
  MenuRendererDefinitionMetadata,
  MenuItemMetadata,
  MenuRendererSubscriptionMetadata,
  RendererIpcSubscriptionType,
} from '../types/menu.types';

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
 * Menu-specific metadata storage.
 * Manages all Menu-related decorators: @Menu, @MenuItem, @MenuCommand, etc.
 */
export class MenuMetadataStorage extends BaseScopedMetadataStorage {
  constructor() {
    super('electron:menu');
  }

  // ============================================================================
  // Class-level definitions
  // ============================================================================

  /**
   * Store @Menu definition metadata.
   */
  public setDefinition(
    target: Function,
    definition: MenuDefinitionMetadata,
  ): void {
    this.setClass('definition', target, definition);
  }

  /**
   * Retrieve @Menu definition metadata.
   */
  public getDefinition(target: Function): MenuDefinitionMetadata | undefined {
    return this.getClass('definition', target);
  }

  /**
   * Store @MenuRenderer definition metadata.
   */
  public setRendererDefinition(
    target: Function,
    definition: MenuRendererDefinitionMetadata,
  ): void {
    this.setClass('renderer.definition', target, definition);
  }

  /**
   * Retrieve @MenuRenderer definition metadata.
   */
  public getRendererDefinition(
    target: Function,
  ): MenuRendererDefinitionMetadata | undefined {
    return this.getClass('renderer.definition', target);
  }

  // ============================================================================
  // Method-level collections
  // ============================================================================

  /**
   * Add @MenuCommand metadata entry.
   */
  public addCommand(target: object, method: string, command: string): void {
    this.addMethodEntry('command', target, method, {
      method,
      command,
    });
  }

  /**
   * Retrieve all @MenuCommand metadata entries.
   */
  public getCommands<T extends { method: string; command: string }>(
    target: Function,
  ): T[] {
    return uniqueByMethod(this.getMethodEntries<T>('command', target));
  }

  /**
   * Add @MenuItem metadata entry.
   */
  public addItem(
    target: object,
    method: string,
    item: Omit<MenuItemMetadata, 'method'>,
  ): void {
    this.addMethodEntry('item', target, method, {
      method,
      ...item,
    } as MenuItemMetadata);
  }

  /**
   * Retrieve all @MenuItem metadata entries.
   */
  public getItems(target: Function): MenuItemMetadata[] {
    return uniqueByMethod(
      this.getMethodEntries<MenuItemMetadata>('item', target),
    );
  }

  /**
   * Add @MenuRendererSubscription metadata entry.
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
    } as MenuRendererSubscriptionMetadata);
  }

  /**
   * Retrieve all @MenuRendererSubscription metadata entries.
   * Note: Does NOT deduplicate by method - a single method can listen to multiple events.
   */
  public getRendererSubscriptions(
    target: Function,
  ): MenuRendererSubscriptionMetadata[] {
    return this.getMethodEntries<MenuRendererSubscriptionMetadata>(
      'renderer.subscription',
      target,
    );
  }
}
