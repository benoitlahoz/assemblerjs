<script setup lang="ts">
import Versions from './components/Versions.vue';
import { useIpc } from './composables/useIpc';

const { debug } = useIpc();
</script>

<template>
  <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">assemblerjs</span>
    and
    <span class="ts">electron-vite</span>
  </div>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a href="#" @click.prevent="debug.sendPing">Send Ping</a>
    </div>
  </div>
  <Versions />
</template>
