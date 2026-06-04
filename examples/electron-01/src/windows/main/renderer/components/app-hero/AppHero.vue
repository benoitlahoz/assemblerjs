<template>
  <header class="hero">
    <div class="hero__brand">
      <div class="hero__content">
        <div class="hero__layout">
          <div class="hero__text">
            <p class="hero__eyebrow">AssemblerJS Electron Playground</p>
            <h1 class="hero__title">Full-Duplex Electron</h1>
          </div>
          <div class="hero__chips" aria-hidden="true">
            <span class="hero__chip">Unified DI</span>
            <span class="hero__chip">Type-Safe IPC</span>
            <span class="hero__chip">Custom Title Bar</span>
          </div>
        </div>
        <p class="hero__description">
          A comprehensive AssemblerJS playground demonstrating unified dependency injection,
          decorator-powered IPC, and seamless communication across Electron's main, renderer, and
          preload processes. Explore real-time system monitoring, custom window controls, and
          type-safe command patterns.
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  display: block;
  padding: 0;
}

.hero__brand {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: left;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid transparent;
  background: transparent;
}

.hero__content {
  min-width: 0;
}

.hero__layout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
}

.hero__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.hero__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ev-c-text-2);
}

.hero__title {
  margin: 0;
  max-width: 760px;
  font-size: 22px;
  line-height: 1.15;
  color: var(--ev-c-text-1);
}

.hero__description {
  margin: 10px 0 0;
  max-width: 66%;
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.35;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
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

@media (max-width: 980px) {
  .hero__description {
    max-width: 100%;
  }
}

@media (max-width: 1200px) {
  .hero__chips {
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
}

@media (max-width: 620px) {
  .hero__brand {
    align-items: flex-start;
    padding: 0;
  }

  .hero__title {
    font-size: 20px;
  }

  .hero__description {
    font-size: 13px;
  }

  .hero__chip {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>
