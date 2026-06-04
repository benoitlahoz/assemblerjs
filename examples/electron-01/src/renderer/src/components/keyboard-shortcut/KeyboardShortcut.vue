<script setup lang="ts">
import type { KeyboardShortcut } from './types';

const props = defineProps<{
  keys: string[];
  description: string;
  compact?: boolean;
}>();

const formatKey = (key: string): string => {
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
};
</script>

<template>
  <div class="shortcut-item" :class="{ 'shortcut-item--compact': compact }">
    <dt class="shortcut-description">{{ description }}</dt>
    <dd class="shortcut-keys">
      <kbd v-for="(key, keyIndex) in keys" :key="keyIndex" class="shortcut-key">
        {{ formatKey(key) }}
      </kbd>
    </dd>
  </div>
</template>

<style scoped>
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 8px;
}

.shortcut-description {
  font-size: 13px;
  color: var(--ev-c-text-2);
  font-weight: 400;
  margin: 0;
  flex: 1;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
  margin: 0;
  flex-shrink: 0;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--ev-c-text-1);
  background: color-mix(in srgb, var(--ev-c-bg-soft) 80%, transparent);
  border: 1px solid var(--ev-button-alt-border);
  border-radius: 4px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.shortcut-item--compact {
  padding: 6px;
  gap: 4px;
}

.shortcut-item--compact .shortcut-description {
  font-size: 12px;
}

.shortcut-item--compact .shortcut-key {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
}
</style>
