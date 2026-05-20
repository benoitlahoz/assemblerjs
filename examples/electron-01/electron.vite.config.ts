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
        '@windows': resolve('src/windows'),
      },
    },
    plugins: [swcPlugin()],
  },
  preload: {
    plugins: [swcPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@common': resolve('src/common'),
        '@features': resolve('src/features'),
        '@windows': resolve('src/windows'),
      },
    },
    plugins: [vue(), swcPlugin()],
  },
});
