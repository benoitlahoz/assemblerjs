import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import swc from 'rollup-plugin-swc';
import dts from 'vite-plugin-dts';

/**
 * Main configuration.
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: `index`,
    },
  },
  plugins: [
    // @ts-expect-error https://stackoverflow.com/a/74304876
    swc.default({
      jsc: {
        parser: {
          syntax: 'typescript',
          dynamicImport: true,
          decorators: true,
        },
        target: 'es2021',
        transform: {
          decoratorMetadata: true,
        },
        minify: {
          mangle: true,
          keep_classnames: true,
          sourceMap: true,
        },
      },
    }),
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      exclude: ['vite.config.mts'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  esbuild: false,
});
