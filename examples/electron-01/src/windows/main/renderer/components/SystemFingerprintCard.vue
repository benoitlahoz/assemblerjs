<script setup lang="ts">
const props = defineProps<{
  runtime: {
    electron: string;
    chrome: string;
    node: string;
    platform: string;
  };
  compact?: boolean;
}>();
</script>

<template>
  <article class="card" :class="{ 'card--compact': props.compact }">
    <header class="card__header">
      <h2>Runtime Stack</h2>
    </header>
    <p v-if="!props.compact" class="card__description">
      Electron, Chromium, Node, and platform values reported by the running app.
    </p>
    <dl class="metrics-grid">
      <div class="metric">
        <dt>Electron</dt>
        <dd>{{ props.runtime.electron }}</dd>
      </div>
      <div class="metric">
        <dt>Chromium</dt>
        <dd>{{ props.runtime.chrome }}</dd>
      </div>
      <div class="metric">
        <dt>Node</dt>
        <dd>{{ props.runtime.node }}</dd>
      </div>
      <div class="metric">
        <dt>Platform</dt>
        <dd>{{ props.runtime.platform }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.card {
  text-align: left;
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 16px;
  padding: 14px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 50%, transparent);
  backdrop-filter: blur(8px);
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card--compact {
  padding: 10px;
  width: 260px;
  min-height: auto;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
}

.card__header h2 {
  margin: 0;
  font-size: 14px;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ev-c-text-1);
}

.card--compact .card__header h2 {
  font-size: 11px;
  line-height: 1.2;
  letter-spacing: 0.06em;
  color: var(--ev-c-text-2);
}

.card__description {
  margin: 10px 0 12px;
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.45;
}

.metrics-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  align-content: stretch;
  gap: 8px;
  flex: 1;
}

.card--compact .metrics-grid {
  gap: 6px;
}

.metric {
  border-radius: 10px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
  padding: 8px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card--compact .metric {
  padding: 6px 8px;
}

.metric dt {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ev-c-text-2);
}

.card--compact .metric dt {
  font-size: 10px;
}

.metric dd {
  margin: 6px 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

.card--compact .metric dd {
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 620px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
