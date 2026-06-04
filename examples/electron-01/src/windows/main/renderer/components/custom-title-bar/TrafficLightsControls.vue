<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { MainWindow } from '../../main.window';
import type { TitleBarConfig } from '@assemblerjs/electron/renderer';

const context = useContext();
const mainWindow = context.require(MainWindow);

// Inject config from MainWindow (shared with CustomTitleBar)
const titleBarConfig = inject<Ref<TitleBarConfig | undefined>>('titleBarConfig');

// Props
interface Props {
  platform?: string;
}

const props = defineProps<Props>();

// State
const buttonPosition = ref<{ x: number; y: number } | undefined>();
const trafficX = ref(16);
const trafficY = ref(20);
const directHeight = ref(52); // For Windows/Linux direct height control

// Computed
const isMacOS = computed(() => props.platform === 'darwin');
const titleBarHeight = computed(() => {
  // On macOS, calculate from Y position
  if (isMacOS.value) {
    return trafficY.value * 2 + 12;
  }
  // On Windows/Linux, use direct height
  return directHeight.value;
});

// Slider state
const isDraggingX = ref(false);
const isDraggingY = ref(false);
const isDraggingHeight = ref(false);
const sliderXTrack = ref<HTMLDivElement | null>(null);
const sliderYTrack = ref<HTMLDivElement | null>(null);
const sliderHeightTrack = ref<HTMLDivElement | null>(null);

// Methods
const updateTrafficLightsPosition = async () => {
  if (isMacOS.value) {
    // macOS: only update traffic lights position
    // Height is CSS-only, update locally by modifying shared config
    await mainWindow.setWindowButtonPosition({
      x: trafficX.value,
      y: trafficY.value,
    });
    // Update height locally in shared config (no IPC needed on macOS)
    if (titleBarConfig?.value) {
      const newHeight = titleBarHeight.value;
      const newContentAreaHeight =
        newHeight - titleBarConfig.value.insets.top - titleBarConfig.value.insets.bottom;
      titleBarConfig.value = {
        ...titleBarConfig.value,
        height: newHeight,
        contentArea: {
          ...titleBarConfig.value.contentArea,
          height: newContentAreaHeight,
        },
      };
    }
  } else {
    // Windows/Linux: update system titleBarOverlay
    await mainWindow.setTitleBarOverlay({ height: directHeight.value });
  }
};

