/// <reference types='vitest' />
import { join } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import swc from '@rollup/plugin-swc';

export default {
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/common',
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
      name: 'assemblerjs-common',
      fileName: 'index',
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      external: ['reflect-metadata'],
    },
    minify: 'terser' as const,
  },
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,e2e}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage',
      provider: 'istanbul' as const,
    },
  },
};
