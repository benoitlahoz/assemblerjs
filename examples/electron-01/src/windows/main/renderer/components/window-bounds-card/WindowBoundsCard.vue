<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { MenuItemState } from '@assemblerjs/electron/renderer';
import { useContext } from '@renderer/composables/useContext';
import { KeyboardShortcut } from '@renderer/components/keyboard-shortcut';
import type { KeyboardShortcutType } from '@renderer/components/keyboard-shortcut';
import { MainWindow } from '../../main.window';
import { MainMenuService } from '../../main.menu';
import { useWindowBoundsCard } from './useWindowBoundsCard';

const context = useContext();
const mainWindow = context.require(MainWindow);
const menuService = context.require(MainMenuService);
const bounds = mainWindow.bounds;

const menuItems = ref<Record<string, MenuItemState>>({});

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
  // Detect macOS from navigator instead of process
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  return accelerator.split('+').map((key) => {
    const normalized = key.toLowerCase();
    if (normalized === 'cmdorctrl') {
      return isMac ? 'cmd' : 'ctrl';
    }
    return normalized;
  });
}

const shortcuts = computed<KeyboardShortcutType[]>(() => {
  const itemIds = [
    'window.bounds.refreshBounds',
    'window.bounds.randomBounds',
    'window.bounds.centerWindow',
  ];

  const result = itemIds
    .map((id) => {
      const itemState = menuItems.value[id];
      if (!itemState) {
        return null;
      }

      const { label, accelerator } = itemState;
      if (!accelerator) {
        return null;
      }

      return {
        keys: acceleratorToKeys(accelerator),
        description: label || id,
      };
    })
    .filter((shortcut): shortcut is KeyboardShortcutType => shortcut !== null);

  return result;
});
</script>

<template>
  <article class="card card--window-bounds" aria-live="polite">
    <header class="card__header">
      <div class="card__title-row">
        <h2>Window Geometry</h2>
        <span class="window-bounds-duplex">Full-duplex</span>
      </div>
      <button
        type="button"
        class="window-bounds-refresh"
        aria-label="Refresh window bounds"
        title="Refresh bounds"
        @click="refreshBounds"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 4v6h-6M4 20v-6h6M20 10a8 8 0 0 0-14.9-2M4 14a8 8 0 0 0 14.9 2"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
          />
        </svg>
      </button>
    </header>

    <p class="card__description">
      Real-time geometry stream from the main process, synchronized through decorators.
    </p>

    <div class="window-bounds-actions">
      <button type="button" class="window-bounds-action" @click="randomizeBounds">
        Random Bounds
      </button>
      <button type="button" class="window-bounds-action" @click="centerWindow">
        Center Window
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

    <section class="user-menu-section">
      <h3 class="user-menu-section__title">with user menu</h3>
      <dl class="user-menu-section__shortcuts">
        <KeyboardShortcut
          v-for="(shortcut, index) in shortcuts"
          :key="index"
          :keys="shortcut.keys"
          :description="shortcut.description"
          compact
        />
      </dl>
    </section>
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

.window-bounds-refresh {
  cursor: pointer;
  appearance: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 24%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 76%, transparent);
  color: var(--ev-c-text-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.window-bounds-refresh svg {
  width: 15px;
  height: 15px;
}

.window-bounds-refresh:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ev-c-text-2) 44%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 68%, transparent);
}

.window-bounds-refresh:active {
  transform: translateY(0);
}

.window-bounds-refresh:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.user-menu-section {
  margin-top: 12px;
}

.user-menu-section__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ev-c-text-2);
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-menu-section__shortcuts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

@media (max-width: 620px) {
  .user-menu-section__shortcuts {
    grid-template-columns: 1fr;
  }
}
</style>
