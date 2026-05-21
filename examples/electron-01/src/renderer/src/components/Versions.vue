<script setup lang="ts">
import { useIpc } from '@renderer/composables/useIpc';
import { onMounted, ref } from 'vue';

const { debug } = useIpc();

const defaultVersions = {
  electron: 'unknown',
  chrome: 'unknown',
  node: 'unknown',
};
const versions = ref({ ...defaultVersions });


onMounted(async () => {
  versions.value = await debug.getVersions() ?? { ...defaultVersions };
  console.log('Platform:', await debug.getPlatform());
});
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
