<template>
  <header class="hero">
    <div class="hero__brand">
      <img alt="logo" class="hero__logo" src="@renderer/assets/electron.svg" />
      <div class="hero__content">
        <p class="hero__eyebrow">AssemblerJS Electron Playground</p>
        <h1 class="hero__title">Window Geometry + Full-Duplex IPC</h1>
        <p class="hero__description">
          Drag and resize the window from the canvas, then monitor bidirectional IPC heartbeat and
          latency trends in real time.
        </p>
        <div class="hero__chips" aria-hidden="true">
          <span class="hero__chip">Window Bounds Control</span>
          <span class="hero__chip">Full-Duplex RPC</span>
          <span class="hero__chip">Live Latency Chart</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  display: block;
  padding: 2px 2px 4px;
}

.hero__brand {
  display: flex;
  align-items: center;
  gap: 18px;
  text-align: left;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  background:
    radial-gradient(120% 180% at 0% 0%, rgba(88, 166, 255, 0.18), transparent 58%),
    radial-gradient(120% 180% at 100% 100%, rgba(66, 211, 146, 0.16), transparent 56%),
    color-mix(in srgb, var(--ev-c-black-soft) 45%, transparent);
}

.hero__logo {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  filter: drop-shadow(0 8px 20px rgba(88, 166, 255, 0.22));
}

.hero__content {
  min-width: 0;
}

.hero__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ev-c-text-2);
}

.hero__title {
  margin: 6px 0 0;
  max-width: 760px;
  font-size: 28px;
  line-height: 1.12;
  color: var(--ev-c-text-1);
}

.hero__description {
  margin: 8px 0 0;
  max-width: 760px;
  color: var(--ev-c-text-2);
  font-size: 14px;
  line-height: 1.4;
}

.hero__chips {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero__chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 24%, transparent);
  background: color-mix(in srgb, var(--ev-c-black-soft) 72%, transparent);
  color: var(--ev-c-text-2);
  font-size: 11px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

@media (max-width: 620px) {
  .hero__brand {
    align-items: flex-start;
    padding: 12px;
  }

  .hero__logo {
    width: 56px;
    height: 56px;
  }

  .hero__title {
    font-size: 24px;
  }

  .hero__description {
    font-size: 13px;
  }
}
</style>
