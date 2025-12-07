<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Market Dashboard</h1>
      <p class="subtitle">Real-time market data and performance metrics</p>
    </div>

    <!-- Market Indices -->
    <div class="section">
      <h2 class="section-title">Global Indices</h2>
      <div class="chart-grid">
        <div class="chart-card">
          <GoogleChart :data="data" :width="400" :height="300" :title="'S&P 500'" />
        </div>
        <div class="chart-card">
          <GoogleChart :data="ftse" :width="400" :height="300" :title="'FTSE 100'" />
        </div>
        <div class="chart-card">
          <GoogleChart :data="china" :width="400" :height="300" :title="'China'" />
        </div>
      </div>
    </div>

    <!-- Regional Markets -->
    <div class="section">
      <h2 class="section-title">Regional Markets</h2>
      <div class="chart-grid">
        <div class="chart-card">
          <GoogleChart :data="korea" :width="400" :height="300" :title="'Korea'" />
        </div>
        <div class="chart-card">
          <GoogleChart :data="australia" :width="400" :height="300" :title="'Australia'" />
        </div>
        <div class="chart-card">
          <GoogleChart :data="dollar" :width="400" :height="300" :title="'US Dollar'" />
        </div>
      </div>
    </div>

    <!-- Commodities & Bonds -->
    <div class="section">
      <h2 class="section-title">Commodities & Fixed Income</h2>
      <div class="chart-grid">
        <div class="chart-card">
          <GoogleChart :data="gold" :width="400" :height="300" :title="'Gold'" />
        </div>
        <div class="chart-card">
          <GoogleChart :data="tbond" :width="400" :height="300" :title="'T-bond 30years'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import GoogleChart from "../components/GoogleChart";
import ApiService from "@/core/services/apiService";
import { StockPriceClient, PagedResultDtoOfStockPriceDto, StockChartDto } from "@/core/services/marketWatchClient";

export default {
  name: "App",
  components: {
    GoogleChart,
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
      const response = await stockClient.stockPriceGetStockPriceByCode(`date desc`, 1, 1000, code);
      const prices = response as StockChartDto[];

      if (!prices || prices.length === 0) {
        return;
      }

      return [
        ...[["Date", "Price"]],
        ...prices.map((item) => [item.date, item.adjClosePrice])
      ];
    }
  },
};

</script>

<style scoped>
.dashboard {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.chart-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 1.5rem 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.75rem;
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

  .chart-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
