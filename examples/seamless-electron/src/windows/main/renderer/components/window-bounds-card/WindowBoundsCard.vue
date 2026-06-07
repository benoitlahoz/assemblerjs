<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { MenuItemState, DisplayState } from '@assemblerjs/electron/renderer';
import { useContext } from '@renderer/composables/useContext';
import { SystemStateModule } from '@features/system/renderer/system-state.module';
import { MainWindow } from '../../main.window';
import { MainMenuService } from '../../main.menu';
import { useWindowBoundsCard } from './useWindowBoundsCard';
import { TrafficLightsControls } from '../custom-title-bar';

const context = useContext();
const mainWindow = context.require(MainWindow);
const menuService = context.require(MainMenuService);
const { system } = context.require(SystemStateModule);
const bounds = mainWindow.bounds;

const menuItems = ref<Record<string, MenuItemState>>({});
const platform = ref<string>('');
const availableDisplays = ref<DisplayState[]>([]);
const selectedDisplayId = ref<number | undefined>(undefined);

onMounted(async () => {
  // Subscribe to updates
  const unsubscribe = menuService.onItemStateChanged((state) => {
    menuItems.value = { ...menuItems.value, [state.id]: state };
  });

  onUnmounted(() => unsubscribe());

  // Wait for menu snapshot to be available
  const snapshot = await menuService.waitForSnapshot();
  if (snapshot) {
    menuItems.value = { ...snapshot.items };
  }

  // Get platform from system state
  const systemSnapshot = await system.getSnapshot();
  if (systemSnapshot) {
    platform.value = systemSnapshot.runtime.platform;
  }

  // Load available displays
  const displays = await mainWindow.getAllDisplays();
  availableDisplays.value = displays;

  // Set initial selected display to current display (where window is located)
  const current = await mainWindow.getCurrentDisplay();
  if (current) {
    selectedDisplayId.value = current.id;
  }
});

const selectedDisplay = computed(() => {
  if (selectedDisplayId.value === undefined) {
    return undefined;
  }
  return availableDisplays.value.find((d) => d.id === selectedDisplayId.value);
});

const {
  canvasRef,
  windowBoundsCanvasStyle,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasPointerCancel,
  onCanvasLeave,
  onCanvasHover,
  randomizeBounds,
  refreshBounds,
  centerWindow,
} = useWindowBoundsCard(mainWindow, bounds, menuService, selectedDisplay);

function acceleratorToKeys(accelerator: string): string[] {
  // Use platform from system state runtime stack
  const isMac = platform.value === 'darwin';

  return accelerator.split('+').map((key) => {
    const normalized = key.toLowerCase();
    if (normalized === 'cmdorctrl') {
      return isMac ? 'cmd' : 'ctrl';
    }
    return normalized;
  });
}

function formatKey(key: string): string {
  const replacements: Record<string, string> = {
    cmd: '⌘',
    command: '⌘',
    ctrl: '⌃',
    control: '⌃',
    alt: '⌥',
    option: '⌥',
    shift: '⇧',
    enter: '↵',
    return: '↵',
    delete: '⌫',
    backspace: '⌫',
    esc: '⎋',
    escape: '⎋',
    tab: '⇥',
    space: '␣',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
  };

  return replacements[key.toLowerCase()] || key.toUpperCase();
}

interface ActionButton {
  id: string;
  label: string;
  accelerator?: string;
  keys?: string[];
  action: () => void;
}

const actionButtons = computed<ActionButton[]>(() => {
  const buttons: Array<{ id: string; action: () => void }> = [
    { id: 'window.bounds.refreshBounds', action: refreshBounds },
    { id: 'window.bounds.randomBounds', action: randomizeBounds },
    { id: 'window.bounds.centerWindow', action: centerWindow },
  ];

  return buttons.map((btn) => {
    const itemState = menuItems.value[btn.id];
    return {
      ...btn,
      label: itemState?.label || btn.id,
      accelerator: itemState?.accelerator,
      keys: itemState?.accelerator ? acceleratorToKeys(itemState.accelerator) : undefined,
    };
  });
});

const autoCenterItem = computed(() => menuItems.value['window.bounds.autoCenter']);
const isAutoCenterEnabled = computed(() => menuService.autoCenterAfterRandom.value);
const isCopied = ref(false);

async function toggleAutoCenter() {
  await menuService.toggleAutoCenter();
}

async function copyBounds() {
  const currentBounds = bounds.value;
  if (currentBounds) {
    const boundsText = JSON.stringify(currentBounds, null, 2);
    await navigator.clipboard.writeText(boundsText);

    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 1500);
  }
}
</script>

