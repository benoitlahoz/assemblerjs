<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  lastLatencyMs?: number;
  averageLatencyMs?: number;
  latencyHistory: number[];
}>();

const emit = defineEmits<{
  sendPing: [];
  clear: [];
}>();

const INTERVAL_OPTIONS = [150, 250, 500, 1000, 1500] as const;

const chartRef = ref<HTMLCanvasElement | null>(null);
const heartbeatIntervalMs = ref<number>(500);
const isHeartbeatRunning = ref(false);
const totalPings = ref(0);

let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
let chartResizeObserver: ResizeObserver | undefined;

const p95LatencyMs = computed<number | undefined>(() => {
  if (props.latencyHistory.length === 0) {
    return undefined;
  }

  const sorted = [...props.latencyHistory].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
});

const maxLatencyMs = computed<number | undefined>(() => {
  if (props.latencyHistory.length === 0) {
    return undefined;
  }

  return Math.max(...props.latencyHistory);
});

function drawLatencyChart(): void {
  const canvas = chartRef.value;
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width <= 0 || height <= 0) {
    return;
  }

  canvas.width = width;
  canvas.height = height;

  const data = [...props.latencyHistory].reverse();
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(66, 211, 146, 0.25)');
  gradient.addColorStop(1, 'rgba(66, 211, 146, 0.02)');
  context.fillStyle = gradient;
  context.strokeStyle = 'rgba(66, 211, 146, 0.9)';
  context.lineWidth = 1.6;

  const padding = 12;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  context.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = padding + Math.round((chartHeight / 3) * i);
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  if (data.length === 0) {
    context.fillStyle = 'rgba(255, 255, 255, 0.6)';
    context.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    context.fillText('No latency samples yet', padding, Math.floor(height / 2));
    return;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);

  const points = data.map((value, index) => {
    const x =
      padding + (data.length === 1 ? 0 : (chartWidth * index) / Math.max(1, data.length - 1));
    const normalized = (value - min) / range;
    const y = padding + chartHeight - normalized * chartHeight;
    return { x, y };
  });

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  if (points.length === 1) {
    context.lineTo(points[0].x + 0.001, points[0].y);
  } else {
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const controlX = (current.x + next.x) / 2;

      context.quadraticCurveTo(current.x, current.y, controlX, (current.y + next.y) / 2);
    }

    const beforeLast = points[points.length - 2];
    const last = points[points.length - 1];
    context.quadraticCurveTo(beforeLast.x, beforeLast.y, last.x, last.y);
  }

  context.strokeStyle = 'rgba(66, 211, 146, 0.95)';
  context.lineWidth = 1.6;
  context.stroke();

  context.save();
  context.lineTo(width - padding, height - padding);
  context.lineTo(padding, height - padding);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
  context.restore();
}

function triggerPing(): void {
  totalPings.value += 1;
  emit('sendPing');
}

function startHeartbeat(): void {
  if (isHeartbeatRunning.value) {
    return;
  }

  isHeartbeatRunning.value = true;
  triggerPing();
  heartbeatTimer = setInterval(() => {
    triggerPing();
  }, heartbeatIntervalMs.value);
}

function stopHeartbeat(): void {
  isHeartbeatRunning.value = false;
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
}

function resetMetrics(): void {
  stopHeartbeat();
  totalPings.value = 0;
  emit('clear');
}

watch(heartbeatIntervalMs, () => {
  if (!isHeartbeatRunning.value) {
    return;
  }

  stopHeartbeat();
  startHeartbeat();
});

watch(
  () => props.latencyHistory,
  () => {
    drawLatencyChart();
  },
  { deep: true },
);

onMounted(() => {
  drawLatencyChart();

  if (!chartRef.value || typeof ResizeObserver === 'undefined') {
    return;
  }

  chartResizeObserver = new ResizeObserver(() => {
    drawLatencyChart();
  });
  chartResizeObserver.observe(chartRef.value);
});

onBeforeUnmount(() => {
  stopHeartbeat();
  chartResizeObserver?.disconnect();
  chartResizeObserver = undefined;
});
</script>

