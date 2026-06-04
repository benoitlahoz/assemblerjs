<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, type Ref } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { MainWindow } from '../../main.window';
import { SystemStateModule } from '@features/system/renderer/system-state.module';
import type { TitleBarConfig } from '@assemblerjs/electron/renderer';

const context = useContext();
const mainWindow = context.require(MainWindow);
const { system } = context.require(SystemStateModule);

// Inject config from MainWindow
const config = inject<Ref<TitleBarConfig | undefined>>('titleBarConfig')!;

const windowTitle = ref<string | undefined>('');
const titleInputRef = ref<HTMLInputElement | null>(null);
const measureSpan = ref<HTMLSpanElement | null>(null);
const titleBarRef = ref<HTMLDivElement | null>(null);
const isPinned = ref(false);
const appUptimeSec = ref<number>(0);

// Check if we're on macOS (traffic lights on left)
const isMacOS = computed(() => config.value?.platform === 'darwin');

const formattedUptime = computed(() => {
  const totalSeconds = appUptimeSec.value;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Compute input width based on content
const inputWidth = computed(() => {
  if (!measureSpan.value || !windowTitle.value) {
    return '100px'; // Minimum width
  }

  // Measure the text width using the hidden span
  measureSpan.value.textContent = windowTitle.value || 'Window Title';
  const width = measureSpan.value.offsetWidth;

  // Add padding (12px * 2 = 24px) and a bit of extra space
  return `${Math.max(100, width + 24 + 10)}px`;
});

const updateTitle = async () => {
  const trimmedTitle = windowTitle.value?.trim();
  if (trimmedTitle) {
    await mainWindow.setTitle(trimmedTitle);
  } else {
    // Restore previous title if empty
    windowTitle.value = await mainWindow.getTitle();
  }
};

const handleTitleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    updateTitle();
    titleInputRef.value?.blur();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    // Restore original title
    mainWindow.getTitle().then((title) => {
      windowTitle.value = title;
      titleInputRef.value?.blur();
    });
  }
};

// Compute balanced padding for centered title
const paddingStyle = computed(() => {
  if (!config.value) return {};
  const { insets, height } = config.value;

  // On macOS, balance horizontal padding to truly center the title
  if (isMacOS.value) {
    return {
      paddingTop: `${insets.top}px`,
      paddingRight: `${insets.left}px`, // Same as left for centering
      paddingBottom: `${insets.bottom}px`,
      paddingLeft: `${insets.left}px`,
      height: `${height}px`,
    };
  }

  // On Windows/Linux, use insets as-is
  return {
    paddingTop: `${insets.top}px`,
    paddingRight: `${insets.right}px`,
    paddingBottom: `${insets.bottom}px`,
    paddingLeft: `${insets.left}px`,
    height: `${height}px`,
  };
});

// Blur handler - blur on any click except the input itself
let cleanupTitleChanged: (() => void) | undefined;
let cleanupTitleBarChanged: (() => void) | undefined;

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;

  // Only keep focus if clicking directly on the input
  if (!titleInputRef.value?.contains(target) && document.activeElement === titleInputRef.value) {
    titleInputRef.value?.blur();
  }
};

const togglePin = async () => {
  isPinned.value = !isPinned.value;
  await mainWindow.setAlwaysOnTop(isPinned.value);
};

let unsubscribeSnapshot: (() => void) | undefined;

onMounted(async () => {
  console.log('[RENDERER/CustomTitleBar] Initial config:', config.value);
  windowTitle.value = await mainWindow.getTitle();
  isPinned.value = await mainWindow.isAlwaysOnTop();

  // Subscribe to system state for uptime
  unsubscribeSnapshot = system.onSnapshot((snapshot) => {
    if (snapshot?.process?.uptimeSec !== undefined) {
      appUptimeSec.value = snapshot.process.uptimeSec;
    }
  });

  // Get initial snapshot
  const snapshot = await system.getSnapshot();
  if (snapshot?.process?.uptimeSec !== undefined) {
    appUptimeSec.value = snapshot.process.uptimeSec;
  }

  // Listen for title changes from main process
  cleanupTitleChanged = mainWindow.onTitleChanged((newTitle: string) => {
    windowTitle.value = newTitle;
  });

  // Listen for titlebar config changes (Windows/Linux system overlay updates)
  // On macOS, height is managed locally via provide/inject
  cleanupTitleBarChanged = mainWindow.onTitleBarChanged((newConfig) => {
    if (!newConfig) {
      console.warn('[RENDERER/CustomTitleBar] Received undefined titlebar config, ignoring');
      return;
    }
    console.log('[RENDERER/CustomTitleBar] Received titlebar-changed event:', newConfig);
    console.log(
      '[RENDERER/CustomTitleBar] Previous height:',
      config.value?.height,
      '→ New height:',
      newConfig.height,
    );
    config.value = newConfig;
  });

  // Add global click handler for blur
  document.addEventListener('click', handleClickOutside, true);
});

onUnmounted(() => {
  cleanupTitleChanged?.();
  cleanupTitleBarChanged?.();
  unsubscribeSnapshot?.();
  document.removeEventListener('click', handleClickOutside, true);
});
</script>

<template>
  <div v-if="config" ref="titleBarRef" class="custom-title-bar" :style="paddingStyle">
    <!-- Title bar content -->
    <div class="title-bar-content">
      <span ref="measureSpan" class="title-bar-measure"></span>
      <div class="title-bar-input-wrapper">
        <input
          ref="titleInputRef"
          v-model="windowTitle"
          type="text"
          class="title-bar-title-input"
          :style="{ width: inputWidth }"
          placeholder="Window Title"
          @blur="updateTitle"
          @keydown="handleTitleKeydown"
        />
        <span class="title-bar-uptime">{{ formattedUptime }}</span>
      </div>
    </div>

    <!-- Pin button -->
    <button
      class="title-bar-pin-button"
      :class="{ active: isPinned }"
      :title="isPinned ? 'Unpin window' : 'Pin window on top'"
      @click="togglePin"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 17v5" />
        <path
          d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.custom-title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* height is set dynamically via inline style */
  background: linear-gradient(135deg, #181818 0%, #1e1e1e 50%, #141414 100%);
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  z-index: 10000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  box-sizing: border-box;
  transition: height 0.2s ease;
}

.title-bar-content {
  flex: 1;
  min-width: 0;
  -webkit-app-region: drag;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  position: relative;
}

.title-bar-measure {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  pointer-events: none;
}

.title-bar-input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.title-bar-uptime {
  font-size: 11px;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
  white-space: nowrap;
  -webkit-app-region: no-drag;
}

.title-bar-title-input {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.3px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 6px 12px;
  outline: none;
  -webkit-app-region: no-drag;
  text-align: center;
  transition: all 0.15s ease;
}

.title-bar-title-input:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.title-bar-title-input:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.title-bar-pin-button {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  -webkit-app-region: no-drag;
}

.title-bar-pin-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
}

.title-bar-pin-button:active {
  transform: translateY(-50%) scale(0.95);
}

.title-bar-pin-button.active {
  background: rgba(66, 211, 146, 0.15);
  border-color: rgba(66, 211, 146, 0.3);
  color: rgba(66, 211, 146, 1);
}

.title-bar-pin-button.active:hover {
  background: rgba(66, 211, 146, 0.22);
  border-color: rgba(66, 211, 146, 0.4);
}
</style>
