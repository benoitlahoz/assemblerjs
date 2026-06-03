import { resolve } from 'path';
import { defineConfig, swcPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@common': resolve('src/common'),
        '@features': resolve('src/features'),
        '@menus': resolve('src/menus'),
        '@windows': resolve('src/windows'),
        '@preload': resolve('src/preload'),
      },
    },
    plugins: [swcPlugin()],
  },
  preload: {
    resolve: {
      alias: {
        '@preload': resolve('src/preload'),
      },
    },
    plugins: [swcPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@common': resolve('src/common'),
        '@features': resolve('src/features'),
        '@menus': resolve('src/menus'),
        '@windows': resolve('src/windows'),
        '@preload': resolve('src/preload'),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
    plugins: [vue(), swcPlugin()],
  },
});
