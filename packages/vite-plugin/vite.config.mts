/// <reference types='vitest' />
import { join } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import swc from '@rollup/plugin-swc';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/vite-plugin',
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
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: 'vite-plugin-assemblerjs',
      fileName: 'index',
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      external: ['vite', '@rollup/plugin-swc', 'reflect-metadata'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named' as const,
      },
    },
    minify: false,
  },
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/fixtures/**'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage',
      provider: 'istanbul' as const,
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
}));
