import { describe, it, expect } from 'vitest';
import * as pluginExports from '../src/index';

describe('Package Exports', () => {
  it('should export default plugin function', () => {
    expect(pluginExports.default).toBeDefined();
    expect(typeof pluginExports.default).toBe('function');
  });

  it('should export named plugin function', () => {
    expect(pluginExports.assemblerjsPlugin).toBeDefined();
    expect(typeof pluginExports.assemblerjsPlugin).toBe('function');
  });

  it('should export types', () => {
    // Types are only checked at compile time, but we verify the module structure
    expect(pluginExports).toHaveProperty('default');
    expect(pluginExports).toHaveProperty('assemblerjsPlugin');
  });

  it('should have correct function signature', () => {
    const plugin = pluginExports.default();
    expect(Array.isArray(plugin)).toBe(true);
  });
});
