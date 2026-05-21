<script setup lang="ts">
const props = defineProps<{
  lastLatencyMs?: number;
  averageLatencyMs?: number;
  ipcFeedback: string;
}>();

const emit = defineEmits<{
  sendPing: [];
  clear: [];
}>();
</script>

<template>
  <article class="card" aria-live="polite">
    <header class="card__header">
      <h2>IPC</h2>
    </header>
    <p class="card__description">
      Lightweight health check for renderer &lt;-&gt; main process communication.
    </p>

    <dl class="ipc-health-grid">
      <div class="metric">
        <dt>Last RTT</dt>
        <dd>{{ props.lastLatencyMs !== undefined ? `${props.lastLatencyMs} ms` : '—' }}</dd>
      </div>
      <div class="metric">
        <dt>Average</dt>
        <dd>{{ props.averageLatencyMs !== undefined ? `${props.averageLatencyMs} ms` : '—' }}</dd>
      </div>
    </dl>

    <div class="ipc-actions-grid">
      <button type="button" class="ipc-action-card" @click="emit('sendPing')">Send Ping</button>
      <button type="button" class="ipc-action-card" @click="emit('clear')">Clear</button>
    </div>

    <p class="ipc-feedback" aria-live="polite">{{ props.ipcFeedback }}</p>
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

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card__header h2 {
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ev-c-text-1);
}

.card__description {
  margin: 10px 0 12px;
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.45;
}

.ipc-health-grid {
  margin: 0 0 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ipc-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  align-content: stretch;
  gap: 10px;
  flex: 1;
}

.ipc-action-card {
  cursor: pointer;
  appearance: none;
  border-radius: 10px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
  color: var(--ev-c-text-1);
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  padding: 12px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.ipc-action-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ev-c-text-2) 40%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 66%, transparent);
}

.ipc-action-card:active {
  transform: translateY(0);
}

.ipc-action-card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
}

.ipc-feedback {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.35;
  min-height: 38px;
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

.metric dt {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ev-c-text-2);
}

.metric dd {
  margin: 6px 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

@media (max-width: 620px) {
  .ipc-actions-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