const startDragX = (e: MouseEvent) => {
  if (!sliderXTrack.value) return;
  isDraggingX.value = true;
  updateSliderX(e);

  const onMove = (e: MouseEvent) => updateSliderX(e);
  const onUp = () => {
    isDraggingX.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  e.preventDefault();
  e.stopPropagation();
};

const startDragY = (e: MouseEvent) => {
  if (!sliderYTrack.value) return;
  isDraggingY.value = true;
  updateSliderY(e);

  const onMove = (e: MouseEvent) => updateSliderY(e);
  const onUp = () => {
    isDraggingY.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  e.preventDefault();
  e.stopPropagation();
};

const startDragHeight = (e: MouseEvent) => {
  if (!sliderHeightTrack.value) return;
  isDraggingHeight.value = true;
  updateSliderHeight(e);

  const onMove = (e: MouseEvent) => updateSliderHeight(e);
  const onUp = () => {
    isDraggingHeight.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  e.preventDefault();
  e.stopPropagation();
};

const updateSliderX = (e: MouseEvent) => {
  if (!sliderXTrack.value) return;
  const rect = sliderXTrack.value.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  trafficX.value = Math.round(10 + percent * 30);
  updateTrafficLightsPosition();
};

const updateSliderY = (e: MouseEvent) => {
  if (!sliderYTrack.value) return;
  const rect = sliderYTrack.value.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  trafficY.value = Math.round(10 + percent * 30);
  updateTrafficLightsPosition();
};

const updateSliderHeight = (e: MouseEvent) => {
  if (!sliderHeightTrack.value) return;
  const rect = sliderHeightTrack.value.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  directHeight.value = Math.round(40 + percent * 40); // Range: 40-80px
  updateTrafficLightsPosition();
};

const getThumbPositionX = computed(() => {
  const percent = (trafficX.value - 10) / 30;
  return `${percent * 100}%`;
});

const getThumbPositionY = computed(() => {
  const percent = (trafficY.value - 10) / 30;
  return `${percent * 100}%`;
});

const getThumbPositionHeight = computed(() => {
  const percent = (directHeight.value - 40) / 40;
  return `${percent * 100}%`;
});

// Lifecycle
onMounted(async () => {
  if (isMacOS.value) {
    // macOS: get traffic lights position
    buttonPosition.value = await mainWindow.getWindowButtonPosition();

    if (buttonPosition.value) {
      trafficX.value = buttonPosition.value.x;
      trafficY.value = buttonPosition.value.y;
    }
  } else {
    // Windows/Linux: get current titlebar height
    const config = await mainWindow.getTitleBarConfig();
    if (config?.height) {
      directHeight.value = config.height;
    }
  }
});
</script>

<template>
  <div class="traffic-controls">
    <!-- macOS: Traffic Lights Position Controls -->
    <template v-if="isMacOS">
      <div class="traffic-controls-header">
        <h3 class="traffic-controls-title">Traffic Lights Position</h3>
        <div class="control-info">H: {{ titleBarHeight }}</div>
      </div>
      <div class="traffic-controls-sliders">
        <div class="control-group">
          <label class="control-label">X: {{ trafficX }}</label>
          <div ref="sliderXTrack" class="control-slider-track" @mousedown="startDragX">
            <div
              class="control-slider-thumb"
              :class="{ dragging: isDraggingX }"
              :style="{ left: getThumbPositionX }"
            ></div>
          </div>
        </div>
        <div class="control-group">
          <label class="control-label">Y: {{ trafficY }}</label>
          <div ref="sliderYTrack" class="control-slider-track" @mousedown="startDragY">
            <div
              class="control-slider-thumb"
              :class="{ dragging: isDraggingY }"
              :style="{ left: getThumbPositionY }"
            ></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Windows/Linux: Direct Title Bar Height Control -->
    <template v-else>
      <div class="traffic-controls-header">
        <h3 class="traffic-controls-title">Title Bar Height</h3>
        <div class="control-info">{{ titleBarHeight }}px</div>
      </div>
      <div class="traffic-controls-sliders">
        <div class="control-group">
          <label class="control-label">Height: {{ directHeight }}px</label>
          <div ref="sliderHeightTrack" class="control-slider-track" @mousedown="startDragHeight">
            <div
              class="control-slider-thumb"
              :class="{ dragging: isDraggingHeight }"
              :style="{ left: getThumbPositionHeight }"
            ></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.traffic-controls {
  margin-top: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 18%, transparent);
}

.traffic-controls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.traffic-controls-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.traffic-controls-sliders {
  display: flex;
  gap: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  flex: 1;
}

.control-label {
  font-size: 10px;
  color: var(--ev-c-text-2);
  font-weight: 600;
  letter-spacing: 0.5px;
  user-select: none;
}

.control-slider-track {
  width: 100%;
  height: 6px;
  background: color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.control-slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #58a6ff;
  border-radius: 50%;
  cursor: grab;
  transition: background 0.15s ease;
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.control-slider-thumb.dragging {
  cursor: grabbing;
  background: #79b8ff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.control-slider-track:hover .control-slider-thumb {
  background: #79b8ff;
}

.control-info {
  font-size: 11px;
  color: var(--ev-c-text-2);
  font-weight: 600;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--ev-c-text-3) 10%, transparent);
  border-radius: 6px;
  user-select: none;
  text-align: center;
  min-width: 50px;
}
</style>
