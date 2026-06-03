<template>
  <main class="about-window">
    <section class="about-card">
      <p class="about-card__eyebrow">AssemblerJS Electron</p>
      <h1 class="about-card__title">About This Example</h1>
      <p class="about-card__body">
        This window is opened through the @UseMenu binding provided by the About module.
      </p>
      <dl class="about-card__meta">
        <div>
          <dt>Window</dt>
          <dd>about</dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>/about</dd>
        </div>
        <div>
          <dt>Menu source</dt>
          <dd>AboutMenu</dd>
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
  background:
    radial-gradient(circle at top left, rgba(41, 98, 255, 0.18), transparent 42%),
    linear-gradient(160deg, #0f172a 0%, #111827 52%, #172554 100%);
}

.about-card {
  width: min(100%, 420px);
  border-radius: 20px;
  padding: 28px;
  color: #e5eefb;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
}

.about-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #93c5fd;
}

.about-card__title {
  margin: 0;
  font-size: 32px;
  line-height: 1.05;
}

.about-card__body {
  margin: 14px 0 22px;
  line-height: 1.6;
  color: #cbd5e1;
}

.about-card__meta {
  display: grid;
  gap: 12px;
  margin: 0;
}

.about-card__meta div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.about-card__meta dt {
  font-weight: 600;
  color: #93c5fd;
}

.about-card__meta dd {
  margin: 0;
  color: #e2e8f0;
}
</style>
