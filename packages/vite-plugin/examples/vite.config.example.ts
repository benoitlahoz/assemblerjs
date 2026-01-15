import { defineConfig } from 'vite';
import assemblerjs from '../src/index';

/**
 * Example Vite configuration with vite-plugin-assemblerjs
 * 
 * This shows the minimal configuration needed to use AssemblerJS with Vite.
 */
export default defineConfig({
  plugins: [
    // Add the plugin with default options
    assemblerjs()
  ]
});

/**
 * Example with custom configuration
 */
export const advancedConfig = defineConfig({
  plugins: [
    assemblerjs({
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
    assemblerjs({
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
    assemblerjs({
      reflectMetadata: {
        autoInject: false, // You'll need to import reflect-metadata manually
      }
    })
  ]
});
