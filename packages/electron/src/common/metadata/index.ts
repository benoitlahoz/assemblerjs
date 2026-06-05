/**
 * Electron Metadata Storage - Unified API
 *
 * This module provides a concern-based metadata storage architecture:
 * - IPC metadata (parameter decorators)
 * - Window metadata (definitions, commands, events, subscriptions)
 * - Menu metadata (definitions, items, commands, subscriptions)
 *
 * All storages extend BaseScopedMetadataStorage from @assemblerjs/common
 * for consistent key management and prototype chain traversal.
 */

import { IpcMetadataStorage } from './storage/ipc-metadata-storage';
import { WindowMetadataStorage } from './storage/window-metadata-storage';
import { MenuMetadataStorage } from './storage/menu-metadata-storage';

// Export all types
export * from './types/ipc.types';
export * from './types/window.types';
export * from './types/menu.types';

// Export storage classes for advanced usage
export { IpcMetadataStorage, WindowMetadataStorage, MenuMetadataStorage };

/**
 * Unified metadata storage API organized by concern.
 *
 * @example
 * ```typescript
 * // Window metadata
 * ElectronMetadata.window.setDefinition(target, { name: 'main', multiple: false });
 * const definition = ElectronMetadata.window.getDefinition(target);
 *
 * // Menu metadata
 * ElectronMetadata.menu.addItem(target, 'handleClick', { id: 'file-open', label: 'Open' });
 * const items = ElectronMetadata.menu.getItems(target);
 *
 * // IPC metadata
 * ElectronMetadata.ipc.setChannelParameterIndices(target, 'onMessage', [0, 1]);
 * ```
 */
export const ElectronMetadata = {
  ipc: new IpcMetadataStorage(),
  window: new WindowMetadataStorage(),
  menu: new MenuMetadataStorage(),
} as const;
