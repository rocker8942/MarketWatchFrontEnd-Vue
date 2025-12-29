<template>
  <div class="analysis-container">
    <div class="page-header">
      <h1>Fund Strategy</h1>
      <p class="page-subtitle">Data from tblFundStrategy</p>
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

    <!-- Fund Strategy Table (tblFundStrategy) -->
    <div class="table-section">
      <div class="section-header">
        <h2 class="section-title">tblFundStrategy</h2>
        <p class="section-description">Raw strategy configuration and calculated performance fields</p>
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

          <el-table-column prop="name" label="Name" min-width="200" />

          <el-table-column prop="countryToInvest" label="Country" min-width="160" />

          <el-table-column prop="investTriggerRate" label="Trigger Rate" width="130" align="right" />
          <el-table-column prop="analysisPeriod" label="Analysis Period" width="140" align="right" />
          <el-table-column prop="portfolioNumber" label="Portfolio #" width="120" align="right" />
          <el-table-column prop="priceToUse" label="Price To Use" width="130" align="right" />
          <el-table-column prop="lossCutRate" label="Loss Cut" width="110" align="right" />

          <el-table-column prop="investDate" label="Invest Date" width="170">
            <template #default="scope">
              {{ formatDate(scope.row.investDate) }}
            </template>
          </el-table-column>

          <el-table-column prop="investStartDate" label="Start Date" width="170">
            <template #default="scope">
              {{ formatDate(scope.row.investStartDate) }}
            </template>
          </el-table-column>

          <el-table-column prop="daysToTest" label="Days To Test" width="130" align="right" />
          <el-table-column prop="std" label="Std" width="110" align="right">
            <template #default="scope">{{ formatRate(scope.row.std) }}</template>
          </el-table-column>
          <el-table-column prop="coefficientAllowed" label="Coeff" width="110" align="right">
            <template #default="scope">{{ formatRate(scope.row.coefficientAllowed) }}</template>
          </el-table-column>

          <el-table-column prop="ratePerInvesmentPeriod" label="Period Return" width="150" align="right">
            <template #default="scope">{{ formatRate(scope.row.ratePerInvesmentPeriod) }}%</template>
          </el-table-column>

          <el-table-column prop="ratePerYear" label="Annual Return" width="150" align="right">
            <template #default="scope">{{ formatRate(scope.row.ratePerYear) }}%</template>
          </el-table-column>

          <el-table-column prop="inUse" label="In Use" width="90" align="center" />
          <el-table-column prop="disabled" label="Disabled" width="100" align="center" />

          <el-table-column prop="createdAt" label="Created" width="170">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="openEditDialog(scope.row)">Edit</el-button>
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

    <!-- Edit Strategy Dialog -->
    <el-dialog v-model="editDialogVisible" title="Edit Strategy" width="600px">
      <el-form :model="editForm" label-width="160px" label-position="left">
        <el-form-item label="Name">
          <el-input v-model="editForm.name" placeholder="Strategy name" />
        </el-form-item>
        <el-form-item label="Country">
          <el-input v-model="editForm.countryToInvest" placeholder="Country to invest" />
        </el-form-item>
        <el-form-item label="Trigger Rate">
          <el-input-number v-model="editForm.investTriggerRate" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="Analysis Period">
          <el-input-number v-model="editForm.analysisPeriod" :min="1" />
        </el-form-item>
        <el-form-item label="Portfolio Number">
          <el-input-number v-model="editForm.portfolioNumber" :min="1" />
        </el-form-item>
        <el-form-item label="Price To Use">
          <el-input-number v-model="editForm.priceToUse" :min="1" />
        </el-form-item>
        <el-form-item label="Loss Cut Rate">
          <el-input-number v-model="editForm.lossCutRate" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="Days To Test">
          <el-input-number v-model="editForm.daysToTest" :min="1" />
        </el-form-item>
        <el-form-item label="Coefficient Allowed">
          <el-input-number v-model="editForm.coefficientAllowed" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="In Use">
          <el-input-number v-model="editForm.inUse" :min="0" :max="1" />
        </el-form-item>
        <el-form-item label="Disabled">
          <el-switch v-model="editForm.disabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveStrategy">Save</el-button>
        </span>
      </template>
    </el-dialog>
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

export default defineComponent({

  data() {
    return {
      // Backend: tblFundStrategy
      pagedResultDtoOfStrategyDto: { items: [], totalCount: 0 } as any,
      // Edit dialog
      editDialogVisible: false,
      editForm: {
        id: 0,
        name: '',
        countryToInvest: '',
        investTriggerRate: 0,
        analysisPeriod: 0,
        portfolioNumber: 0,
        priceToUse: 0,
        lossCutRate: 0,
        daysToTest: 0,
        coefficientAllowed: 0,
        inUse: 0,
        disabled: false,
      } as any,
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
        const res = await ApiService.vueInstance.axios.get(
          `/api/app/fund-strategy?SkipCount=0&MaxResultCount=100`
        );

        const data = res.data;
        // ABP list responses are usually { items, totalCount }
        if (Array.isArray(data)) {
          this.pagedResultDtoOfStrategyDto = { items: data, totalCount: data.length };
        } else {
          this.pagedResultDtoOfStrategyDto = data;
          if (!this.pagedResultDtoOfStrategyDto.items && Array.isArray(data?.result)) {
            this.pagedResultDtoOfStrategyDto = { items: data.result, totalCount: data.result.length };
          }
        }
      } catch (error) {
        console.error("Failed to load tblFundStrategy", error);
        this.pagedResultDtoOfStrategyDto = { items: [], totalCount: 0 };
      }
    },

    formatRate(rate: number | undefined): string {
      if (rate === undefined || rate === null) return '0.00';
      return rate.toFixed(2);
    },

    formatDate(value: Date | string | undefined): string {
      if (!value) return '—';
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleString();
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
    },

    openEditDialog(row: any) {
      // Deep copy the row data to the edit form
      this.editForm = { ...row };
      this.editDialogVisible = true;
    },

    async saveStrategy() {
      try {
        // Call the backend API to update the strategy
        await ApiService.vueInstance.axios.put(
          `/api/app/fund-strategy/${this.editForm.id}`,
          this.editForm
        );

        // Refresh the list after saving
        await this.getList();

        // Close the dialog
        this.editDialogVisible = false;

        // Show success message
        (this as any).$message.success('Strategy updated successfully');
      } catch (error) {
        console.error("Failed to update strategy", error);
        (this as any).$message.error('Failed to update strategy');
      }
    }
  },

  mounted() {
    this.getList();
  },
});
</script>
