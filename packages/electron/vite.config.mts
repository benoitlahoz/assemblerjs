/// <reference types='vitest' />
import { join } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import swc from '@rollup/plugin-swc';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/electron',
  plugins: [
    tsconfigPaths(),
    swc({
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
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  esbuild: false as const,
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: [
        './src/main-process.ts',
        './src/renderer-process.ts',
        './src/preload.ts',
      ],
      name: 'assemblerjs-electron',
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        // Monorepo dependencies
        '@assemblerjs/core',
        'assemblerjs',
        '@assemblerjs/dto',
        '@assemblerjs/fetch',
        '@assemblerjs/mongo',
        '@assemblerjs/rest',
        // Package dependencies
        'reflect-metadata',
        'electron',
        // Node.js built-ins
        /^node:/,
        // Electron built-ins
        'electron/main',
        'electron/renderer',
        'electron/common',
        // Common external dependencies that might be used
        '@electron-toolkit/preload',
        '@electron-toolkit/utils',
      ],
    },
    minify: 'terser' as const,
  },
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
  test: {
    watch: true,
    globals: true,
    environment: 'node',
    include: ['{src,e2e}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage',
      provider: 'istanbul' as const,
    },
  },
}));
