import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import swc from 'rollup-plugin-swc';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['json-summary', 'text'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.spec.*',
        '**/e2e/**',
        '**/docs/**',
      ],
    },
    exclude: ['**/node_modules/**', '**/docs/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
      },
    }),
  ],
  esbuild: false,
});
