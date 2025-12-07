<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import Header from "./components/HeaderComponent.vue";
import { ArrowDown } from '@element-plus/icons-vue';
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
          <el-dropdown trigger="hover" class="nav-dropdown">
            <span class="nav-link dropdown-trigger">
              <span>Stock Prices</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <RouterLink to="/stockPrice" class="dropdown-link">Price List</RouterLink>
                </el-dropdown-item>
                <el-dropdown-item>
                  <RouterLink to="/stockChart" class="dropdown-link">Stock Chart</RouterLink>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

/* Dropdown Menu */
.nav-dropdown {
  display: inline-block;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.dropdown-icon {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.nav-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-link {
  display: block;
  width: 100%;
  color: var(--color-text);
  font-size: 0.9375rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.dropdown-link:hover {
  color: var(--color-primary);
}

.dropdown-link.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
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
