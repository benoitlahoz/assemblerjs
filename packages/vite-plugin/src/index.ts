/**
 * vite-plugin-assemblerjs
 * 
 * A Vite plugin for seamless AssemblerJS integration with zero-configuration.
 * 
 * Features:
 * - Auto-configure SWC for decorator metadata transformation
 * - Auto-inject reflect-metadata polyfill
 * - Zero configuration with sensible defaults
 * 
 * @packageDocumentation
 */

export { default, assemblerjsPlugin } from './plugin';
export type { AssemblerjsPluginOptions, ViteConfig } from './types';
