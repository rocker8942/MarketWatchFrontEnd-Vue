<template>
  <div class="simulate-graph-container">
    <PageHeader
      title="Simulate - Strategy Graph"
      subtitle="Visualize backtest strategy performance with NAV over time"
    />

    <div class="filter-bar">
      <div class="filter-bar-left">
        <el-select
          v-model="selectedStrategyId"
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
          <h3 class="chart-title">Net Asset Value (NAV) Over Time</h3>
          <div class="chart-stats">
            <div class="stat-item">
              <span class="stat-label">Total Trades:</span>
              <span class="stat-value">{{ totalTrades }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Final NAV:</span>
              <span class="stat-value">{{ formatNumber(finalNav) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Return:</span>
              <span :class="['stat-value', totalReturnClass]">{{ formatPercentage(totalReturn) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Annual Return:</span>
              <span :class="['stat-value', annualReturnClass]">{{ formatPercentage(annualReturn) }}</span>
            </div>
          </div>
        </div>

        <div class="chart-wrapper">
          <LineChart
            :data="chartData"
            :height="500"
            :show-data-zoom="true"
            :smooth="true"
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
import { StrategyClient, RefStrategyTypeClient } from "@/core/services/marketWatchClient";
import PageHeader from "@/components/PageHeader.vue";
import LineChart from "@/components/charts/LineChart.vue";
import { TrendCharts, Loading, Warning } from '@element-plus/icons-vue';

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
      selectedStrategyId: "" as number | "",
      strategies: [] as Array<{ id: number; name: string }>,
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
                const typeName = this.strategyTypeMap.get(String(strategyType));
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

              this.strategies.push({ id: strategyId, name: displayName });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load strategies", e);
      }
    },

    async loadData() {
      if (!this.selectedStrategyId) {
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

        this.rows = allItems;
        this.processChartData();
      } catch (e) {
        console.error("Failed to load backtest history", e);
        this.rows = [];
        this.chartData = [];
        this.totalTrades = 0;
        this.finalNav = 1.0;
        this.totalReturn = 0;
        this.annualReturn = 0;
      } finally {
        this.loading = false;
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

      // Find the date and rate of return keys
      const sampleRow = this.rows[0];
      const keys = Object.keys(sampleRow || {});
      const dateKey = keys.find((k) => k.toLowerCase() === "tradedate") || keys.find((k) => k.toLowerCase().includes("date")) || "";
      const rateOfReturnKey = keys.find((k) => k.toLowerCase() === "rateofreturn" || k.toLowerCase() === "rateorreturn") || "";

      if (!dateKey || !rateOfReturnKey) {
        console.warn("Missing required fields for chart");
        this.chartData = [];
        return;
      }

      // Sort rows by date
      const sortedRows = [...this.rows].sort((a, b) => {
        const aDate = new Date(a[dateKey]).getTime();
        const bDate = new Date(b[dateKey]).getTime();
        return aDate - bDate;
      });

      // Calculate cumulative NAV
      let currentNav = 1.0;
      const navPoints: [string, number][] = [];

      // Add starting point
      if (sortedRows.length > 0) {
        const firstDate = new Date(sortedRows[0][dateKey]);
        navPoints.push([firstDate.toLocaleDateString(), 1.0]);
      }

      for (const row of sortedRows) {
        const date = row[dateKey];
        const rateOfReturn = row[rateOfReturnKey];

        if (date && rateOfReturn !== null && rateOfReturn !== undefined) {
          // Calculate new NAV based on rate of return
          currentNav = currentNav * (1 + rateOfReturn);
          const formattedDate = new Date(date).toLocaleDateString();
          navPoints.push([formattedDate, currentNav]);
        }
      }

      // Prepare data for LineChart (first row is headers)
      this.chartData = [
        ['Date', 'NAV'],
        ...navPoints
      ];

      this.totalTrades = sortedRows.length;
      this.finalNav = currentNav;
      this.totalReturn = currentNav - 1.0;

      // Calculate annual return
      if (sortedRows.length > 0) {
        const firstDate = new Date(sortedRows[0][dateKey]);
        const lastDate = new Date(sortedRows[sortedRows.length - 1][dateKey]);
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
    },

    formatNumber(value: number): string {
      return value.toFixed(4);
    },

    formatPercentage(value: number): string {
      const percentage = (value * 100).toFixed(2);
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
.simulate-graph-container {
  padding: var(--space-4xl) var(--space-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: var(--space-3xl);
  padding: var(--space-2xl);
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
}

.filter-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.strategy-select {
  min-width: 350px;
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
.chart-section {
  margin-top: var(--space-3xl);
}

.chart-card {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: var(--space-3xl);
  box-shadow: var(--shadow-subtle);
}

.chart-header {
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--color-border-subtle);
}

.chart-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 var(--space-xl) 0;
}

.chart-stats {
  display: flex;
  gap: var(--space-3xl);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
}

.rate-positive {
  color: #e74c3c;
}

.rate-negative {
  color: #3498db;
}

.chart-wrapper {
  margin-top: var(--space-xl);
}
</style>
