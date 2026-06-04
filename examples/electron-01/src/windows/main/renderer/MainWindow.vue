<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { AppHero } from './components/app-hero';
import { IpcCard } from './components/ipc-card';
import { RuntimeStackCard } from './components/runtime-stack-card';
import { SystemStateCard } from './components/system-state-card';
import { WindowBoundsCard } from './components/window-bounds-card';
import { CustomTitleBar } from './components/custom-title-bar';
import { MainWindow } from './main.window';
import type { TitleBarConfig } from '@assemblerjs/electron/universal';

const context = useContext();
const mainWindow = context.require(MainWindow);

const titleBarConfig = ref<TitleBarConfig | undefined>(undefined);

const hasCustomTitleBar = computed(() => titleBarConfig.value?.enabled === true);
const windowShellStyle = computed(() => {
  if (!hasCustomTitleBar.value || !titleBarConfig.value) {
    return { height: '100vh' };
  }
  const height = titleBarConfig.value.height;
  return {
    marginTop: `${height}px`,
    height: `calc(100vh - ${height}px)`,
  };
});

onMounted(async () => {
  titleBarConfig.value = await mainWindow.getTitleBarConfig();
});
</script>

<template>
  <div class="window-root">
    <CustomTitleBar v-if="hasCustomTitleBar" />
    <main class="window-shell" :style="windowShellStyle">
      <section class="window-shell__hero-row">
        <AppHero class="window-shell__hero-main" />
        <RuntimeStackCard class="window-shell__runtime" compact />
      </section>

      <section class="window-shell__system-row">
        <SystemStateCard />
      </section>

      <section class="window-shell__cards-grid">
        <WindowBoundsCard />
        <IpcCard />
      </section>
    </main>
  </div>
</template>

<style scoped>
.window-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.window-shell {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  box-sizing: border-box;
  transition:
    margin-top 0.2s ease,
    height 0.2s ease;
}

.window-shell__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.window-shell__hero-main {
  flex: 1 1 auto;
  min-width: 0;
}

.window-shell__runtime {
  flex: 0 0 auto;
  opacity: 0.88;
}

.window-shell__system-row {
  display: block;
}

.window-shell__cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}

@media (max-width: 980px) {
  .window-shell__hero-row {
    flex-direction: column;
  }

  .window-shell__runtime {
    align-self: flex-end;
  }

  .window-shell__cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .window-shell__runtime {
    width: 100%;
    align-self: stretch;
  }

  .window-shell__cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
