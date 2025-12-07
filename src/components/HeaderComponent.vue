<script setup lang="ts">
defineProps<{
  msg: string;
}>();
</script>

<template>
  <div class="brand-header">
    <div class="brand-logo">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="url(#gradient)"/>
        <path d="M8 20L12 12L16 16L20 10L24 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1976d2"/>
            <stop offset="1" stop-color="#1565c0"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="brand-text">
      <h1 class="brand-name">{{ msg }}</h1>
    </div>
  </div>
</template>

<style scoped>
.brand-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1;
}

@media (max-width: 768px) {
  .brand-name {
    font-size: 1.25rem;
  }
}
</style>
