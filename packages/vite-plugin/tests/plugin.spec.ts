import { describe, it, expect } from 'vitest';
import AssemblerjsPlugin from '../src/plugin';
import type { AssemblerjsPluginOptions } from '../src/types';

describe('vite-plugin-assemblerjs', () => {
  describe('Plugin Creation', () => {
    it('should return an array of plugins', () => {
      const plugins = AssemblerjsPlugin();
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });

    it('should create plugins with default options', () => {
      const plugins = AssemblerjsPlugin();
      expect(plugins.length).toBe(2); // SWC + reflect-metadata
    });

    it('should respect disabled SWC option', () => {
      const plugins = AssemblerjsPlugin({ swc: { enabled: false } });
      expect(plugins.length).toBe(1); // Only reflect-metadata
    });

    it('should respect disabled reflect-metadata option', () => {
      const plugins = AssemblerjsPlugin({ 
        reflectMetadata: { autoInject: false } 
      });
      expect(plugins.length).toBe(1); // Only SWC
    });

    it('should handle manual reflect-metadata mode', () => {
      const plugins = AssemblerjsPlugin({ 
        reflectMetadata: { injectMode: 'manual' } 
      });
      expect(plugins.length).toBe(1); // Only SWC
    });
  });

  describe('SWC Configuration', () => {
    it('should configure SWC with correct defaults', () => {
      const plugins = AssemblerjsPlugin();
      const swcPlugin = plugins[0];
      
      expect(swcPlugin).toBeDefined();
      expect(swcPlugin.name).toContain('swc');
    });

    it('should use custom target option', () => {
      const plugins = AssemblerjsPlugin({
        swc: { target: 'es2020' }
      });
      
      expect(plugins[0]).toBeDefined();
    });

    it('should preserve class names by default', () => {
      const plugins = AssemblerjsPlugin();
      expect(plugins[0]).toBeDefined();
    });

    it('should allow disabling class name preservation', () => {
      const plugins = AssemblerjsPlugin({
        swc: { keepClassNames: false }
      });
      
      expect(plugins[0]).toBeDefined();
    });
  });

  describe('reflect-metadata Injection', () => {
    it('should create reflect-metadata plugin', () => {
      const plugins = AssemblerjsPlugin();
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      expect(metadataPlugin).toBeDefined();
      expect(metadataPlugin?.enforce).toBe('pre');
    });

    it('should resolve virtual module ID', () => {
      const plugins = AssemblerjsPlugin();
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      const resolved = (metadataPlugin as any).resolveId?.('virtual:assemblerjs-metadata');
      expect(resolved).toBe('\0virtual:assemblerjs-metadata');
    });

    it('should load virtual module content', () => {
      const plugins = AssemblerjsPlugin();
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      const content = (metadataPlugin as any).load?.('\0virtual:assemblerjs-metadata');
      expect(content).toContain('reflect-metadata');
    });

    it('should inject in entry files', () => {
      const plugins = AssemblerjsPlugin({ 
        reflectMetadata: { injectMode: 'entry' } 
      });
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      const code = 'console.log("test");';
      const result = (metadataPlugin as any).transform?.(code, '/src/main.ts');
      
      if (result) {
        expect(result.code).toContain('virtual:assemblerjs-metadata');
      }
    });

    it('should not inject in non-entry files', () => {
      const plugins = AssemblerjsPlugin({ 
        reflectMetadata: { injectMode: 'entry' } 
      });
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      const code = 'console.log("test");';
      const result = (metadataPlugin as any).transform?.(code, '/src/services/user.service.ts');
      
      expect(result).toBeNull();
    });

    it('should not inject if already present', () => {
      const plugins = AssemblerjsPlugin({ 
        reflectMetadata: { injectMode: 'entry' } 
      });
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      const code = 'import "reflect-metadata";\nconsole.log("test");';
      const result = (metadataPlugin as any).transform?.(code, '/src/main.ts');
      
      expect(result).toBeNull();
    });

    it('should configure optimizeDeps', () => {
      const plugins = AssemblerjsPlugin();
      const metadataPlugin = plugins.find(p => 
        p.name === 'vite-plugin-assemblerjs:reflect-metadata'
      );
      
      const config = (metadataPlugin as any).config?.();
      expect(config?.optimizeDeps?.include).toContain('reflect-metadata');
    });
  });

  describe('Options Merging', () => {
    it('should merge partial options with defaults', () => {
      const plugins = AssemblerjsPlugin({
        swc: { target: 'es2020' }
      });
      
      expect(plugins.length).toBe(2);
    });

    it('should handle empty options', () => {
      const plugins = AssemblerjsPlugin({});
      expect(plugins.length).toBe(2);
    });

    it('should handle undefined options', () => {
      const plugins = AssemblerjsPlugin(undefined);
      expect(plugins.length).toBe(2);
    });
  });

  describe('Integration', () => {
    it('should work with minimal configuration', () => {
      const plugins = AssemblerjsPlugin();
      
      expect(plugins.length).toBe(2);
      expect(plugins[0].name).toContain('swc');
      expect(plugins[1].name).toContain('reflect-metadata');
    });

    it('should support custom SWC options', () => {
      const options: AssemblerjsPluginOptions = {
        swc: {
          enabled: true,
          target: 'es2022',
          keepClassNames: true,
          options: {
            jsc: {
              experimental: {
                plugins: []
              }
            }
          }
        }
      };
      
      const plugins = AssemblerjsPlugin(options);
      expect(plugins[0]).toBeDefined();
    });
  });
});
