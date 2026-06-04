<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { IpcModule } from '@features/ipc/renderer/ipc.module';

defineProps<{
  compact?: boolean;
}>();

const context = useContext();
const { debug } = context.require(IpcModule);

const runtime = ref({
  electron: 'unknown',
  chrome: 'unknown',
  node: 'unknown',
  platform: 'unknown',
});

onMounted(async () => {
  const [versions, platform] = await Promise.all([debug.getVersions(), debug.getPlatform()]);

  if (versions) {
    runtime.value.electron = versions.electron ?? 'unknown';
    runtime.value.chrome = versions.chrome ?? 'unknown';
    runtime.value.node = versions.node ?? 'unknown';
  }

  if (platform) {
    runtime.value.platform = platform;
  }
});
</script>

<template>
  <article class="runtime-card" :class="{ 'runtime-card--compact': compact }">
    <header class="runtime-card__header">
      <h2>Runtime Stack</h2>
    </header>
    <p v-if="!compact" class="runtime-card__description">
      Electron, Chromium, Node, and platform values reported by the running app.
    </p>
    <dl class="runtime-card__metrics-grid">
      <div class="runtime-card__metric">
        <dt>Electron</dt>
        <dd>{{ runtime.electron }}</dd>
      </div>
      <div class="runtime-card__metric">
        <dt>Chromium</dt>
        <dd>{{ runtime.chrome }}</dd>
      </div>
      <div class="runtime-card__metric">
        <dt>Node</dt>
        <dd>{{ runtime.node }}</dd>
      </div>
      <div class="runtime-card__metric">
        <dt>Platform</dt>
        <dd>{{ runtime.platform }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.runtime-card {
  text-align: left;
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 16px;
  padding: 14px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 50%, transparent);
  backdrop-filter: blur(8px);
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.runtime-card--compact {
  padding: 10px 12px;
  width: 260px;
  min-height: auto;
}

.runtime-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
}

.runtime-card__header h2 {
  margin: 0;
  font-size: 14px;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ev-c-text-1);
}

.runtime-card--compact .runtime-card__header h2 {
  font-size: 11px;
  line-height: 1.2;
  letter-spacing: 0.06em;
  color: var(--ev-c-text-2);
}

.runtime-card__description {
  margin: 10px 0 12px;
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.45;
}

.runtime-card__metrics-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  align-content: stretch;
  gap: 8px;
  flex: 1;
}

.runtime-card--compact .runtime-card__metrics-grid {
  gap: 6px;
}

.runtime-card__metric {
  border-radius: 10px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
  padding: 8px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.runtime-card--compact .runtime-card__metric {
  padding: 6px 8px;
}

.runtime-card__metric dt {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ev-c-text-2);
}

.runtime-card--compact .runtime-card__metric dt {
  font-size: 10px;
}

.runtime-card__metric dd {
  margin: 6px 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

.runtime-card--compact .runtime-card__metric dd {
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 620px) {
  .runtime-card__metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
