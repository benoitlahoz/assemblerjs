<template>
  <main class="about-window">
    <section class="about-card">
      <p class="about-card__eyebrow">AssemblerJS Electron Playground</p>
      <h1 class="about-card__title">Seamless Electron</h1>
      <p class="about-card__body">
        Break the process barrier. This example demonstrates unified dependency injection and
        decorator-powered IPC across main, renderer, and preload processes.
      </p>
      <dl class="about-card__meta">
        <div>
          <dt>Architecture</dt>
          <dd>Unified DI</dd>
        </div>
        <div>
          <dt>IPC Pattern</dt>
          <dd>Type-Safe Decorators</dd>
        </div>
        <div>
          <dt>Window Control</dt>
          <dd>Custom Title Bar API</dd>
        </div>
      </dl>
    </section>
  </main>
</template>

<style scoped>
.about-window {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  background: var(--ev-c-bg);
}

.about-card {
  width: min(100%, 480px);
  border-radius: 16px;
  padding: 32px;
  text-align: left;
  color: var(--ev-c-text-1);
  background:
    radial-gradient(120% 180% at 0% 0%, rgba(88, 166, 255, 0.18), transparent 58%),
    color-mix(in srgb, var(--ev-c-black-soft) 45%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 20%, transparent);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.about-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ev-c-text-2);
}

.about-card__title {
  margin: 0;
  font-size: 32px;
  line-height: 1.12;
  color: var(--ev-c-text-1);
}

.about-card__body {
  margin: 12px 0 24px;
  line-height: 1.6;
  color: var(--ev-c-text-2);
  font-size: 14px;
}

.about-card__meta {
  display: grid;
  gap: 12px;
  margin: 0;
}

.about-card__meta div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--ev-c-black-soft) 50%, transparent);
  border: 1px solid color-mix(in srgb, var(--ev-c-text-3) 16%, transparent);
}

.about-card__meta dt {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ev-c-text-2);
}

.about-card__meta dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ev-c-text-1);
}
</style>
