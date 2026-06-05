<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { SystemStateHealth, SystemStateSnapshot } from '@assemblerjs/electron/renderer';
import { useContext } from '@renderer/composables/useContext';
import { SystemStateModule } from '@features/system/renderer/system-state.module';

defineProps<{
  compact?: boolean;
}>();

const context = useContext();
const { system } = context.require(SystemStateModule);

const INTERVAL_OPTIONS = [250, 500, 1000, 1500, 3000] as const;

const snapshot = ref<SystemStateSnapshot | undefined>(undefined);
const health = ref<SystemStateHealth>('stopped');
const intervalMs = ref(1000);
const isRunning = computed(() => health.value === 'running');

let unsubscribeSnapshot: (() => void) | undefined;
let unsubscribeHealth: (() => void) | undefined;

const usedMemoryMb = computed(() => {
  if (!snapshot.value) {
    return undefined;
  }

  return Math.round(snapshot.value.process.heapUsedBytes / (1024 * 1024));
});

const availableMemoryGb = computed(() => {
  if (!snapshot.value) {
    return undefined;
  }

  const osState = snapshot.value.os as {
    freeMemBytes: number;
    availableMemBytes?: number;
  };
  const availableMemBytes = osState.availableMemBytes ?? osState.freeMemBytes;
  return Math.round((availableMemBytes / (1024 * 1024 * 1024)) * 10) / 10;
});

const totalMemoryGb = computed(() => {
  if (!snapshot.value) {
    return undefined;
  }

  return Math.round((snapshot.value.os.totalMemBytes / (1024 * 1024 * 1024)) * 10) / 10;
});

const cpuPercentLabel = computed(() => {
  if (!snapshot.value) {
    return undefined;
  }

  const cpuPercent = snapshot.value.process.cpuPercent;
  if (cpuPercent === undefined) {
    return undefined;
  }

  return `${cpuPercent.toFixed(1)}%`;
});

const formattedUptime = computed(() => {
  if (!snapshot.value) {
    return '—';
  }

  const totalSeconds = snapshot.value.process.uptimeSec;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  // Format 00:00:00.000
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
});

const displaysLabel = computed(() => {
  if (!snapshot.value) {
    return 'DISPLAY';
  }
  const count = snapshot.value.displays.length;
  return count === 1 ? 'DISPLAY' : 'DISPLAYS';
});

async function startMonitoring(): Promise<void> {
  await system.startMonitoring({
    intervalMs: intervalMs.value,
    includeDisplays: true,
    includeCpuPercent: true,
  });
}

async function stopMonitoring(): Promise<void> {
  await system.stopMonitoring();
}

async function refreshSnapshot(): Promise<void> {
  const result = await system.getSnapshot();
  if (result) {
    snapshot.value = result;
  }
}

async function setSystemInterval(ms: number): Promise<void> {
  intervalMs.value = ms;
  await system.setInterval(ms);
}

onMounted(async () => {
  unsubscribeSnapshot = system.onSnapshot((data) => {
    snapshot.value = data;
  });

  unsubscribeHealth = system.onHealth((h) => {
    health.value = h;
  });

  await refreshSnapshot();
  await startMonitoring();
});

onBeforeUnmount(async () => {
  unsubscribeSnapshot?.();
  unsubscribeHealth?.();
  await system.stopMonitoring();
});
</script>

