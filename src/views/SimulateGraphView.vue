<template>
  <div class="data-workspace">
    <PageHeader
      title="Strategy Graph"
    />

    <div class="filter-bar">
      <div class="filter-bar-left">
        <el-select
          v-model="selectedStrategyId"
          aria-label="Strategy"
          clearable
          filterable
          placeholder="Select a strategy"
          class="strategy-select"
          @change="onStrategyIdChanged">
          <el-option
            v-for="s in strategies"
            :key="s.id"
            :label="s.name"
            :value="s.id" />
        </el-select>

        <el-button :loading="loading" type="primary" @click="reload">
          Refresh
        </el-button>
      </div>
    </div>

    <!-- Chart Section -->
    <div v-if="!selectedStrategyId" class="empty-state">
      <el-icon class="empty-icon"><TrendCharts /></el-icon>
      <p>Select a strategy to view its NAV performance graph</p>
    </div>

    <div v-else-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>Loading chart data...</span>
    </div>

    <div v-else-if="chartData.length <= 1" class="empty-state">
      <el-icon class="empty-icon"><Warning /></el-icon>
      <p>No data available for the selected strategy</p>
    </div>

    <div v-else class="chart-section">
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">Net asset value</h2>
          <div class="chart-stats">
            <div class="stat-item">
              <span class="stat-label">Annual return</span>
              <span :class="['stat-value', annualReturnClass]">{{ formatPercentage(annualReturn) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total return</span>
              <span :class="['stat-value', totalReturnClass]">{{ formatPercentage(totalReturn, true) }}</span>
            </div>
            <div v-if="benchmarkReturn !== null" class="stat-item">
              <span class="stat-label">S&amp;P 500 price return</span>
              <span class="stat-value">{{ formatPercentage(benchmarkReturn) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Final NAV</span>
              <span class="stat-value">{{ formatNumber(finalNav) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Trades</span>
              <span class="stat-value">{{ totalTrades }}</span>
            </div>
          </div>
          <p class="chart-basis">
            {{ chartData[1][0] }} to {{ chartData[chartData.length - 1][0] }}
            <template v-if="benchmarkReturn !== null">
              · Both series start at 1.0. S&amp;P 500 (^GSPC) price return excludes dividends and currency conversion. Fund NAV holds its last recorded value between exits.
            </template>
          </p>
          <p v-if="benchmarkNotice" class="chart-basis" role="status">{{ benchmarkNotice }}</p>
        </div>

        <div class="chart-wrapper">
          <LineChart
            :data="chartData"
            :height="500"
            :show-data-zoom="true"
            :smooth="false"
            color="#1976d2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { StrategyClient, RefStrategyTypeClient, StockPriceClient } from "@/core/services/marketWatchClient";
import PageHeader from "@/components/PageHeader.vue";
import LineChart from "@/components/charts/LineChart.vue";
import { TrendCharts, Loading, Warning } from '@element-plus/icons-vue';

import { compareBenchmark, marketDate } from "@/core/services/benchmarkComparison";

type AnyRow = Record<string, any>;

export default defineComponent({
  components: {
    PageHeader,
    LineChart,
    TrendCharts,
    Loading,
    Warning,
  },
  data() {
    return {
      rows: [] as AnyRow[],
      loading: false,
      loadVersion: 0,
      benchmarkNotice: "",
      benchmarkReturn: null as number | null,
      selectedStrategyId: "" as number | "",
      strategies: [] as Array<{ id: number; name: string; ratePerYear?: number | null }>,
      strategyTypeMap: new Map<string, string>(),
      chartData: [] as any[],
      totalTrades: 0,
      finalNav: 1.0,
      totalReturn: 0,
      annualReturn: 0,
    };
  },

  computed: {
    totalReturnClass(): string {
      if (this.totalReturn > 0) return "rate-positive";
      if (this.totalReturn < 0) return "rate-negative";
      return "";
    },
    annualReturnClass(): string {
      if (this.annualReturn > 0) return "rate-positive";
      if (this.annualReturn < 0) return "rate-negative";
      return "";
    },
  },

  methods: {
    async reload() {
      await this.loadData();
    },

    async onStrategyIdChanged() {
      await this.loadData();
    },

    async loadStrategyTypes() {
      try {
        const client = new RefStrategyTypeClient(undefined, ApiService.vueInstance.axios);
        const result = await client.refStrategyTypeGetList(undefined, 0, 1000);
        this.strategyTypeMap.clear();
        if (result.items) {
          for (const strategyType of result.items) {
            const typeId = (strategyType as any).id ?? (strategyType as any).Id;
            const typeName = (strategyType as any).name ?? (strategyType as any).Name;

            if (typeId !== undefined && typeName) {
              this.strategyTypeMap.set(String(typeId), typeName);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load strategy types", e);
      }
    },

    async loadStrategies() {
      try {
        const client = new StrategyClient(undefined, ApiService.vueInstance.axios);
        const result = await client.strategyGetList(undefined, 0, 1000);
        this.strategies = [];
        if (result.items) {
          for (const strategy of result.items) {
            const strategyId = (strategy as any).id ?? (strategy as any).Id;
            const strategyType = (strategy as any).strategyType ?? (strategy as any).StrategyType;
            const ratePerYear = (strategy as any).ratePerYear ?? (strategy as any).RatePerYear;
            const daysToTest = (strategy as any).daysToTest ?? (strategy as any).DaysToTest;

            if (strategyId !== undefined) {
              let displayName = `${strategyId}`;

              if (strategyType !== undefined && strategyType !== null) {
                const typeName = this.strategyTypeMap.get(String(strategyType))
                  ?? (Number(strategyType) === 6 ? "TimeSeriesMomentum" : undefined);
                if (typeName) {
                  displayName += ` - ${typeName}`;
                }
              }

              if (ratePerYear !== undefined && ratePerYear !== null) {
                const formattedReturn = (ratePerYear * 100).toFixed(2);
                displayName += ` - ${formattedReturn}%`;
              }

              if (daysToTest !== undefined && daysToTest !== null) {
                displayName += ` - Days to Test: ${daysToTest}`;
              }

              this.strategies.push({ id: strategyId, name: displayName, ratePerYear });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load strategies", e);
      }
    },

    async loadData() {
      const version = ++this.loadVersion;
      this.benchmarkNotice = "";
      this.benchmarkReturn = null;
      if (!this.selectedStrategyId) {
        this.loading = false;
        this.rows = [];
        this.chartData = [];
        this.totalTrades = 0;
        this.finalNav = 1.0;
        this.totalReturn = 0;
        this.annualReturn = 0;
        return;
      }

      this.loading = true;
      try {
        const baseParams: Record<string, any> = {
          StrategyId: this.selectedStrategyId
        };

        // Fetch all data in batches
        const batchSize = 1000;
        let allItems: AnyRow[] = [];
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
          const params = {
            ...baseParams,
            SkipCount: skip,
            MaxResultCount: batchSize,
          };

          const res = await ApiService.vueInstance.axios.get("/api/app/backtest-history", { params });
          const data = res.data;
          const payload = data?.result ?? data;

          let items: AnyRow[] = [];

          if (Array.isArray(payload)) {
            items = payload;
          } else if (Array.isArray(payload?.items)) {
            items = payload.items;
          } else {
            items = [];
          }

          allItems = allItems.concat(items);

          if (items.length < batchSize) {
            hasMore = false;
          } else {
            skip += batchSize;
          }
        }

        if (version !== this.loadVersion) return;
        this.rows = allItems;
        this.processChartData();
        await this.loadBenchmark(version);
      } catch (e) {
        if (version !== this.loadVersion) return;
        console.error("Failed to load backtest history", e);
        this.rows = [];
        this.chartData = [];
        this.totalTrades = 0;
        this.finalNav = 1.0;
        this.totalReturn = 0;
        this.annualReturn = 0;
      } finally {
        if (version === this.loadVersion) this.loading = false;
      }
    },

    async loadBenchmark(version: number) {
      if (this.chartData.length <= 1) return;
      const fund = this.chartData.slice(1) as [string, number][];
      const start = new Date(fund[0][0]);
      start.setDate(start.getDate() - 7);
      const end = new Date(fund[fund.length - 1][0]);
      try {
        const client = new StockPriceClient(undefined, ApiService.vueInstance.axios);
        const prices = [];
        let skip = 0;
        while (true) {
          const page = await client.stockPriceGetStockPriceWithDetails('date asc', skip, 1000, '^GSPC', start, end);
          if (version !== this.loadVersion) return;
          const items = page.items ?? [];
          prices.push(...items.map(p => ({ date: marketDate(p.date!), closePrice: p.closePrice! })));
          skip += items.length;
          if (!items.length || skip >= (page.totalCount ?? 0)) break;
        }
        const comparison = compareBenchmark(fund, prices);
        this.chartData = [['Date', 'Fund NAV', 'S&P 500'], ...comparison.rows];
        this.benchmarkReturn = comparison.totalReturn;
      } catch (error) {
        if (version !== this.loadVersion) return;
        this.benchmarkNotice = error instanceof Error && error.message.startsWith('S&P 500 prices')
          ? error.message : 'Unable to load S&P 500 prices. The fund chart is shown without the benchmark.';
      }
    },

    processChartData() {
      if (!this.rows || this.rows.length === 0) {
        this.chartData = [];
        this.totalTrades = 0;
        this.finalNav = 1.0;
        this.totalReturn = 0;
        this.annualReturn = 0;
        return;
      }

      // Find the history fields used to build the portfolio NAV chart.
      const sampleRow = this.rows[0];
      const keys = Object.keys(sampleRow || {});
      const tradeDateKey = keys.find((k) => k.toLowerCase() === "tradedate") || "";
      const sellDateKey = keys.find((k) => k.toLowerCase() === "selldate") || "";
      const navKey = keys.find((k) => k.toLowerCase() === "nav") || "";
      const idKey = keys.find((k) => k.toLowerCase() === "id") || "";
      const rateOfReturnKey = keys.find((k) => k.toLowerCase() === "rateofreturn" || k.toLowerCase() === "rateorreturn") || "";
      const dateKey = sellDateKey || tradeDateKey || keys.find((k) => k.toLowerCase().includes("date")) || "";
      const hasStoredNav = !!navKey && this.rows.every((row) =>
        row[navKey] !== null && row[navKey] !== undefined && Number.isFinite(Number(row[navKey]))
      );

      if (!dateKey || (!hasStoredNav && !rateOfReturnKey)) {
        console.warn("Missing required fields for chart");
        this.chartData = [];
        return;
      }

      // Trade IDs preserve the order of NAV snapshots when several positions
      // exit on the same date. Grouping below keeps the final snapshot per day.
      const sortedRows = [...this.rows].sort((a, b) => {
        const aDate = new Date(a[dateKey] ?? a[tradeDateKey]).getTime();
        const bDate = new Date(b[dateKey] ?? b[tradeDateKey]).getTime();
        if (aDate !== bDate) return aDate - bDate;
        return idKey ? Number(a[idKey]) - Number(b[idKey]) : 0;
      });

      const navPoints: [string, number][] = [];
      let currentNav = 1.0;

      if (hasStoredNav) {
        const dailyNav = new Map<number, number>();
        for (const row of sortedRows) {
          const date = row[dateKey] ?? row[tradeDateKey];
          if (date) {
            dailyNav.set(new Date(date).getTime(), Number(row[navKey]));
          }
        }

        const entryDates = tradeDateKey
          ? sortedRows.map((row) => new Date(row[tradeDateKey]).getTime()).filter(Number.isFinite)
          : [];
        const firstEntryDate = entryDates.length > 0
          ? new Date(Math.min(...entryDates))
          : new Date(dailyNav.keys().next().value);
        navPoints.push([firstEntryDate.toISOString().slice(0, 10), 1.0]);
        for (const [timestamp, nav] of dailyNav) {
          navPoints.push([new Date(timestamp).toISOString().slice(0, 10), nav]);
        }
        const lastNav = Array.from(dailyNav.values()).pop();
        currentNav = lastNav ?? 1.0;
      } else {
        // Fallback for history responses without persisted portfolio NAV.
        const firstDate = new Date(sortedRows[0][dateKey] ?? sortedRows[0][tradeDateKey]);
        navPoints.push([firstDate.toISOString().slice(0, 10), 1.0]);
        for (const row of sortedRows) {
          const date = row[dateKey] ?? row[tradeDateKey];
          const rateOfReturn = Number(row[rateOfReturnKey]);
          if (date && Number.isFinite(rateOfReturn)) {
            currentNav *= 1 + rateOfReturn;
            navPoints.push([new Date(date).toISOString().slice(0, 10), currentNav]);
          }
        }
      }

      // Prepare data for LineChart (first row is headers)
      this.chartData = [
        ['Date', 'Fund NAV'],
        ...navPoints
      ];

      this.totalTrades = sortedRows.length;
      this.finalNav = currentNav;
      this.totalReturn = currentNav - 1.0;

      // Estimate annual return only when strategy metadata is unavailable.
      if (sortedRows.length > 0) {
        const entryDates = tradeDateKey
          ? sortedRows.map((row) => new Date(row[tradeDateKey]).getTime()).filter(Number.isFinite)
          : sortedRows.map((row) => new Date(row[dateKey] ?? row[tradeDateKey]).getTime()).filter(Number.isFinite);
        const firstDate = new Date(Math.min(...entryDates));
        const lastRow = sortedRows[sortedRows.length - 1];
        const lastDate = new Date(lastRow[dateKey] ?? lastRow[tradeDateKey]);
        const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        const years = daysDiff / 365.25;

        if (years > 0) {
          this.annualReturn = Math.pow(currentNav, 1 / years) - 1.0;
        } else {
          this.annualReturn = 0;
        }
      } else {
        this.annualReturn = 0;
      }

      // The strategy's persisted annual return uses its full DaysToTest period.
      // Trade dates alone can make the plotted history's period look much shorter.
      const selectedStrategy = this.strategies.find(
        (strategy) => strategy.id === Number(this.selectedStrategyId)
      );
      if (selectedStrategy?.ratePerYear !== undefined && selectedStrategy.ratePerYear !== null) {
        this.annualReturn = selectedStrategy.ratePerYear;
      }
    },

    formatNumber(value: number): string {
      return value.toFixed(3);
    },

    formatPercentage(value: number, useGrouping = false): string {
      const percentage = (value * 100).toLocaleString('en-US', {
        useGrouping,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return value >= 0 ? `+${percentage}%` : `${percentage}%`;
    },
  },

  async mounted() {
    // Check if strategyId is passed via query params
    const queryStrategyId = this.$route.query.strategyId;
    if (queryStrategyId) {
      this.selectedStrategyId = parseInt(queryStrategyId as string, 10);
    }

    // Load strategy types first, then strategies
    await this.loadStrategyTypes();
    await this.loadStrategies();
    await this.loadData();
  },
});
</script>

<style scoped>
.filter-bar {
  margin-bottom: 0.75rem;
}

.filter-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.strategy-select {
  width: 20rem;
  min-width: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-3xl);
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-xl);
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: var(--space-5xl);
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  text-align: center;
}

.loading-state .el-icon {
  font-size: 2.5rem;
  color: var(--color-primary);
}

.loading-state span {
  font-size: 1rem;
  color: var(--color-text-secondary);
}

/* Chart Section */
.chart-card {
  min-width: 0;
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 0.75rem;
}

.chart-header {
  margin-bottom: 0.5rem;
}

.chart-title {
  font-size: 1rem;
  line-height: 1.4;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem;
}

.chart-stats {
  display: flex;
  gap: 0.5rem 1.25rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-heading);
}

.chart-basis {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  margin: 0.5rem 0 0;
}

@media (max-width: 600px) {
  .strategy-select {
    flex: 1;
  }

  .filter-bar-left > .el-button {
    flex: none;
  }
}
</style>
