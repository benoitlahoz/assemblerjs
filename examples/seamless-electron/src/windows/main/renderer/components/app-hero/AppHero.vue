<template>
  <header class="hero">
    <div class="hero__brand">
      <div class="hero__content">
        <div class="hero__text">
          <p class="hero__eyebrow">AssemblerJS Electron Playground</p>
          <h1 class="hero__title">Seamless Electron</h1>
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
  font-size: 22px;
  line-height: 1.15;
  color: var(--ev-c-text-1);
}

.hero__description {
  margin: 10px 0 0;
  color: var(--ev-c-text-2);
  font-size: 13px;
  line-height: 1.35;
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
}
</style>
