<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useContext } from '@renderer/composables/useContext';
import { MainWindow } from '../main.window';

interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasProjection {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

type DragMode = 'move' | 'resize';
type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw';

const context = useContext();
const mainWindow = context.require(MainWindow);
const bounds = mainWindow.bounds;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const draftBounds = ref<RectBounds | undefined>(undefined);
const isApplyingCanvasMove = ref(false);
const screenWorkArea = ref<{ x: number; y: number; width: number; height: number }>({
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
});
const screenDisplayBounds = ref<{ x: number; y: number; width: number; height: number }>({
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
});

let dragState:
  | {
      mode: DragMode;
      handle?: ResizeHandle;
      startPointerX: number;
      startPointerY: number;
      startBounds: RectBounds;
      scale: number;
    }
  | undefined;

let frameRequestId: number | undefined;

const telemetryCanvasStyle = computed(() => {
  const ratioWidth = Math.max(
    1,
    screenDisplayBounds.value?.width || screenWorkArea.value.width || 1920,
  );
  const ratioHeight = Math.max(
    1,
    screenDisplayBounds.value?.height || screenWorkArea.value.height || 1080,
  );

  return {
    aspectRatio: `${ratioWidth} / ${ratioHeight}`,
  };
});

function scheduleDraw(): void {
  if (frameRequestId !== undefined) {
    return;
  }

  frameRequestId = window.requestAnimationFrame(() => {
    frameRequestId = undefined;
    drawBoundsCanvas();
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampBoundsToWorkArea(input: RectBounds): RectBounds {
  const workAreaX = Math.round(screenWorkArea.value.x || 0);
  const workAreaY = Math.round(screenWorkArea.value.y || 0);
  const workAreaWidth = Math.max(1, Math.round(screenWorkArea.value.width || 1920));
  const workAreaHeight = Math.max(1, Math.round(screenWorkArea.value.height || 1080));

  const width = clamp(Math.round(input.width), 1, workAreaWidth);
  const height = clamp(Math.round(input.height), 1, workAreaHeight);
  const maxX = workAreaX + workAreaWidth - width;
  const maxY = workAreaY + workAreaHeight - height;

  return {
    x: clamp(Math.round(input.x), workAreaX, Math.max(workAreaX, maxX)),
    y: clamp(Math.round(input.y), workAreaY, Math.max(workAreaY, maxY)),
    width,
    height,
  };
}

function projectBounds(
  toProject: RectBounds,
  canvasWidth: number,
  canvasHeight: number,
): CanvasProjection {
  const visualZoneX = 18;
  const visualZoneY = 18;
  const visualZoneWidth = canvasWidth - 36;
  const visualZoneHeight = canvasHeight - 36;

  const displayX = screenDisplayBounds.value?.x ?? screenWorkArea.value.x;
  const displayY = screenDisplayBounds.value?.y ?? screenWorkArea.value.y;
  const displayWidth = Math.max(
    1,
    screenDisplayBounds.value?.width || screenWorkArea.value.width || 1920,
  );
  const displayHeight = Math.max(
    1,
    screenDisplayBounds.value?.height || screenWorkArea.value.height || 1080,
  );

  const workAreaWidth = Math.max(1, screenWorkArea.value.width || 1920);
  const workAreaHeight = Math.max(1, screenWorkArea.value.height || 1080);

  const scale = Math.min(visualZoneWidth / displayWidth, visualZoneHeight / displayHeight);

  const projectedDisplayWidth = Math.floor(displayWidth * scale);
  const projectedDisplayHeight = Math.floor(displayHeight * scale);
  const offsetX = visualZoneX + Math.floor((visualZoneWidth - projectedDisplayWidth) / 2);
  const offsetY = visualZoneY + Math.floor((visualZoneHeight - projectedDisplayHeight) / 2);

  const projectedWorkAreaX = offsetX + Math.round((screenWorkArea.value.x - displayX) * scale);
  const projectedWorkAreaY = offsetY + Math.round((screenWorkArea.value.y - displayY) * scale);

  // Kept for layout symmetry — used implicitly in coordinate clamping context.
  void Math.floor(workAreaWidth * scale);
  void Math.floor(workAreaHeight * scale);

  const projectedWidth = clamp(Math.floor(toProject.width * scale), 24, projectedDisplayWidth);
  const projectedHeight = clamp(Math.floor(toProject.height * scale), 16, projectedDisplayHeight);
  const absoluteX = projectedWorkAreaX + Math.round((toProject.x - screenWorkArea.value.x) * scale);
  const absoluteY = projectedWorkAreaY + Math.round((toProject.y - screenWorkArea.value.y) * scale);
  const maxX = offsetX + projectedDisplayWidth - projectedWidth;
  const maxY = offsetY + projectedDisplayHeight - projectedHeight;

  return {
    x: clamp(absoluteX, offsetX, Math.max(offsetX, maxX)),
    y: clamp(absoluteY, offsetY, Math.max(offsetY, maxY)),
    width: projectedWidth,
    height: projectedHeight,
    scale,
  };
}

function drawBoundsCanvas(): void {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) {
    return;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  const framePadding = 10;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(framePadding, framePadding, width - framePadding * 2, height - framePadding * 2, 8);
  ctx.fill();
  ctx.stroke();

  const renderedBounds = draftBounds.value || bounds.value;
  if (!renderedBounds) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText('Awaiting bounds...', 18, Math.floor(height / 2));
    return;
  }

  const projection = projectBounds(renderedBounds, width, height);

  ctx.fillStyle = 'rgba(66, 211, 146, 0.14)';
  ctx.strokeStyle = 'rgba(66, 211, 146, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(projection.x, projection.y, projection.width, projection.height, 6);
  ctx.fill();
  ctx.stroke();

  const handleRadius = 6;
  const handleStroke = 'rgba(66, 211, 146, 0.95)';
  const handleFill = 'rgba(14, 20, 24, 0.92)';
  const handleCenters = [
    { x: projection.x, y: projection.y },
    { x: projection.x + projection.width, y: projection.y },
    { x: projection.x + projection.width, y: projection.y + projection.height },
    { x: projection.x, y: projection.y + projection.height },
  ];

  for (const center of handleCenters) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = handleFill;
    ctx.fill();
    ctx.strokeStyle = handleStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillText(
    `${renderedBounds.width} x ${renderedBounds.height}`,
    projection.x + 8,
    projection.y + 16,
  );
  ctx.fillText(`x:${renderedBounds.x} y:${renderedBounds.y}`, projection.x + 8, projection.y + 30);
}

function detectResizeHandle(
  pointerX: number,
  pointerY: number,
  projection: CanvasProjection,
): ResizeHandle | undefined {
  const handleRadius = 10;
  const centers: Array<{ handle: ResizeHandle; x: number; y: number }> = [
    { handle: 'nw', x: projection.x, y: projection.y },
    { handle: 'ne', x: projection.x + projection.width, y: projection.y },
    { handle: 'se', x: projection.x + projection.width, y: projection.y + projection.height },
    { handle: 'sw', x: projection.x, y: projection.y + projection.height },
  ];

  for (const center of centers) {
    const dx = pointerX - center.x;
    const dy = pointerY - center.y;
    if (dx * dx + dy * dy <= handleRadius * handleRadius) {
      return center.handle;
    }
  }

  return undefined;
}

function cursorForHandle(handle: ResizeHandle | undefined): string {
  if (!handle) {
    return 'grab';
  }

  if (handle === 'nw' || handle === 'se') {
    return 'nwse-resize';
  }

  return 'nesw-resize';
}

function onCanvasPointerDown(event: PointerEvent): void {
  if (!bounds.value || isApplyingCanvasMove.value) {
    return;
  }

  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const activeBounds = draftBounds.value || (bounds.value as RectBounds);
  const projection = projectBounds(activeBounds, canvas.clientWidth, canvas.clientHeight);

  const handle = detectResizeHandle(pointerX, pointerY, projection);
  const insideRect =
    pointerX >= projection.x &&
    pointerX <= projection.x + projection.width &&
    pointerY >= projection.y &&
    pointerY <= projection.y + projection.height;

  if (!insideRect && !handle) {
    return;
  }

  canvas.setPointerCapture(event.pointerId);
  dragState = {
    mode: handle ? 'resize' : 'move',
    handle,
    startPointerX: event.clientX,
    startPointerY: event.clientY,
    startBounds: { ...activeBounds },
    scale: projection.scale,
  };

  canvas.style.cursor = handle ? cursorForHandle(handle) : 'grabbing';
}

function onCanvasPointerMove(event: PointerEvent): void {
  if (!dragState || !bounds.value) {
    onCanvasHover(event);
    return;
  }

  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const minWidth = 520;
  const minHeight = 360;
  const deltaX = event.clientX - dragState.startPointerX;
  const deltaY = event.clientY - dragState.startPointerY;
  const deltaRealX = Math.round(deltaX / Math.max(dragState.scale, 0.001));
  const deltaRealY = Math.round(deltaY / Math.max(dragState.scale, 0.001));

  if (dragState.mode === 'move') {
    draftBounds.value = clampBoundsToWorkArea({
      ...dragState.startBounds,
      x: dragState.startBounds.x + deltaRealX,
      y: dragState.startBounds.y + deltaRealY,
    });
  } else {
    const next: RectBounds = { ...dragState.startBounds };

    switch (dragState.handle) {
      case 'nw':
        next.x = dragState.startBounds.x + deltaRealX;
        next.y = dragState.startBounds.y + deltaRealY;
        next.width = dragState.startBounds.width - deltaRealX;
        next.height = dragState.startBounds.height - deltaRealY;
        break;
      case 'ne':
        next.y = dragState.startBounds.y + deltaRealY;
        next.width = dragState.startBounds.width + deltaRealX;
        next.height = dragState.startBounds.height - deltaRealY;
        break;
      case 'sw':
        next.x = dragState.startBounds.x + deltaRealX;
        next.width = dragState.startBounds.width - deltaRealX;
        next.height = dragState.startBounds.height + deltaRealY;
        break;
      case 'se':
      default:
        next.width = dragState.startBounds.width + deltaRealX;
        next.height = dragState.startBounds.height + deltaRealY;
        break;
    }

    if (next.width < minWidth) {
      if (dragState.handle === 'nw' || dragState.handle === 'sw') {
        next.x = next.x - (minWidth - next.width);
      }
      next.width = minWidth;
    }

    if (next.height < minHeight) {
      if (dragState.handle === 'nw' || dragState.handle === 'ne') {
        next.y = next.y - (minHeight - next.height);
      }
      next.height = minHeight;
    }

    draftBounds.value = clampBoundsToWorkArea(next);
  }

  if (dragState.mode === 'resize') {
    canvas.style.cursor = cursorForHandle(dragState.handle);
  }

  scheduleDraw();
}

function onCanvasLeave(): void {
  const canvas = canvasRef.value;
  if (!canvas || dragState) {
    return;
  }

  canvas.style.cursor = 'grab';
}

async function validateCanvasMove(): Promise<void> {
  if (!draftBounds.value) {
    return;
  }

  const requested = { ...draftBounds.value };
  isApplyingCanvasMove.value = true;

  try {
    const applied = (await mainWindow.setBounds(requested)) as RectBounds | undefined;
    if (!applied) {
      return;
    }
    await syncDisplayWorkArea();
  } catch (error) {
    console.error('Apply failed', error);
  } finally {
    draftBounds.value = undefined;
    isApplyingCanvasMove.value = false;
    drawBoundsCanvas();
  }
}

async function onCanvasPointerUp(event: PointerEvent): Promise<void> {
  const canvas = canvasRef.value;
  if (canvas && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  if (!dragState) {
    return;
  }

  dragState = undefined;
  if (canvas) {
    canvas.style.cursor = 'grab';
  }
  await validateCanvasMove();
}

function onCanvasPointerCancel(event: PointerEvent): void {
  const canvas = canvasRef.value;
  if (canvas && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  dragState = undefined;
  draftBounds.value = undefined;
  if (canvas) {
    canvas.style.cursor = 'grab';
  }
  drawBoundsCanvas();
}

function onCanvasHover(event: PointerEvent): void {
  const canvas = canvasRef.value;
  if (!canvas || dragState || !bounds.value) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const projection = projectBounds(
    bounds.value as RectBounds,
    canvas.clientWidth,
    canvas.clientHeight,
  );
  const handle = detectResizeHandle(pointerX, pointerY, projection);

  const insideRect =
    pointerX >= projection.x &&
    pointerX <= projection.x + projection.width &&
    pointerY >= projection.y &&
    pointerY <= projection.y + projection.height;

  if (handle) {
    canvas.style.cursor = cursorForHandle(handle);
  } else if (insideRect) {
    canvas.style.cursor = 'move';
  } else {
    canvas.style.cursor = 'grab';
  }
}

const syncDisplayWorkArea = async (): Promise<void> => {
  const [workArea, displayBounds] = await Promise.all([
    mainWindow.getDisplayWorkArea(),
    mainWindow.getDisplayBounds(),
  ]);

  if (!workArea?.width || !workArea?.height) {
    return;
  }

  screenWorkArea.value = {
    x: Math.round(workArea.x || 0),
    y: Math.round(workArea.y || 0),
    width: Math.max(1, Math.round(workArea.width)),
    height: Math.max(1, Math.round(workArea.height)),
  };

  if (displayBounds?.width && displayBounds?.height) {
    screenDisplayBounds.value = {
      x: Math.round(displayBounds.x || 0),
      y: Math.round(displayBounds.y || 0),
      width: Math.max(1, Math.round(displayBounds.width)),
      height: Math.max(1, Math.round(displayBounds.height)),
    };
  }
};

const randomizeBounds = async (): Promise<void> => {
  await mainWindow.randomBounds();
  await syncDisplayWorkArea();
};

const refreshBounds = async (): Promise<void> => {
  await mainWindow.refreshBounds();
  await syncDisplayWorkArea();
};

const centerWindow = async (): Promise<void> => {
  await mainWindow.centerWindow();
  await syncDisplayWorkArea();
};

onMounted(async () => {
  await mainWindow.refreshBounds();
  await syncDisplayWorkArea();
  drawBoundsCanvas();
});

onBeforeUnmount(() => {
  dragState = undefined;
  if (frameRequestId !== undefined) {
    window.cancelAnimationFrame(frameRequestId);
    frameRequestId = undefined;
  }
});

// Watch the ShallowRef directly — most reliable way to track bounds changes from IPC events.
watch(bounds, () => {
  if (!dragState) {
    draftBounds.value = undefined;
  }
  drawBoundsCanvas();
});

watch(screenWorkArea, () => scheduleDraw(), { deep: true });
watch(screenDisplayBounds, () => scheduleDraw(), { deep: true });
</script>

<template>
  <article class="card card--telemetry" aria-live="polite">
    <header class="card__header">
      <div class="card__title-row">
        <h2>Window Geometry</h2>
        <span class="telemetry-duplex">Full-duplex</span>
      </div>
      <button
        type="button"
        class="telemetry-refresh"
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

    <canvas
      ref="canvasRef"
      class="telemetry-canvas"
      :style="telemetryCanvasStyle"
      @pointerdown="onCanvasPointerDown"
      @pointermove="onCanvasPointerMove"
      @pointerup="onCanvasPointerUp"
      @pointercancel="onCanvasPointerCancel"
      @pointerleave="onCanvasLeave"
      @pointerenter="onCanvasHover"
    />

    <div class="telemetry-actions">
      <button type="button" class="telemetry-action" @click="randomizeBounds">Random Bounds</button>
      <button type="button" class="telemetry-action" @click="centerWindow">Center Window</button>
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

.card__title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.telemetry-duplex {
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

.telemetry-refresh {
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

.telemetry-refresh svg {
  width: 15px;
  height: 15px;
}

.telemetry-refresh:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ev-c-text-2) 44%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 68%, transparent);
}

.telemetry-refresh:active {
  transform: translateY(0);
}

.telemetry-refresh:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
}

.telemetry-canvas {
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

.telemetry-actions {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.telemetry-action {
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

.telemetry-action:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ev-c-text-2) 40%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 66%, transparent);
}

.telemetry-action:active {
  transform: translateY(0);
}

.telemetry-action:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ev-c-text-1) 70%, transparent);
  outline-offset: 2px;
}

@media (max-width: 620px) {
  .telemetry-actions {
    grid-template-columns: 1fr;
  }
}
</style>
