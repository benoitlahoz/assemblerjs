import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from '@rollup/plugin-swc';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [
    tsconfigPaths(),
    swc({
      swc: {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          target: 'es2022',
          transform: { decoratorMetadata: true },
        },
      },
    }),
  ],
  esbuild: false,
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, '../../packages/electron/src'),
      '@windows': resolve(import.meta.dirname, 'src/windows'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
});