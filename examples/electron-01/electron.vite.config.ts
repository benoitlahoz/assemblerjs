import { resolve } from 'path';
import { defineConfig, swcPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {
    plugins: [swcPlugin()],
  },
  preload: {
    plugins: [swcPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [vue(), swcPlugin()],
  },
});
