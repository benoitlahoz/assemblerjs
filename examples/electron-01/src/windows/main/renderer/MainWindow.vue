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
const ipcFeedback = computed(() => debug.ipcFeedback.value);
const telemetryValidation = ref('Drag to move, drag bottom-right handle to resize.');
const screenWorkArea = ref<{ x: number; y: number; width: number; height: number }>({
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

const syncStatus = computed(() => {
  return bounds.value ? 'Live' : 'Awaiting first event';
});

const sendPing = (): void => {
  debug.sendPing();
};

const clearIpcFeedback = (): void => {
  debug.clearFeedback();
};

const syncDisplayWorkArea = async (): Promise<void> => {
  const workArea = await mainWindow.getDisplayWorkArea();
  if (!workArea?.width || !workArea?.height) {
    return;
  }

  screenWorkArea.value = {
    x: Math.round(workArea.x || 0),
    y: Math.round(workArea.y || 0),
    width: Math.max(1, Math.round(workArea.width)),
    height: Math.max(1, Math.round(workArea.height)),
  };
};

const randomizeBounds = async (): Promise<void> => {
  try {
    const nextBounds = await mainWindow.randomBounds();
    if (!nextBounds) {
      telemetryValidation.value = 'Random bounds failed.';
      return;
    }

    telemetryValidation.value = `Randomized: x=${nextBounds.x}, y=${nextBounds.y}, w=${nextBounds.width}, h=${nextBounds.height}`;
    await syncDisplayWorkArea();
  } catch (error) {
    telemetryValidation.value = `Random bounds error: ${(error as Error).message}`;
  }
};

const refreshBounds = async (): Promise<void> => {
  try {
    await mainWindow.refreshBounds();
    telemetryValidation.value = 'Bounds refreshed.';
    await syncDisplayWorkArea();
  } catch (error) {
    console.error('Refresh bounds error', error);
  }
};

const centerWindow = async (): Promise<void> => {
  try {
    const centered = await mainWindow.centerWindow();
    if (!centered) {
      telemetryValidation.value = 'Center window failed.';
      return;
    }

    telemetryValidation.value = `Centered: x=${centered.x}, y=${centered.y}`;
    await syncDisplayWorkArea();
  } catch (error) {
    telemetryValidation.value = `Center window error: ${(error as Error).message}`;
  }
};

const applyBoundsFromCanvas = async (nextBounds: RectBounds): Promise<RectBounds | undefined> => {
  try {
    const applied = (await mainWindow.setBounds(nextBounds)) as RectBounds | undefined;
    await syncDisplayWorkArea();
    return applied;
  } catch (error) {
    telemetryValidation.value = `Apply failed: ${(error as Error).message}`;
    return undefined;
  }
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
        :sync-status="syncStatus"
        :telemetry-validation="telemetryValidation"
        :apply-bounds="applyBoundsFromCanvas"
        @refresh="refreshBounds"
        @randomize="randomizeBounds"
        @center="centerWindow"
        @validation="(message) => (telemetryValidation.value = message)"
      />

      <IpcCard
        :last-latency-ms="lastLatencyMs"
        :average-latency-ms="averageLatencyMs"
        :ipc-feedback="ipcFeedback"
        @send-ping="sendPing"
        @clear="clearIpcFeedback"
      />
    </section>
  </main>
</template>

<style scoped>
.docs-shell {
  width: min(1080px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding-right: 2px;
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
