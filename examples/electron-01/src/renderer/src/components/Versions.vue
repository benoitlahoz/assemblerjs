<script setup lang="ts">
import { useIpc } from '@renderer/composables/useIpc';
import { onMounted, ref } from 'vue';

const { debug } = useIpc();
const versions = ref({
  electron: '',
  chrome: '',
  node: '',
});

onMounted(async () => {
  versions.value = await debug.getVersions();
});
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
