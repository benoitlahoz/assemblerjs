<script setup lang="ts">
import AppHero from './components/AppHero.vue';
import IpcCard from './components/IpcCard.vue';
import SystemFingerprintCard from './components/SystemFingerprintCard.vue';
import SystemStateCard from './components/SystemStateCard.vue';
import TelemetryCard from './components/TelemetryCard.vue';
</script>

<template>
  <main class="docs-shell">
    <section class="hero-row">
      <AppHero class="hero-row__main" />
      <SystemFingerprintCard class="hero-row__fingerprint" compact />
    </section>

    <section class="system-row">
      <SystemStateCard />
    </section>

    <section class="cards-grid">
      <TelemetryCard />
      <IpcCard />
    </section>
  </main>
</template>

<style scoped>
.docs-shell {
  width: calc(100vw - 32px);
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding-right: 2px;
  box-sizing: border-box;
}

.hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-row__main {
  flex: 1 1 auto;
  min-width: 0;
}

.hero-row__fingerprint {
  flex: 0 0 auto;
  opacity: 0.88;
}

.system-row {
  display: block;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}

@media (max-width: 980px) {
  .hero-row {
    flex-direction: column;
  }

  .hero-row__fingerprint {
    align-self: flex-end;
  }

  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .hero-row__fingerprint {
    width: 100%;
    align-self: stretch;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
