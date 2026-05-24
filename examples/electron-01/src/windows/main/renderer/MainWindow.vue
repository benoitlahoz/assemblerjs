<script setup lang="ts">
import AppHero from './components/AppHero.vue';
import IpcCard from './components/IpcCard.vue';
import RuntimeStackCard from './components/RuntimeStackCard.vue';
import SystemStateCard from './components/SystemStateCard.vue';
import WindowBoundsCard from './components/WindowBoundsCard.vue';
</script>

<template>
  <main class="window-shell">
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
</template>

<style scoped>
.window-shell {
  width: 100vw;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100vh;
  max-height: 100vh;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
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
