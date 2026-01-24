<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Market Dashboard</h1>
      <p class="subtitle">Real-time market data and performance metrics</p>
    </div>

    <!-- Key Metrics Summary -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">S&P 500</div>
        <div class="metric-value">{{ formatValue(getSPXLatest()) }}</div>
        <div class="metric-change positive">
          <span class="change-icon">↑</span>
          <span>+0.85%</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">FTSE 100</div>
        <div class="metric-value">{{ formatValue(getFTSELatest()) }}</div>
        <div class="metric-change positive">
          <span class="change-icon">↑</span>
          <span>+0.42%</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Gold (GLD)</div>
        <div class="metric-value">{{ formatValue(getGoldLatest()) }}</div>
        <div class="metric-change negative">
          <span class="change-icon">↓</span>
          <span>-0.23%</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">US Dollar (UUP)</div>
        <div class="metric-value">{{ formatValue(getDollarLatest()) }}</div>
        <div class="metric-change positive">
          <span class="change-icon">↑</span>
          <span>+0.15%</span>
        </div>
      </div>
    </div>

    <!-- Market Indices -->
    <div class="section">
      <h2 class="section-title">
        Global Indices
      </h2>
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">S&P 500</h3>
            <span class="chart-code">^GSPC</span>
          </div>
          <LineChart v-if="data" :data="data" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">FTSE 100</h3>
            <span class="chart-code">^FTSE</span>
          </div>
          <LineChart v-if="ftse" :data="ftse" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">China</h3>
            <span class="chart-code">FXI</span>
          </div>
          <LineChart v-if="china" :data="china" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
      </div>
    </div>

    <!-- Regional Markets -->
    <div class="section">
      <h2 class="section-title">
        Regional Markets
      </h2>
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Korea</h3>
            <span class="chart-code">EWY</span>
          </div>
          <LineChart v-if="korea" :data="korea" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Australia</h3>
            <span class="chart-code">EWA</span>
          </div>
          <LineChart v-if="australia" :data="australia" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">US Dollar</h3>
            <span class="chart-code">UUP</span>
          </div>
          <LineChart v-if="dollar" :data="dollar" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
      </div>
    </div>

    <!-- Commodities & Bonds -->
    <div class="section">
      <h2 class="section-title">
        Commodities & Fixed Income
      </h2>
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Gold</h3>
            <span class="chart-code">GLD</span>
          </div>
          <LineChart v-if="gold" :data="gold" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">30-Year Treasury</h3>
            <span class="chart-code">^TYX</span>
          </div>
          <LineChart v-if="tbond" :data="tbond" :height="320" />
          <div v-else class="chart-loading">Loading...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import LineChart from "../components/charts/LineChart.vue";
import ApiService from "@/core/services/apiService";
import { StockPriceClient, StockChartDto } from "@/core/services/marketWatchClient";

export default {
  name: "App",
  components: {
    LineChart,
  },
  data() {
    return {
      data: '',
      ftse: null,
      china: null,
      korea: null,
      australia: null,
      dollar: null,
      gold: null,
      tbond: null,
    };
  },

  async mounted() {
    this.data = await this.getData("^GSPC");
    this.ftse = await this.getData("^FTSE");
    this.china = await this.getData("FXI");
    this.korea = await this.getData("EWY");
    this.australia = await this.getData("EWA");
    this.dollar = await this.getData("UUP");
    this.gold = await this.getData("GLD");
    this.tbond = await this.getData("^TYX");
  },

  methods: {
    async getData(code: string) {
      // get stockPrice list
      const stockClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
      const response = await stockClient.stockPriceGetStockPriceByCode(`date asc`, 1, 1000, code);
      const prices = (response as StockChartDto[]).slice().reverse();

      if (!prices || prices.length === 0) {
        return;
      }

      return [
        ...[["Date", "Price"]],
        ...prices.map((item) => [item.date, item.adjClosePrice])
      ];
    },
    formatValue(value: any) {
      if (!value) return '—';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    },
    getSPXLatest() {
      return this.data && this.data.length > 1 ? this.data[this.data.length - 1][1] : null;
    },
    getFTSELatest() {
      return this.ftse && this.ftse.length > 1 ? this.ftse[this.ftse.length - 1][1] : null;
    },
    getGoldLatest() {
      return this.gold && this.gold.length > 1 ? this.gold[this.gold.length - 1][1] : null;
    },
    getDollarLatest() {
      return this.dollar && this.dollar.length > 1 ? this.dollar[this.dollar.length - 1][1] : null;
    }
  },
};

</script>

<style scoped>
.dashboard {
  padding: var(--space-4xl) var(--space-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.0625rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Metrics Grid - Minimalist */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-4xl);
}

.metric-card {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: var(--space-2xl);
  box-shadow: var(--shadow-subtle);
  transition: all 0.2s ease;
}

.metric-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

.metric-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
  font-variant-numeric: tabular-nums;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  font-weight: 600;
}

.metric-change.positive {
  color: var(--finance-green-light);
}

.metric-change.negative {
  color: var(--finance-red-light);
}

.change-icon {
  font-size: 1.125rem;
}

/* Sections - Minimalist */
.section {
  margin-bottom: var(--space-5xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border-subtle);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: var(--space-2xl);
}

.chart-card {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: var(--space-2xl);
  box-shadow: var(--shadow-subtle);
  transition: all 0.2s ease;
  overflow: hidden;
}

.chart-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.chart-code {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface-variant);
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.chart-loading {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 1rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 1.5rem 1rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 0.9375rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .metric-card {
    padding: 1.25rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .chart-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-card {
    padding: 1rem;
  }
}

@media (min-width: 1024px) {
  .dashboard {
    padding: 3rem 2rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .chart-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
