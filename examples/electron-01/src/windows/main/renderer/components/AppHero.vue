<template>
  <header class="hero">
    <div class="hero__brand">
      <img alt="logo" class="hero__logo" src="@renderer/assets/electron.svg" />
      <div>
        <p class="hero__powered">Powered by electron-vite</p>
        <h1 class="hero__title">
          Build desktop apps with
          <span class="vue">assemblerjs</span>
          and
          <span class="ts">electron-vite</span>
        </h1>
        <p class="hero__description">
          Renderer-side architecture with typed decorators, scoped window services, and strict
          preload channels.
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 6px 2px;
}

.hero__brand {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
}

.hero__logo {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.hero__powered {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ev-c-text-2);
}

.hero__title {
  margin: 0;
  max-width: 680px;
  font-size: 30px;
  line-height: 1.15;
  color: var(--ev-c-text-1);
}

.hero__description {
  margin: 10px 0 0;
  max-width: 700px;
  color: var(--ev-c-text-2);
  font-size: 14px;
  line-height: 1.45;
}

@media (max-width: 620px) {
  .hero {
    flex-direction: column;
  }

  .hero__logo {
    width: 56px;
    height: 56px;
  }

  .hero__title {
    font-size: 24px;
  }
}
</style>
