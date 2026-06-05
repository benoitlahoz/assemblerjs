/**
 * Generic IPC channel builder following the pattern: `<scope>:<identifier>.<operation>`
 *
 * Examples:
 *   buildChannel('window', 'main', 'focus') → 'window:main.focus'
 *   buildChannel('menu', 'app', 'snapshot') → 'menu:app.snapshot'
 *
 * This pattern is commonly used in IPC-based architectures (e.g., Electron)
 * where channels need to be scoped by domain (window, menu) and instance.
 */

export type ChannelScope = string;
export type ChannelIdentifier = string;
export type ChannelOperation = string;

/**
 * Build a scoped IPC channel string.
 *
 * @param scope - The domain or entity type (e.g., 'window', 'menu', 'system')
 * @param identifier - The instance name or ID (e.g., 'main', 'settings')
 * @param operation - The command or event name (e.g., 'focus', 'resize', 'click')
 * @returns A channel string in the format: `<scope>:<identifier>.<operation>`
 *
 * @example
 * ```ts
 * buildChannel('window', 'main', 'focus') // → 'window:main.focus'
 * buildChannel('menu', 'app', 'itemClicked') // → 'menu:app.itemClicked'
 * ```
 */
export const buildChannel = (
  scope: ChannelScope,
  identifier: ChannelIdentifier,
  operation: ChannelOperation,
): string => {
  if (!scope || !identifier || !operation) {
    throw new Error('scope, identifier, and operation are required');
  }

  return `${scope}:${identifier}.${operation}`;
};

/**
 * Create a scoped channel builder factory for a specific domain.
 *
 * @param scope - The domain to scope all channels to
 * @returns A builder function that accepts identifier and operation
 *
 * @example
 * ```ts
 * const buildWindowChannel = createChannelBuilder('window');
 * buildWindowChannel('main', 'focus') // → 'window:main.focus'
 *
 * const buildMenuChannel = createChannelBuilder('menu');
 * buildMenuChannel('app', 'itemClicked') // → 'menu:app.itemClicked'
 * ```
 */
export const createChannelBuilder = (scope: ChannelScope) => {
  return (identifier: ChannelIdentifier, operation: ChannelOperation): string =>
    buildChannel(scope, identifier, operation);
};

/**
 * Parse a channel string into its components.
 *
 * @param channel - The channel string to parse
 * @returns An object with scope, identifier, and operation, or null if invalid
 *
 * @example
 * ```ts
 * parseChannel('window:main.focus')
 * // → { scope: 'window', identifier: 'main', operation: 'focus' }
 * ```
 */
export const parseChannel = (
  channel: string,
): { scope: string; identifier: string; operation: string } | null => {
  const match = channel.match(/^([^:]+):([^.]+)\.(.+)$/);
  if (!match) {
    return null;
  }

  return {
    scope: match[1],
    identifier: match[2],
    operation: match[3],
  };
};
