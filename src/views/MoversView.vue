<template>
  <div class="movers-page">
    <div class="page-header">
      <h1>Market Movers</h1>
      <p class="subtitle">Top gainers and losers by price change</p>
    </div>

    <div class="content-wrapper">
      <!-- Filters -->
      <div class="filter-section">
        <div class="filter-group">
          <span class="filter-label">Period:</span>
          <el-radio-group
            v-model="selectedPeriod"
            @change="handlePeriodChange"
            size="large"
          >
            <el-radio-button value="7d">7 Days</el-radio-button>
            <el-radio-button value="1m">1 Month</el-radio-button>
            <el-radio-button value="6m">6 Months</el-radio-button>
            <el-radio-button value="1y">1 Year</el-radio-button>
          </el-radio-group>
        </div>

        <div class="filter-group">
          <span class="filter-label">Country:</span>
          <el-radio-group
            v-model="selectedCountry"
            @change="handleCountryChange"
            size="large"
          >
            <el-radio-button value="All">All</el-radio-button>
            <el-radio-button value="US">US</el-radio-button>
            <el-radio-button value="AU">AU</el-radio-button>
            <el-radio-button value="Korea">Korea</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- Movers Grid -->
      <div class="movers-grid">
        <!-- Top Gainers -->
        <div class="movers-card gainers-card">
          <div class="card-header">
            <div class="card-title-row">
              <el-icon class="card-icon gainers-icon"><Top /></el-icon>
              <h2 class="card-title">Top Gainers</h2>
            </div>
            <span class="card-badge gainers-badge">Top 10</span>
          </div>
          <el-table
            :data="topGainers"
            v-loading="loading"
            class="clean-table"
            :header-cell-style="headerCellStyle"
            :cell-style="cellStyle"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="code" label="Code" width="150">
              <template #default="{ row }">
                <span class="stock-code-cell clickable" @click="navigateToChart(row.code)">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="Name" min-width="180">
              <template #default="{ row }">
                <span class="stock-name-cell">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Current Price" width="160" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.currentPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="Previous Price" width="160" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.previousPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="Change %" width="150" align="right">
              <template #default="{ row }">
                <span class="price-change positive">
                  <el-icon><Top /></el-icon>
                  {{ formatPercent(row.changePercent) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="100" align="center">
              <template #default="{ row }">
                <el-button
                  class="search-action-btn question-btn"
                  size="small"
                  circle
                  @click="searchWhyMoved(row, true)"
                  title="Search on Google"
                >
                  ?
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Top Losers -->
        <div class="movers-card losers-card">
          <div class="card-header">
            <div class="card-title-row">
              <el-icon class="card-icon losers-icon"><Bottom /></el-icon>
              <h2 class="card-title">Top Losers</h2>
            </div>
            <span class="card-badge losers-badge">Top 10</span>
          </div>
          <el-table
            :data="topLosers"
            v-loading="loading"
            class="clean-table"
            :header-cell-style="headerCellStyle"
            :cell-style="cellStyle"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="code" label="Code" width="150">
              <template #default="{ row }">
                <span class="stock-code-cell clickable" @click="navigateToChart(row.code)">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="Name" min-width="180">
              <template #default="{ row }">
                <span class="stock-name-cell">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Current Price" width="160" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.currentPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="Previous Price" width="160" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.previousPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="Change %" width="150" align="right">
              <template #default="{ row }">
                <span class="price-change negative">
                  <el-icon><Bottom /></el-icon>
                  {{ formatPercent(Math.abs(row.changePercent)) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="100" align="center">
              <template #default="{ row }">
                <el-button
                  class="search-action-btn question-btn"
                  size="small"
                  circle
                  @click="searchWhyMoved(row, false)"
                  title="Search on Google"
                >
                  ?
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!loading && topGainers.length === 0 && topLosers.length === 0"
        class="empty-state"
      >
        <el-icon class="empty-icon"><Warning /></el-icon>
        <p>No price data available for the selected period.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Top, Bottom, Warning } from "@element-plus/icons-vue";
import ApiService from "@/core/services/apiService";

interface MoverEntry {
  code: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
}

export default defineComponent({
  components: {
    Top,
    Bottom,
    Warning,
  },

  data() {
    return {
      selectedPeriod: "7d" as string,
      selectedCountry: "All" as string,
      loading: false,
      topGainers: [] as MoverEntry[],
      topLosers: [] as MoverEntry[],
    };
  },

  computed: {
    headerCellStyle() {
      return {
        background: '#fafafa',
        color: 'var(--color-text-secondary)',
        fontWeight: '600',
        fontSize: '0.8125rem',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        padding: '0.875rem 1rem',
        borderBottom: '1px solid #f0f0f0'
      };
    },

    cellStyle() {
      return {
        borderBottom: '1px solid #f5f5f5',
        padding: '14px',
        fontSize: '0.9375rem'
      };
    }
  },

  methods: {
    async loadMovers() {
      this.loading = true;
      this.topGainers = [];
      this.topLosers = [];

      try {
        // Build query params
        const params: any = { period: this.selectedPeriod };
        if (this.selectedCountry !== "All") {
          params.country = this.selectedCountry;
        }

        // Call API directly since auto-generated client doesn't have country param yet
        const response = await ApiService.vueInstance.axios.get(
          '/api/app/stock-price/movers',
          { params }
        );

        this.topGainers = response.data.topGainers || [];
        this.topLosers = response.data.topLosers || [];

        console.log(`Loaded movers from backend cache (timestamp: ${response.data.timestamp})`);
      } catch (error) {
        console.error("Error loading movers:", error);
      } finally {
        this.loading = false;
      }
    },

    handlePeriodChange() {
      this.loadMovers();
    },

    handleCountryChange() {
      this.loadMovers();
    },

    formatCurrency(value: number): string {
      if (value == null) return "-";
      return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    },

    formatPercent(value: number): string {
      if (value == null) return "-";
      return value.toFixed(2) + "%";
    },

    navigateToChart(stockCode: string) {
      this.$router.push({
        name: 'stockChart',
        query: { stockCode }
      });
    },

    searchWhyMoved(row: MoverEntry, isGainer: boolean) {
      const direction = isGainer ? "go up" : "drop";
      const changePercent = Math.abs(row.changePercent).toFixed(2);

      // Convert period to human-readable format
      const periodMap: Record<string, string> = {
        '7d': 'last 7 days',
        '1m': 'last month',
        '6m': 'last 6 months',
        '1y': 'last year'
      };
      const periodText = periodMap[this.selectedPeriod] || this.selectedPeriod;

      // Build query with company name, country, and period
      let query = `why did ${row.name} stock price ${direction} ${changePercent}% in the ${periodText}`;

      // Add country/market if not "All"
      if (this.selectedCountry !== 'All') {
        query += ` ${this.selectedCountry} market`;
      }

      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(googleUrl, '_blank');
    },
  },

  mounted() {
    this.loadMovers();
  },
});
</script>

<style scoped>
.movers-page {
  padding: var(--space-4xl) var(--space-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
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
  line-height: 1.5;
}

.content-wrapper {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: var(--space-3xl);
  box-shadow: var(--shadow-subtle);
}

/* Filter Section */
.filter-section {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 70px;
}

/* Movers Grid */
.movers-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.movers-card {
  background: var(--color-background);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.card-icon {
  font-size: 1.25rem;
}

.gainers-icon {
  color: var(--finance-green, #16a34a);
}

.losers-icon {
  color: var(--finance-red, #dc2626);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.card-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gainers-badge {
  background: rgba(22, 163, 74, 0.1);
  color: var(--finance-green, #16a34a);
}

.losers-badge {
  background: rgba(220, 38, 38, 0.1);
  color: var(--finance-red, #dc2626);
}

/* Table */
.clean-table {
  width: 100%;
}

.clean-table :deep(.el-table__header-wrapper) {
  background: #fafafa;
}

.clean-table :deep(.el-table__header th) {
  background: #fafafa !important;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.875rem 1rem;
}

.clean-table :deep(.el-table__body td) {
  border-bottom: 1px solid #f5f5f5;
  padding: 14px;
  font-size: 0.9375rem;
  white-space: nowrap;
}

.clean-table :deep(.el-table__row) {
  transition: background-color 0.15s ease;
}

.clean-table :deep(.el-table__row:hover) {
  background: #fafafa !important;
}

.clean-table :deep(.el-table__body .el-table__row:last-child td) {
  border-bottom: none;
}

/* Remove table borders */
.clean-table :deep(.el-table--border) {
  border: none;
}

.clean-table :deep(.el-table--border::after),
.clean-table :deep(.el-table--group::after),
.clean-table :deep(.el-table::before) {
  display: none;
}

.clean-table :deep(th.el-table__cell),
.clean-table :deep(td.el-table__cell) {
  border-right: none;
}

.stock-code-cell {
  font-weight: 600;
  color: var(--color-primary, #1976d2);
  white-space: nowrap;
}

.stock-code-cell.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.stock-code-cell.clickable:hover {
  text-decoration: underline;
  color: #1565c0;
}

.stock-name-cell {
  font-weight: 500;
  color: #1f2937; /* Dark gray for better readability */
  white-space: nowrap;
}

/* Price Change */
.price-change {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  font-size: 0.9375rem;
}

.price-change.positive {
  color: var(--finance-green, #16a34a);
}

.price-change.negative {
  color: var(--finance-red, #dc2626);
}

/* Search Action Button */
.search-action-btn {
  border-color: #1976d2 !important;
  color: #1976d2 !important;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.search-action-btn :deep(span) {
  overflow: visible !important;
  text-overflow: clip !important;
}

.search-action-btn:hover {
  background: #1976d2 !important;
  color: white !important;
  border-color: #1976d2 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.search-action-btn:active {
  transform: translateY(0);
}

/* Question Button */
.question-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 1rem;
  font-weight: 700;
  border: 2px solid #1976d2 !important;
  color: #1976d2 !important;
  background: white !important;
}

.question-btn:hover {
  background: #1976d2 !important;
  color: white !important;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .movers-page {
    padding: 1.5rem 1rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
  }

  .content-wrapper {
    padding: 1rem;
  }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (min-width: 1024px) {
  .movers-page {
    padding: 3rem 2rem;
  }
}
</style>
