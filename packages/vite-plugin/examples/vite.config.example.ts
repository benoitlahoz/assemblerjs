import { defineConfig } from 'vite';
import { AssemblerjsPlugin } from '../src/index';

/**
 * Example Vite configuration with vite-plugin-assemblerjs
 * 
 * This shows the minimal configuration needed to use AssemblerJS with Vite.
 */
export default defineConfig({
  plugins: [
    // Add the plugin with default options
    AssemblerjsPlugin()
  ]
});

/**
 * Example with custom configuration
 */
export const advancedConfig = defineConfig({
  plugins: [
    AssemblerjsPlugin({
      // SWC configuration
      swc: {
        enabled: true,
        target: 'es2021',
        keepClassNames: true,
      },
      
      // reflect-metadata configuration
      reflectMetadata: {
        autoInject: true,
        injectMode: 'entry',
      }
    })
  ]
});

/**
 * Example with SWC disabled (use esbuild instead)
 */
export const withoutSwcConfig = defineConfig({
  plugins: [
    AssemblerjsPlugin({
      swc: {
        enabled: false, // You'll need to configure decorators elsewhere
      }
    })
  ]
});

/**
 * Example with manual reflect-metadata management
 */
export const manualMetadataConfig = defineConfig({
  plugins: [
    AssemblerjsPlugin({
      reflectMetadata: {
        autoInject: false, // You'll need to import reflect-metadata manually
      }
    })
  ]
});
