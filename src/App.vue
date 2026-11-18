<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { ArrowDown } from "@element-plus/icons-vue";
import Header from "./components/HeaderComponent.vue";

const route = useRoute();
const router = useRouter();
const mobileMenu = ref<HTMLDetailsElement>();
const currentTime = ref(new Date());
let timeInterval: ReturnType<typeof setInterval>;

const groups = [
  { label: "Markets", links: [
    { to: "/stockPrice", label: "Stock Prices" },
    { to: "/stockChart", label: "Stock Chart" },
    { to: "/movers", label: "Movers" },
  ] },
  { label: "Fund", links: [
    { to: "/fund", label: "Fund Strategy" },
    { to: "/strategyHistory", label: "Strategy History" },
  ] },
  { label: "Simulate", links: [
    { to: "/simulate/run", label: "Run Simulation" },
    { to: "/simulate/strategy", label: "Strategies" },
    { to: "/simulate/backtest-history", label: "Backtest History" },
    { to: "/simulate/graph", label: "Strategy Graph" },
  ] },
  { label: "Optimize", links: [
    { to: "/optimization/config", label: "New Optimization" },
    { to: "/optimization/monitor", label: "Monitor Jobs" },
  ] },
];

function closeMobileMenu() {
  if (mobileMenu.value) mobileMenu.value.open = false;
}

async function onMobileEscape() {
  closeMobileMenu();
  await nextTick();
  mobileMenu.value?.querySelector("summary")?.focus();
}

onMounted(() => {
  timeInterval = setInterval(() => { currentTime.value = new Date(); }, 60000);
});
onUnmounted(() => clearInterval(timeInterval));
</script>

<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-container">
        <RouterLink to="/" class="brand" @click="closeMobileMenu">
          <Header msg="MarketWatch" />
        </RouterLink>

        <nav class="desktop-nav" aria-label="Main navigation">
          <RouterLink to="/" class="nav-link">Dashboard</RouterLink>
          <el-dropdown v-for="group in groups" :key="group.label" trigger="click" @command="router.push">
            <button
              type="button"
              class="nav-link"
              :class="{ 'nav-active': group.links.some(link => link.to === route.path) }"
            >
              {{ group.label }} <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="link in group.links"
                  :key="link.to"
                  :command="link.to"
                  :class="{ 'nav-active': route.path === link.to }"
                >
                  {{ link.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>

        <div class="nav-actions">
          <time class="nav-time" :datetime="currentTime.toISOString()">
            {{ currentTime.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }}
          </time>
          <button v-if="$oidc.isAuthenticated" type="button" class="signout-btn" @click="$oidc.signOut">
            Sign out
          </button>
          <details ref="mobileMenu" class="mobile-menu" @keydown.esc.stop="onMobileEscape">
            <summary>Menu <el-icon><ArrowDown /></el-icon></summary>
            <nav class="mobile-links" aria-label="Main navigation">
              <RouterLink to="/" class="nav-link" @click="closeMobileMenu">Dashboard</RouterLink>
              <div v-for="group in groups" :key="group.label" class="mobile-group">
                <p>{{ group.label }}</p>
                <RouterLink v-for="link in group.links" :key="link.to" :to="link.to" class="nav-link" @click="closeMobileMenu">
                  {{ link.label }}
                </RouterLink>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>

    <main class="main-content"><RouterView /></main>

    <footer class="site-footer">
      <span>© {{ new Date().getFullYear() }} MarketWatch</span>
      <span>Investment involves risk. Past performance is not indicative of future results.</span>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-background-card);
  border-bottom: 1px solid var(--color-border);
}

.nav-container {
  max-width: 1600px;
  margin-inline: auto;
  padding-inline: var(--workspace-gutter);
  min-height: 51px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  flex-shrink: 0;
}

.desktop-nav,
.nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-actions {
  margin-left: auto;
  gap: 8px;
}

.nav-link,
.signout-btn,
.mobile-menu summary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border-radius: 5px;
  color: var(--color-text);
  background: transparent;
  border: 0;
  white-space: nowrap;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.nav-link:hover,
.nav-link.router-link-exact-active,
.nav-active,
.mobile-menu summary:hover {
  color: var(--color-primary);
  background: var(--color-surface-variant);
}

.nav-time {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.signout-btn {
  border: 1px solid var(--color-border);
}

.main-content {
  flex: 1;
  min-width: 0;
}

.site-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 16px;
  padding: 8px var(--workspace-gutter);
  margin-top: 16px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.mobile-menu {
  display: none;
}

@media (max-width: 900px) {
  .nav-container {
    gap: 8px;
  }

  .desktop-nav,
  .nav-time {
    display: none;
  }

  .mobile-menu {
    display: block;
  }

  .mobile-menu summary::-webkit-details-marker {
    display: none;
  }

  .mobile-menu summary,
  .signout-btn {
    min-height: 36px;
  }

  .mobile-links {
    position: absolute;
    inset: 100% var(--workspace-gutter) auto auto;
    z-index: 1;
    width: min(290px, calc(100vw - 2 * var(--workspace-gutter)));
    max-height: calc(100dvh - 56px);
    overflow-y: auto;
    padding: 6px;
    background: var(--color-background-card);
    border: 1px solid var(--color-border);
    border-radius: 0 0 8px 8px;
    box-shadow: var(--shadow-md);
  }

  .mobile-links .nav-link {
    min-height: 36px;
  }

  .mobile-group {
    padding-top: 4px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .mobile-group p {
    margin: 0;
    padding-inline: 9px;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 600;
  }
}
</style>