<template>
  <article class="card card--window-bounds" aria-live="polite">
    <header class="card__header">
      <h2>Window Configuration</h2>
      <span class="window-bounds-duplex">full-duplex</span>
    </header>

    <p class="card__description">
      Interactive geometry canvas with live bounds streaming, platform-specific title bar controls,
      and decorator-based synchronization.
    </p>

    <div v-if="autoCenterItem" class="window-bounds-toggle">
      <label class="toggle-label">
        <span class="toggle-text">{{ autoCenterItem.label }}</span>
        <button
          type="button"
          role="switch"
          :aria-checked="isAutoCenterEnabled"
          class="toggle-switch"
          :class="{ 'toggle-switch--on': isAutoCenterEnabled }"
          @click="toggleAutoCenter"
        >
          <span class="toggle-slider"></span>
        </button>
      </label>
    </div>

    <div class="window-bounds-actions">
      <button
        v-for="btn in actionButtons"
        :key="btn.id"
        type="button"
        class="window-bounds-action"
        @click="btn.action"
      >
        <span class="action-label">{{ btn.label }}</span>
        <span v-if="btn.keys" class="action-shortcut">
          <kbd v-for="(key, idx) in btn.keys" :key="idx" class="action-key">{{
            formatKey(key)
          }}</kbd>
        </span>
      </button>
    </div>

    <!-- Title Bar Controls -->
    <TrafficLightsControls :platform="platform" />

    <div class="canvas-wrapper">
      <div class="canvas-container">
        <div class="canvas-toolbar">
          <select
            v-if="availableDisplays.length > 1"
            v-model="selectedDisplayId"
            class="display-select"
            title="Select display"
          >
            <option v-for="display in availableDisplays" :key="display.id" :value="display.id">
              {{ display.label || `Display ${display.id}` }}
              {{ display.isPrimary ? ' (Primary)' : '' }}
              — {{ display.bounds.width }}×{{ display.bounds.height }}
            </option>
          </select>
          <button
            type="button"
            class="copy-bounds-btn"
            :class="{ 'copy-bounds-btn--copied': isCopied }"
            :title="isCopied ? 'Copied!' : 'Copy bounds to clipboard'"
            @click="copyBounds"
          >
            <svg
              v-if="!isCopied"
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
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <svg
              v-else
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
        <canvas
          ref="canvasRef"
          class="window-bounds-canvas"
          :style="windowBoundsCanvasStyle"
          @pointerdown="onCanvasPointerDown"
          @pointermove="onCanvasPointerMove"
          @pointerup="onCanvasPointerUp"
          @pointercancel="onCanvasPointerCancel"
          @pointerleave="onCanvasLeave"
          @pointerenter="onCanvasHover"
        />
      </div>
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

.window-bounds-duplex {
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

.canvas-wrapper {
  margin-top: 10px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 170px;
}

.canvas-container {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.canvas-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.display-select {
  height: 26px;
  padding: 0 28px 0 10px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, #58a6ff 30%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 80%, transparent);
  color: rgba(235, 245, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(88,166,255,0.7)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  max-width: 280px;
}

.display-select:hover {
  background: color-mix(in srgb, #58a6ff 12%, var(--ev-c-black-soft));
  border-color: color-mix(in srgb, #58a6ff 50%, transparent);
  color: #ebf5ff;
  box-shadow: 0 2px 6px rgba(88, 166, 255, 0.15);
}

.display-select:focus {
  border-color: #58a6ff;
  box-shadow: 0 0 0 3px color-mix(in srgb, #58a6ff 15%, transparent);
}

.copy-bounds-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  cursor: pointer;
  color: rgba(88, 166, 255, 0.8);
  border-color: color-mix(in srgb, #58a6ff 25%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.copy-bounds-btn:hover {
  background: color-mix(in srgb, #58a6ff 15%, transparent);
  border-color: color-mix(in srgb, #58a6ff 45%, transparent);
  color: #58a6ff;
}

.copy-bounds-btn:active {
  transform: scale(0.95);
}

.copy-bounds-btn--copied {
  color: rgba(66, 211, 146, 0.8);
  border-color: color-mix(in srgb, #42d392 25%, transparent);
  background: color-mix(in srgb, #42d392 15%, transparent);
}

.copy-bounds-btn--copied:hover {
  color: #42d392;
  border-color: color-mix(in srgb, #42d392 45%, transparent);
}

.window-bounds-canvas {
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 74%, transparent);
  overflow: clip;
  flex: 1 1 auto;
  width: 100%;
  height: auto;
  display: block;
  cursor: grab;
  touch-action: none;
}

.window-bounds-toggle {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.toggle-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--ev-c-text-1);
  line-height: 1.2;
}

.toggle-switch {
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 30%, transparent);
  background: color-mix(in srgb, var(--ev-c-bg-soft) 50%, transparent);
  cursor: pointer;
  transition:
    background-color 200ms ease,
    border-color 200ms ease;
  padding: 0;
  flex-shrink: 0;
}

.toggle-switch:hover {
  border-color: color-mix(in srgb, var(--ev-c-text-2) 40%, transparent);
}

.toggle-switch:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ev-c-text-3);
  transition:
    transform 200ms ease,
    background-color 200ms ease;
}

.toggle-switch--on {
  background: color-mix(in srgb, #58a6ff 25%, transparent);
  border-color: color-mix(in srgb, #58a6ff 50%, transparent);
}

.toggle-switch--on .toggle-slider {
  transform: translateX(18px);
  background: #58a6ff;
}

.window-bounds-actions {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.window-bounds-action {
  cursor: pointer;
  appearance: none;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-1);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 8px 12px;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.action-label {
  display: block;
  line-height: 1.2;
  margin-top: 6px;
}

.action-shortcut {
  margin-top: 6px;
  display: flex;
  gap: 3px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.action-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--ev-c-text-1);
  background: color-mix(in srgb, var(--ev-c-bg-soft) 80%, transparent);
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 4px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.window-bounds-action:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ev-c-text-2) 40%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 66%, transparent);
}

.window-bounds-action:active {
  transform: translateY(0);
}

.window-bounds-action:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
}

@media (max-width: 620px) {
  .window-bounds-actions {
    grid-template-columns: 1fr;
  }
}
</style>