<template>
  <article class="card card--system-state" :class="{ 'card--compact': compact }" aria-live="polite">
    <header class="card__header">
      <h2>{{ compact ? 'System' : 'System State Stream' }}</h2>
      <div v-if="compact" class="compact-controls">
        <select
          class="compact-interval-select"
          :value="intervalMs"
          @change="setSystemInterval(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="option in INTERVAL_OPTIONS" :key="option" :value="option">
            {{ option }}ms
          </option>
        </select>
        <button
          v-if="isRunning"
          type="button"
          class="compact-stop-button"
          :title="'Stop monitoring'"
          @click="stopMonitoring"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          </svg>
        </button>
        <button
          v-else
          type="button"
          class="compact-start-button"
          :title="'Start monitoring'"
          @click="startMonitoring"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        </button>
      </div>
      <span v-if="!compact" class="system-duplex">Seamless</span>
    </header>

    <p v-if="!compact" class="card__description">
      Native package stream for runtime, process, OS, and displays with typed snapshot updates.
    </p>

    <dl class="system-metrics-grid">
      <div class="metric">
        <dt>{{ compact ? 'CPU' : 'App Uptime' }}</dt>
        <dd>{{ compact ? (cpuPercentLabel ?? '—') : formattedUptime }}</dd>
      </div>
      <div class="metric">
        <dt>{{ compact ? 'RAM' : 'Heap Used' }}</dt>
        <dd>
          {{
            compact
              ? availableMemoryGb !== undefined && totalMemoryGb !== undefined
                ? `${availableMemoryGb}/${totalMemoryGb}GB`
                : '—'
              : usedMemoryMb !== undefined
                ? `${usedMemoryMb} MB`
                : '—'
          }}
        </dd>
      </div>
      <div class="metric">
        <dt>{{ compact ? 'Heap' : 'Available RAM (OS)' }}</dt>
        <dd>
          {{
            compact
              ? usedMemoryMb !== undefined
                ? `${usedMemoryMb}MB`
                : '—'
              : availableMemoryGb !== undefined && totalMemoryGb !== undefined
                ? `${availableMemoryGb} / ${totalMemoryGb} GB`
                : '—'
          }}
        </dd>
      </div>
      <div class="metric">
        <dt>{{ compact ? displaysLabel : 'CPU Usage' }}</dt>
        <dd>
          {{ compact ? (snapshot ? snapshot.displays.length : '—') : (cpuPercentLabel ?? '—') }}
        </dd>
      </div>
      <div v-if="!compact" class="metric">
        <dt>Displays</dt>
        <dd>{{ snapshot ? snapshot.displays.length : '—' }}</dd>
      </div>
    </dl>

    <div v-if="!compact" class="system-controls">
      <label for="system-state-interval">Interval</label>
      <select
        id="system-state-interval"
        :value="intervalMs"
        @change="setSystemInterval(Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="option in INTERVAL_OPTIONS" :key="option" :value="option">
          {{ option }} ms
        </option>
      </select>

      <button type="button" class="system-action" @click="refreshSnapshot">Refresh</button>
      <button
        v-if="!isRunning"
        type="button"
        class="system-action system-action--accent"
        @click="startMonitoring"
      >
        Start Stream
      </button>
      <button
        v-else
        type="button"
        class="system-action system-action--danger"
        @click="stopMonitoring"
      >
        Stop Stream
      </button>
    </div>
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
  display: flex;
  flex-direction: column;
}

.card--compact {
  padding: 10px 12px;
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

.system-duplex {
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

.card__description {
  margin: 10px 0 12px;
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.45;
}

.system-metrics-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  flex: 1;
}

.card--compact .system-metrics-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  grid-auto-rows: minmax(0, 1fr);
  align-content: stretch;
}

.metric {
  border-radius: 10px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
  padding: 8px 10px;
  min-height: 56px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card--compact .metric {
  padding: 6px 8px;
  min-height: auto;
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
  font-size: 13px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

.system-controls {
  margin-top: 10px;
  display: grid;
  grid-template-columns: auto 120px repeat(2, minmax(0, 150px));
  align-items: center;
  gap: 8px;
}

.system-controls label {
  font-size: 12px;
  color: var(--ev-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.system-controls select {
  height: 34px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-1);
  padding: 0 8px;
}

.system-action {
  cursor: pointer;
  appearance: none;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-1);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 0 12px;
  height: 40px;
  min-height: 40px;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.system-action:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ev-c-text-2) 40%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 66%, transparent);
}

.system-action:active {
  transform: translateY(0);
}

.system-action:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
}

.system-action--accent {
  border-color: color-mix(in srgb, #42d392 45%, transparent);
  color: #42d392;
}

.system-action--danger {
  border-color: color-mix(in srgb, #ff6b6b 45%, transparent);
  color: #ff6b6b;
}

.compact-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.compact-interval-select {
  height: 24px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-1);
  padding: 0 6px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  cursor: pointer;
}

.compact-interval-select:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--ev-c-text-2) 40%, transparent);
}

.compact-stop-button,
.compact-start-button {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.compact-stop-button {
  color: rgba(255, 107, 107, 0.8);
  border-color: color-mix(in srgb, #ff6b6b 25%, transparent);
}

.compact-stop-button:hover {
  background: color-mix(in srgb, #ff6b6b 15%, transparent);
  border-color: color-mix(in srgb, #ff6b6b 45%, transparent);
  color: #ff6b6b;
}

.compact-start-button {
  color: rgba(66, 211, 146, 0.8);
  border-color: color-mix(in srgb, #42d392 25%, transparent);
}

.compact-start-button:hover {
  background: color-mix(in srgb, #42d392 15%, transparent);
  border-color: color-mix(in srgb, #42d392 45%, transparent);
  color: #42d392;
}

.compact-stop-button:active,
.compact-start-button:active {
  transform: scale(0.95);
}

@media (max-width: 980px) {
  .system-metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .system-controls {
    grid-template-columns: auto 120px repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .system-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .system-controls {
    grid-template-columns: 1fr;
  }
}
</style>
