import { describe, it, expect } from 'vitest';
import * as pluginExports from '../src/index';

describe('Package Exports', () => {
  it('should export named plugin function', () => {
    expect(pluginExports.AssemblerjsPlugin).toBeDefined();
    expect(typeof pluginExports.AssemblerjsPlugin).toBe('function');
  });

  it('should export types', () => {
    // Types are only checked at compile time, but we verify the module structure
    expect(pluginExports).toHaveProperty('AssemblerjsPlugin');
  });

  it('should have correct function signature', () => {
    const plugin = pluginExports.AssemblerjsPlugin();
    expect(Array.isArray(plugin)).toBe(true);
  });
});
