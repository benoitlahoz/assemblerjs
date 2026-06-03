/// <reference types='vitest' />
import { join } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import swc from '@rollup/plugin-swc';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/rest',
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
      compilerOptions: {
        composite: false,
        declarationMap: false,
      },
      rollupTypes: false,
      insertTypesEntry: true,
      exclude: ['**/node_modules/**'],
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
      // Multiple entry points — one per sub-path export
      entry: {
        index: 'src/index.ts',
        express: 'src/express.ts',
        fastify: 'src/fastify.ts',
      },
      name: 'assemblerjs-rest',
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const, 'cjs' as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        'express',
        'fastify',
        'cookie-parser',
        'body-parser',
        'assemblerjs',
        '@assemblerjs/core',
        '@assemblerjs/dto',
        'class-validator',
        'node:http',
        'node:https',
      ],
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
}));
