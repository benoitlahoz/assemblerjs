<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { MainWindow } from '../../main.window';
import type { TitleBarConfig } from '@assemblerjs/electron/universal';

const context = useContext();
const mainWindow = context.require(MainWindow);

const config = ref<TitleBarConfig | undefined>(undefined);
const buttonPosition = ref<{ x: number; y: number } | undefined>(undefined);
const windowTitle = ref<string>('');
const titleInputRef = ref<HTMLInputElement | null>(null);
const measureSpan = ref<HTMLSpanElement | null>(null);

// Check if we're on macOS (traffic lights on left)
const isMacOS = computed(() => config.value?.platform === 'darwin');

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
  const trimmedTitle = windowTitle.value.trim();
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
  const { insets } = config.value;

  // On macOS, balance horizontal padding to truly center the title
  if (isMacOS.value) {
    return {
      paddingTop: `${insets.top}px`,
      paddingRight: `${insets.left}px`, // Same as left for centering
      paddingBottom: `${insets.bottom}px`,
      paddingLeft: `${insets.left}px`,
    };
  }

  // On Windows/Linux, use insets as-is
  return {
    paddingTop: `${insets.top}px`,
    paddingRight: `${insets.right}px`,
    paddingBottom: `${insets.bottom}px`,
    paddingLeft: `${insets.left}px`,
  };
});

onMounted(async () => {
  config.value = await mainWindow.getTitleBarConfig();
  buttonPosition.value = await mainWindow.getWindowButtonPosition();
  windowTitle.value = await mainWindow.getTitle();

  // Listen for title changes
  const cleanup = mainWindow.onTitleChanged((newTitle: string) => {
    windowTitle.value = newTitle;
  });

  // Cleanup on unmount
  return cleanup;
});
</script>

<template>
  <div v-if="config" class="custom-title-bar" :style="paddingStyle">
    <!-- Title bar content -->
    <div class="title-bar-content">
      <span ref="measureSpan" class="title-bar-measure"></span>
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
    </div>
  </div>
</template>

<style scoped>
.custom-title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: linear-gradient(135deg, #181818 0%, #1e1e1e 50%, #141414 100%);
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  z-index: 10000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  box-sizing: border-box;
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
</style>
