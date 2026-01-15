import type { Plugin } from 'vite';

/**
 * Configuration options for the AssemblerJS Vite plugin.
 */
export interface AssemblerjsPluginOptions {
  /**
   * SWC configuration for decorator metadata transformation.
   */
  swc?: {
    /**
     * Enable automatic SWC configuration.
     * @default true
     */
    enabled?: boolean;

    /**
     * Target ECMAScript version.
     * @default 'es2021'
     */
    target?: 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022';

    /**
     * Keep class names for dependency injection.
     * This is critical for AssemblerJS to work correctly.
     * @default true
     */
    keepClassNames?: boolean;

    /**
     * Additional SWC options to merge with defaults.
     * This should be a complete SWC configuration object that will be deep-merged
     * with AssemblerJS defaults. You can override any SWC option while keeping
     * AssemblerJS-specific settings (decorators, metadata, etc.).
     */
    options?: any;
  };

  /**
   * reflect-metadata injection configuration.
   */
  reflectMetadata?: {
    /**
     * Automatically inject reflect-metadata polyfill.
     * @default true
     */
    autoInject?: boolean;

    /**
     * How to inject reflect-metadata:
     * - 'entry': Inject at application entry point (recommended)
     * - 'inline': Inline in the bundle
     * - 'manual': No automatic injection (you manage it)
     * @default 'entry'
     */
    injectMode?: 'entry' | 'inline' | 'manual';
  };
}

/**
 * Type for Vite configuration with plugins.
 */
export interface ViteConfig {
  plugins?: Plugin[];
  [key: string]: any;
}
