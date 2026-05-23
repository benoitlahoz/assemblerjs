<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useIpc } from '@renderer/composables/useIpc';
import AppHero from './components/AppHero.vue';
import IpcCard from './components/IpcCard.vue';
import SystemFingerprintCard from './components/SystemFingerprintCard.vue';
import TelemetryCard from './components/TelemetryCard.vue';

interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const { mainWindow, debug } = useIpc();

const bounds = computed(() => mainWindow.bounds.value as RectBounds | undefined);
const lastLatencyMs = computed(() => debug.lastLatencyMs.value);
const averageLatencyMs = computed(() => debug.averageLatencyMs.value);
const latencyHistory = computed(() => debug.latencyHistory.value);
const ipcFeedback = computed(() => debug.ipcFeedback.value);
const screenWorkArea = ref<{ x: number; y: number; width: number; height: number }>({
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
});
const screenDisplayBounds = ref<{ x: number; y: number; width: number; height: number }>({
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
});
const runtime = ref({
  electron: 'unknown',
  chrome: 'unknown',
  node: 'unknown',
  platform: 'unknown',
});

const sendPing = (): void => {
  debug.sendPing();
};

const clearIpcFeedback = (): void => {
  debug.clearFeedback();
};

const syncDisplayWorkArea = async (): Promise<void> => {
  const [workArea, displayBounds] = await Promise.all([
    mainWindow.getDisplayWorkArea(),
    mainWindow.getDisplayBounds(),
  ]);

  if (!workArea?.width || !workArea?.height) {
    return;
  }

  screenWorkArea.value = {
    x: Math.round(workArea.x || 0),
    y: Math.round(workArea.y || 0),
    width: Math.max(1, Math.round(workArea.width)),
    height: Math.max(1, Math.round(workArea.height)),
  };

  if (displayBounds?.width && displayBounds?.height) {
    screenDisplayBounds.value = {
      x: Math.round(displayBounds.x || 0),
      y: Math.round(displayBounds.y || 0),
      width: Math.max(1, Math.round(displayBounds.width)),
      height: Math.max(1, Math.round(displayBounds.height)),
    };
  }
};

const randomizeBounds = async (): Promise<void> => {
  await mainWindow.randomBounds();
  await syncDisplayWorkArea();
};

const refreshBounds = async (): Promise<void> => {
  await mainWindow.refreshBounds();
  await syncDisplayWorkArea();
};

const centerWindow = async (): Promise<void> => {
  await mainWindow.centerWindow();
  await syncDisplayWorkArea();
};

const applyBoundsFromCanvas = async (nextBounds: RectBounds): Promise<RectBounds | undefined> => {
  const applied = (await mainWindow.setBounds(nextBounds)) as RectBounds | undefined;
  await syncDisplayWorkArea();
  return applied;
};

onMounted(async () => {
  const [versions, platform] = await Promise.all([
    debug.getVersions(),
    debug.getPlatform(),
    mainWindow.refreshBounds(),
  ]);

  runtime.value = {
    electron: versions?.electron ?? 'unknown',
    chrome: versions?.chrome ?? 'unknown',
    node: versions?.node ?? 'unknown',
    platform: platform ?? 'unknown',
  };

  await syncDisplayWorkArea();
});
</script>

<template>
  <main class="docs-shell">
    <section class="hero-row">
      <AppHero class="hero-row__main" />
      <SystemFingerprintCard class="hero-row__fingerprint" :runtime="runtime" compact />
    </section>

    <section class="cards-grid">
      <TelemetryCard
        :bounds="bounds"
        :screen-work-area="screenWorkArea"
        :screen-display-bounds="screenDisplayBounds"
        :apply-bounds="applyBoundsFromCanvas"
        @refresh="refreshBounds"
        @randomize="randomizeBounds"
        @center="centerWindow"
      />

      <IpcCard
        :last-latency-ms="lastLatencyMs"
        :average-latency-ms="averageLatencyMs"
        :latency-history="latencyHistory"
        :ipc-feedback="ipcFeedback"
        @send-ping="sendPing"
        @clear="clearIpcFeedback"
      />
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
