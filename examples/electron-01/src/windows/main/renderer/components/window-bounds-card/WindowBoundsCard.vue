<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { MenuItemState } from '@assemblerjs/electron/renderer';
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
} = useWindowBoundsCard(mainWindow, bounds);

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
</script>

<template>
  <article class="card card--window-bounds" aria-live="polite">
    <header class="card__header">
      <h2>Window Configuration</h2>
      <span class="window-bounds-duplex">Full-duplex</span>
    </header>

    <p class="card__description">
      Interactive geometry canvas with live bounds streaming, platform-specific title bar controls,
      and decorator-based synchronization.
    </p>

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

.window-bounds-canvas {
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 74%, transparent);
  overflow: clip;
  flex: 1 1 auto;
  min-height: 170px;
  width: 100%;
  height: auto;
  display: block;
  cursor: grab;
  touch-action: none;
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
