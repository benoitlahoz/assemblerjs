import type { Plugin as VitePlugin } from 'vite';
import swc from '@rollup/plugin-swc';
import type { AssemblerjsPluginOptions } from './types';

const VIRTUAL_METADATA_ID = 'virtual:assemblerjs-metadata';
const RESOLVED_METADATA_ID = '\0' + VIRTUAL_METADATA_ID;

/**
 * Deep merge two objects.
 */
function mergeDeep(target: any, source: any): any {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Default plugin options.
 */
const defaultOptions: Required<AssemblerjsPluginOptions> = {
  swc: {
    enabled: true,
    target: 'es2021',
    keepClassNames: true,
  },
  reflectMetadata: {
    autoInject: true,
    injectMode: 'entry',
  },
};

/**
 * Merge user options with defaults.
 */
function mergeOptions(userOptions: AssemblerjsPluginOptions = {}): Required<AssemblerjsPluginOptions> {
  return {
    swc: {
      ...defaultOptions.swc,
      ...userOptions.swc,
    },
    reflectMetadata: {
      ...defaultOptions.reflectMetadata,
      ...userOptions.reflectMetadata,
    },
  };
}

/**
 * Create SWC plugin with AssemblerJS-specific configuration.
 */
function createSwcPlugin(options: Required<AssemblerjsPluginOptions>): VitePlugin {
  // Default SWC configuration for AssemblerJS
  const defaultSwcConfig = {
    swc: {
      jsc: {
        parser: {
          syntax: 'typescript' as const,
          dynamicImport: true,
          decorators: true,
        },
        target: options.swc.target,
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        minify: {
          mangle: true,
          keep_classnames: options.swc.keepClassNames,
          sourceMap: true,
        },
      },
    },
  };

  // Deep merge user options with defaults
  const swcOptions = mergeDeep(defaultSwcConfig, options.swc.options || {});

  return swc(swcOptions) as VitePlugin;
}

/**
 * Vite plugin for seamless AssemblerJS integration.
 * 
 * This plugin provides:
 * - Automatic SWC configuration for decorator metadata
 * - Automatic reflect-metadata injection
 * 
 * @param userOptions - Plugin configuration options
 * @returns Vite plugin
 * 
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { AssemblerjsPlugin } from 'vite-plugin-assemblerjs';
 * 
 * export default defineConfig({
 *   plugins: [AssemblerjsPlugin()]
 * });
 * ```
 */
export default function AssemblerjsPlugin(userOptions: AssemblerjsPluginOptions = {}): VitePlugin[] {
  const options = mergeOptions(userOptions);
  const plugins: VitePlugin[] = [];

  // Add SWC plugin if enabled
  if (options.swc.enabled) {
    plugins.push(createSwcPlugin(options));
  }

  // Add reflect-metadata injection plugin if enabled
  if (options.reflectMetadata.autoInject && options.reflectMetadata.injectMode !== 'manual') {
    plugins.push({
      name: 'vite-plugin-assemblerjs:reflect-metadata',
      enforce: 'pre',

      // Resolve virtual module for reflect-metadata
      resolveId(id: string) {
        if (id === VIRTUAL_METADATA_ID) {
          return RESOLVED_METADATA_ID;
        }
        return null;
      },

      // Load virtual module content
      load(id: string) {
        if (id === RESOLVED_METADATA_ID) {
          if (options.reflectMetadata.injectMode === 'inline') {
            // Inline the reflect-metadata code
            return `import 'reflect-metadata';`;
          }
          return `import 'reflect-metadata';`;
        }
        return null;
      },

      // Inject virtual module at entry point
      transform(code: string, id: string) {
        // Only inject in entry files (main.ts, index.ts, etc.)
        if (options.reflectMetadata.injectMode === 'entry') {
          const entryPatterns = [
            /\/(main|index|app)\.(ts|tsx|js|jsx)$/,
            /\/src\/(main|index|app)\.(ts|tsx|js|jsx)$/,
          ];

          const isEntry = entryPatterns.some(pattern => pattern.test(id));

          if (isEntry && !code.includes('reflect-metadata') && !code.includes(VIRTUAL_METADATA_ID)) {
            return {
              code: `import '${VIRTUAL_METADATA_ID}';\n${code}`,
              map: null,
            };
          }
        }
        return null;
      },

      // Provide info about the plugin
      config() {
        return {
          optimizeDeps: {
            include: ['reflect-metadata'],
          },
        };
      },
    });
  }

  return plugins;
}
