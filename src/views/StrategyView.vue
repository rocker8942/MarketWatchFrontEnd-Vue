<template>
  <div class="analysis-container">
    <div class="page-header">
      <h1>Investment Analysis</h1>
      <p class="page-subtitle">Strategic market insights and performance metrics by region</p>
    </div>

    <!-- Summary Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-content">
          <div class="metric-label">Markets Analyzed</div>
          <div class="metric-value">{{ pagedResultDtoOfStrategyDto.totalCount || 0 }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-content">
          <div class="metric-label">Avg. Annual Return</div>
          <div class="metric-value positive">{{ averageAnnualReturn }}%</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-content">
          <div class="metric-label">Best Performer</div>
          <div class="metric-value">{{ bestPerformer }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-content">
          <div class="metric-label">Top Period Return</div>
          <div class="metric-value positive">{{ maxPeriodReturn }}%</div>
        </div>
      </div>
    </div>

    <!-- Strategy Table Section -->
    <div class="table-section">
      <div class="section-header">
        <h2 class="section-title">
          Regional Investment Strategies
        </h2>
        <p class="section-description">
          Comparative analysis of investment returns across global markets
        </p>
      </div>

      <div class="table-wrapper">
        <el-table
          :data="pagedResultDtoOfStrategyDto.items"
          class="professional-table"
          stripe
          :header-cell-style="{ background: 'var(--color-surface-variant)', color: 'var(--color-heading)', fontWeight: '600' }">

          <el-table-column prop="id" label="ID" width="80" align="center">
            <template #default="scope">
              <span class="id-badge">{{ scope.row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="countryToInvest" label="Market Region" min-width="200">
            <template #default="scope">
              <div class="region-cell">
                <span class="region-name">{{ scope.row.countryToInvest }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="ratePerInvesmentPeriod" label="Period Return" width="180" align="right">
            <template #default="scope">
              <div class="rate-cell">
                <span class="rate-value" :class="getRateClass(scope.row.ratePerInvesmentPeriod)">
                  {{ formatRate(scope.row.ratePerInvesmentPeriod) }}%
                </span>
                <span class="rate-indicator" :class="getRateClass(scope.row.ratePerInvesmentPeriod)">
                  {{ getRateIndicator(scope.row.ratePerInvesmentPeriod) }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="ratePerYear" label="Annual Return" width="180" align="right">
            <template #default="scope">
              <div class="rate-cell">
                <span class="rate-value" :class="getRateClass(scope.row.ratePerYear)">
                  {{ formatRate(scope.row.ratePerYear) }}%
                </span>
                <span class="rate-indicator" :class="getRateClass(scope.row.ratePerYear)">
                  {{ getRateIndicator(scope.row.ratePerYear) }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Performance" width="150" align="center">
            <template #default="scope">
              <el-tag :type="getPerformanceTagType(scope.row.ratePerYear)" class="performance-tag">
                {{ getPerformanceLabel(scope.row.ratePerYear) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Investment Disclaimer -->
    <div class="disclaimer-card">
      <div class="disclaimer-content">
        <h3>Investment Disclaimer</h3>
        <p>
          Past performance is not indicative of future results. All investments carry risk, and investors should carefully consider their investment objectives and risk tolerance before making any investment decisions. The data presented is for informational purposes only and should not be considered as investment advice.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-container {
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

.page-subtitle {
  font-size: 1.0625rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Metrics Grid - Minimalist */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}

.metric-value.positive {
  color: var(--finance-green-light);
}

.metric-value.negative {
  color: var(--finance-red-light);
}

/* Table Section - Minimalist */
.table-section {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: var(--space-3xl);
  box-shadow: var(--shadow-subtle);
  margin-bottom: var(--space-xl);
}

.section-header {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border-subtle);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.section-description {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

/* Professional Table Styling */
.professional-table {
  border-radius: 8px;
  overflow: hidden;
}

.professional-table :deep(.el-table__header) {
  font-weight: 600;
}

.professional-table :deep(.el-table__row) {
  transition: all 0.2s ease;
}

.professional-table :deep(.el-table__row:hover) {
  background: var(--color-surface-variant) !important;
}

.professional-table :deep(.el-table__cell) {
  padding: 1rem 0.75rem;
}

.id-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: var(--finance-blue);
  color: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.region-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.region-flag {
  font-size: 1.25rem;
}

.region-name {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.9375rem;
}

.rate-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.rate-value {
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.rate-value.positive {
  color: var(--finance-green-light);
}

.rate-value.negative {
  color: var(--finance-red-light);
}

.rate-indicator {
  font-size: 1.125rem;
  font-weight: bold;
}

.rate-indicator.positive {
  color: var(--finance-green-light);
}

.rate-indicator.negative {
  color: var(--finance-red-light);
}

.performance-tag {
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
}

/* Disclaimer Card - Minimalist */
.disclaimer-card {
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border-subtle);
  border-left: 3px solid var(--finance-blue);
  border-radius: 12px;
  padding: var(--space-2xl);
}

.disclaimer-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
}

.disclaimer-content p {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .analysis-container {
    padding: 1.5rem 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 0.9375rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .metric-card {
    padding: 1.25rem;
  }

  .metric-icon {
    font-size: 2rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .table-section {
    padding: 1rem;
    border-radius: 8px;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .professional-table :deep(.el-table__cell) {
    padding: 0.75rem 0.5rem;
  }

  .disclaimer-card {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .analysis-container {
    padding: 3rem 2rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { PagedResultDtoOfStrategyDto, StrategyClient } from "@/core/services/marketWatchClient";

const strategyClient = new StrategyClient(ApiService.baseUrl, ApiService.vueInstance.axios);

export default defineComponent({

  data() {
    return {
      pagedResultDtoOfStrategyDto: new PagedResultDtoOfStrategyDto(),
    };
  },

  computed: {
    averageAnnualReturn(): string {
      if (!this.pagedResultDtoOfStrategyDto.items || this.pagedResultDtoOfStrategyDto.items.length === 0) {
        return '0.00';
      }
      const sum = this.pagedResultDtoOfStrategyDto.items.reduce((acc, item) => acc + (item.ratePerYear || 0), 0);
      const avg = sum / this.pagedResultDtoOfStrategyDto.items.length;
      return avg.toFixed(2);
    },

    bestPerformer(): string {
      if (!this.pagedResultDtoOfStrategyDto.items || this.pagedResultDtoOfStrategyDto.items.length === 0) {
        return 'N/A';
      }
      const best = this.pagedResultDtoOfStrategyDto.items.reduce((max, item) =>
        (item.ratePerYear || 0) > (max.ratePerYear || 0) ? item : max
      );
      return best.countryToInvest || 'N/A';
    },

    maxPeriodReturn(): string {
      if (!this.pagedResultDtoOfStrategyDto.items || this.pagedResultDtoOfStrategyDto.items.length === 0) {
        return '0.00';
      }
      const max = Math.max(...this.pagedResultDtoOfStrategyDto.items.map(item => item.ratePerInvesmentPeriod || 0));
      return max.toFixed(2);
    }
  },

  methods: {
    async getList() {
      try {
        const response2 = await strategyClient.strategyGetList(undefined, 0, 100);
        this.pagedResultDtoOfStrategyDto = response2 as PagedResultDtoOfStrategyDto;
      } catch (error) {
        console.error(error);
      }
    },

    formatRate(rate: number | undefined): string {
      if (rate === undefined || rate === null) return '0.00';
      return rate.toFixed(2);
    },

    getRateClass(rate: number | undefined): string {
      if (!rate) return '';
      return rate >= 0 ? 'positive' : 'negative';
    },

    getRateIndicator(rate: number | undefined): string {
      if (!rate) return '—';
      return rate >= 0 ? '↑' : '↓';
    },

    getPerformanceLabel(rate: number | undefined): string {
      if (!rate) return 'Neutral';
      if (rate >= 10) return 'Excellent';
      if (rate >= 5) return 'Good';
      if (rate >= 0) return 'Moderate';
      return 'Poor';
    },

    getPerformanceTagType(rate: number | undefined): string {
      if (!rate) return '';
      if (rate >= 10) return 'success';
      if (rate >= 5) return 'success';
      if (rate >= 0) return 'warning';
      return 'danger';
    }
  },

  mounted() {
    this.getList();
  },
});
</script>
