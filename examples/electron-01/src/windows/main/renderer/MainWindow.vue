<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { AppHero } from './components/app-hero';
import { IpcCard } from './components/ipc-card';
import { RuntimeStackCard } from './components/runtime-stack-card';
import { SystemStateCard } from './components/system-state-card';
import { WindowBoundsCard } from './components/window-bounds-card';
import { CustomTitleBar } from './components/custom-title-bar';
import { MainWindow } from './main.window';
import type { TitleBarConfig } from '@assemblerjs/electron/renderer';

const context = useContext();
const mainWindow = context.require(MainWindow);

// Create and provide titleBarConfig for all child components
const titleBarConfig = ref<TitleBarConfig | undefined>(undefined);
provide('titleBarConfig', titleBarConfig);

const effectiveTitleBarConfig = titleBarConfig;

const hasCustomTitleBar = computed(() => effectiveTitleBarConfig.value?.enabled === true);
const windowShellStyle = computed(() => {
  if (!hasCustomTitleBar.value || !effectiveTitleBarConfig.value) {
    return { height: '100vh' };
  }
  const height = effectiveTitleBarConfig.value.height;
  return {
    marginTop: `${height}px`,
    height: `calc(100vh - ${height}px)`,
  };
});

let cleanup: (() => void) | undefined;

onMounted(async () => {
  titleBarConfig.value = await mainWindow.getTitleBarConfig();

  // Listen for title bar configuration changes (Windows/Linux only)
  cleanup = mainWindow.onTitleBarChanged((newConfig) => {
    if (newConfig) {
      titleBarConfig.value = newConfig;
    }
  });
});

onUnmounted(() => {
  cleanup?.();
});
</script>

<template>
  <div class="window-root">
    <CustomTitleBar v-if="hasCustomTitleBar" />
    <main class="window-shell" :style="windowShellStyle">
      <section class="window-shell__hero-row">
        <AppHero class="window-shell__hero-main" />
        <div class="window-shell__stats-group">
          <RuntimeStackCard class="window-shell__runtime" compact />
          <SystemStateCard class="window-shell__system" compact />
        </div>
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
  gap: 16px;
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
  flex-wrap: wrap;
  align-items: stretch;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--ev-c-text-3) 35%, transparent);
}

.window-shell__hero-main {
  flex: 2 1 0;
  min-width: 280px;
}

.window-shell__stats-group {
  flex: 1 1 320px;
  min-width: 320px;
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: stretch;
}

.window-shell__runtime {
  flex: 1;
  opacity: 0.88;
}

.window-shell__system {
  flex: 1;
  opacity: 0.88;
}

.window-shell__cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}

/* Medium: hero pleine largeur, stats en 2 colonnes */
@media (max-width: 1100px) {
  .window-shell__hero-main {
    flex: 1 1 100%;
  }

  .window-shell__stats-group {
    flex: 1 1 100%;
    flex-direction: row;
  }

  .window-shell__runtime,
  .window-shell__system {
    flex: 1;
  }
}

/* Small: tout en stack */
@media (max-width: 720px) {
  .window-shell__stats-group {
    flex-direction: column;
  }
}

/* Mobile: single column for cards grid */
@media (max-width: 620px) {
  .window-shell__cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