<template>
  <article class="card" aria-live="polite">
    <header class="card__header">
      <div class="card__title-row">
        <h2>IPC</h2>
        <span class="ipc-duplex">Full-duplex</span>
      </div>
      <span class="ipc-status" :class="{ 'ipc-status--running': isHeartbeatRunning }">
        {{ isHeartbeatRunning ? 'Running' : 'Stopped' }}
      </span>
    </header>
    <p class="card__description">
      Bidirectional renderer &lt;-&gt; main health panel with heartbeat and latency time-series.
    </p>

    <div class="ipc-controls">
      <label for="ipc-heartbeat-interval">Heartbeat</label>
      <select id="ipc-heartbeat-interval" v-model.number="heartbeatIntervalMs">
        <option v-for="option in INTERVAL_OPTIONS" :key="option" :value="option">
          {{ option }} ms
        </option>
      </select>
      <span class="ipc-controls__count">Sent: {{ totalPings }}</span>
    </div>

    <canvas ref="chartRef" class="ipc-chart" aria-label="Latency chart" />

    <div class="ipc-actions-grid">
      <button type="button" class="ipc-action-card" @click="triggerPing">Ping Once</button>
      <button
        v-if="!isHeartbeatRunning"
        type="button"
        class="ipc-action-card ipc-action-card--accent"
        @click="startHeartbeat"
      >
        Start Heartbeat
      </button>
      <button v-else type="button" class="ipc-action-card" @click="stopHeartbeat">
        Stop Heartbeat
      </button>
      <button type="button" class="ipc-action-card" @click="resetMetrics">Reset</button>
    </div>

    <dl class="ipc-health-grid">
      <div class="metric">
        <dt>Last RTT</dt>
        <dd>{{ props.lastLatencyMs !== undefined ? `${props.lastLatencyMs} ms` : '—' }}</dd>
      </div>
      <div class="metric">
        <dt>Average</dt>
        <dd>{{ props.averageLatencyMs !== undefined ? `${props.averageLatencyMs} ms` : '—' }}</dd>
      </div>
      <div class="metric">
        <dt>P95</dt>
        <dd>{{ p95LatencyMs !== undefined ? `${p95LatencyMs} ms` : '—' }}</dd>
      </div>
      <div class="metric">
        <dt>Max</dt>
        <dd>{{ maxLatencyMs !== undefined ? `${maxLatencyMs} ms` : '—' }}</dd>
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

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
}

.card__title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ipc-duplex {
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, #58a6ff 45%, transparent);
  background: color-mix(in srgb, #58a6ff 15%, transparent);
  color: #9bc8ff;
  padding: 2px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.ipc-status {
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 76%, transparent);
  color: var(--ev-c-text-2);
  padding: 4px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ipc-status--running {
  color: #42d392;
  border-color: color-mix(in srgb, #42d392 45%, transparent);
}

.card__header h2 {
  margin: 0;
  font-size: 14px;
  line-height: 1.2;
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
  margin: 8px 0 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.ipc-controls {
  margin: 0;
  display: grid;
  grid-template-columns: auto 120px 1fr;
  align-items: center;
  gap: 10px;
}

.ipc-controls label {
  font-size: 12px;
  color: var(--ev-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ipc-controls select {
  height: 34px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-1);
  padding: 0 8px;
}

.ipc-controls__count {
  justify-self: end;
  font-size: 12px;
  color: var(--ev-c-text-2);
}

.ipc-chart {
  margin-top: 10px;
  width: 100%;
  height: auto;
  min-height: 170px;
  flex: 1 1 auto;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 74%, transparent);
  display: block;
}

.ipc-actions-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
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
  text-align: center;
  padding: 0 12px;
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.ipc-action-card--accent {
  border-color: color-mix(in srgb, #42d392 45%, transparent);
  color: #42d392;
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
  .ipc-health-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ipc-controls {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .ipc-controls__count {
    justify-self: start;
  }

  .ipc-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
