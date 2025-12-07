<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import Header from "./components/HeaderComponent.vue";
</script>

<template>
  <div class="app-layout">
    <!-- Top Navigation Bar -->
    <header class="top-nav">
      <div class="nav-container">
        <div class="brand">
          <Header msg="MarketWatch" />
        </div>

        <nav class="main-nav">
          <RouterLink to="/" class="nav-link">
            <span>Dashboard</span>
          </RouterLink>
          <RouterLink to="/stockPrice" class="nav-link">
            <span>Stock Prices</span>
          </RouterLink>
          <RouterLink to="/StockList" class="nav-link">
            <span>Stock List</span>
          </RouterLink>
          <RouterLink to="/strategy" class="nav-link">
            <span>Strategy</span>
          </RouterLink>
          <RouterLink to="/about" class="nav-link">
            <span>About</span>
          </RouterLink>
        </nav>

        <div class="nav-actions">
          <button
            v-if="$oidc.isAuthenticated"
            @click="$oidc.signOut"
            class="signout-btn">
            Sign Out
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-background);
}

/* Top Navigation */
.top-nav {
  background: var(--color-background-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  background: rgba(var(--color-background-card), 0.95);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand {
  flex-shrink: 0;
  margin-right: 3rem;
}

/* Main Navigation */
.main-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.nav-link {
  position: relative;
  padding: 0.625rem 1rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-variant);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background: rgba(25, 118, 210, 0.1);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}

/* Navigation Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1rem;
}

.signout-btn {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.signout-btn:hover {
  background: var(--color-surface-variant);
  border-color: var(--color-border-strong);
}

/* Main Content */
.main-content {
  min-height: calc(100vh - 64px);
}

/* Responsive */
@media (max-width: 768px) {
  .nav-container {
    flex-wrap: wrap;
    height: auto;
    padding: 0.75rem 1rem;
  }

  .brand {
    margin-right: auto;
  }

  .main-nav {
    order: 3;
    width: 100%;
    margin-top: 0.75rem;
    gap: 0.5rem;
    overflow-x: auto;
  }

  .nav-link {
    white-space: nowrap;
    font-size: 0.875rem;
    padding: 0.5rem 0.875rem;
  }

  .nav-actions {
    margin-left: 0.75rem;
  }
}
</style>
