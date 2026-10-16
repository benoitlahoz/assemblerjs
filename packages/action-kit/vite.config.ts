import path from 'node:path';
import { defineConfig } from 'vite';
import swc from '@rollup/plugin-swc';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      insertTypesEntry: true,
    }),
    swc({
      exclude: ['**/*.css', '**/*.html'],
      swc: {
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
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  esbuild: false,

  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        factory: path.resolve(__dirname, 'src/factory.ts'),
      },
      formats: ['es'],
    },

    rollupOptions: {
      external: [],
    },

    sourcemap: true,
  },
});
