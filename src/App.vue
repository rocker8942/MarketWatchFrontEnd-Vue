<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import Header from "./components/HeaderComponent.vue";
import { ArrowDown, TrendCharts } from '@element-plus/icons-vue';
import { ref, onMounted, onUnmounted } from 'vue';

// Market status indicator
const currentTime = ref(new Date());
const isMarketOpen = ref(false);

const updateTime = () => {
  currentTime.value = new Date();
  const hours = currentTime.value.getHours();
  const day = currentTime.value.getDay();
};

let timeInterval: number;
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 60000); // Update every minute
});

onUnmounted(() => {
  clearInterval(timeInterval);
});
</script>

<template>
  <div class="app-layout">
    <!-- Market Status Banner -->
    <div class="market-status-banner">
      <div class="banner-container">
        <div class="market-time">
          {{ currentTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
        </div>
      </div>
    </div>

    <!-- Top Navigation Bar -->
    <header class="top-nav">
      <div class="nav-container">
        <div class="brand">
          <Header msg="MarketWatch" />
        </div>

        <nav class="main-nav">
          <RouterLink to="/" class="nav-link">
            <el-icon><TrendCharts /></el-icon>
            <span>Dashboard</span>
          </RouterLink>
          <el-dropdown trigger="hover" class="nav-dropdown">
            <span class="nav-link dropdown-trigger">
              <span>Markets</span>
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
          <el-dropdown trigger="hover" class="nav-dropdown">
            <span class="nav-link dropdown-trigger">
              <span>Fund</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <RouterLink to="/fund" class="dropdown-link">Analysis</RouterLink>
                </el-dropdown-item>
                <el-dropdown-item>
                  <RouterLink to="/strategyHistory" class="dropdown-link">Strategy History</RouterLink>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="hover" class="nav-dropdown">
            <span class="nav-link dropdown-trigger">
              <span>Simulate</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <RouterLink to="/simulate/run" class="dropdown-link">Run Simulation</RouterLink>
                </el-dropdown-item>
                <el-dropdown-item>
                  <RouterLink to="/simulate/strategy" class="dropdown-link">Strategies</RouterLink>
                </el-dropdown-item>
                <el-dropdown-item>
                  <RouterLink to="/simulate/backtest-history" class="dropdown-link">Backtest History</RouterLink>
                </el-dropdown-item>
                <el-dropdown-item>
                  <RouterLink to="/simulate/graph" class="dropdown-link">Graph</RouterLink>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="hover" class="nav-dropdown">
            <span class="nav-link dropdown-trigger">
              <span>Optimize</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <RouterLink to="/optimization/config" class="dropdown-link">New Optimization</RouterLink>
                </el-dropdown-item>
                <el-dropdown-item>
                  <RouterLink to="/optimization/monitor" class="dropdown-link">Monitor Jobs</RouterLink>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

    <!-- Professional Footer -->
    <footer class="site-footer">
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-section">
            <h4 class="footer-heading">MarketWatch</h4>
            <p class="footer-description">
              Professional market intelligence and trading insights for informed investment decisions.
            </p>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Markets</h4>
            <ul class="footer-links">
              <li><RouterLink to="/">Dashboard</RouterLink></li>
              <li><RouterLink to="/stockPrice">Price List</RouterLink></li>
              <li><RouterLink to="/stockChart">Charts</RouterLink></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Resources</h4>
            <ul class="footer-links">
              <li><RouterLink to="/fund">Analysis</RouterLink></li>
              <li><RouterLink to="/simulate/run">Simulate</RouterLink></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Legal</h4>
            <ul class="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="copyright">&copy; {{ new Date().getFullYear() }} MarketWatch. All rights reserved.</p>
          <p class="disclaimer">Investment involves risk. Past performance is not indicative of future results.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

/* Market Status Banner - Minimalist */
.market-status-banner {
  background: var(--finance-navy);
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 0.5rem 0;
}

.banner-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.market-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.open {
  background: var(--finance-green-light);
  box-shadow: 0 0 8px var(--finance-green-light);
}

.status-dot.closed {
  background: var(--finance-gray-400);
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.status-text {
  color: var(--color-white);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.market-time {
  color: var(--finance-gray-200);
  font-size: 0.875rem;
}

/* Top Navigation - Minimalist */
.top-nav {
  background: var(--color-background-card);
  border-bottom: 1px solid var(--color-border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-subtle);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link .el-icon {
  font-size: 1.125rem;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-variant);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background: rgba(25, 118, 210, 0.08);
  font-weight: 600;
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
  color: #374151;
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
  padding: 0.625rem 1.5rem;
  background: transparent;
  border: 1.5px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.signout-btn:hover {
  background: var(--finance-red);
  border-color: var(--finance-red);
  color: white;
  box-shadow: var(--shadow-sm);
}

/* Main Content */
.main-content {
  flex: 1;
}

/* Professional Footer */
.site-footer {
  background: var(--finance-navy);
  color: var(--finance-gray-200);
  margin-top: 4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 1.5rem 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2.5rem;
  margin-bottom: 2.5rem;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-heading {
  color: var(--color-white);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.footer-description {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--finance-gray-300);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.footer-links a {
  color: var(--finance-gray-300);
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--finance-blue-light);
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  text-align: center;
}

.copyright {
  font-size: 0.875rem;
  color: var(--finance-gray-300);
}

.disclaimer {
  font-size: 0.75rem;
  color: var(--finance-gray-400);
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .banner-container {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
  }

  .market-time {
    font-size: 0.75rem;
  }

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

  .nav-link .el-icon {
    display: none;
  }

  .nav-actions {
    margin-left: 0.75rem;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .footer-bottom {
    flex-direction: column;
  }
}
</style>
