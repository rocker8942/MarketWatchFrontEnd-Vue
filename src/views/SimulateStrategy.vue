<template>
  <div class="analysis-container">
    <div class="page-header">
      <h1>Simulate - Strategy</h1>
      <p class="page-subtitle">Manage and filter simulation strategies</p>
    </div>

    <!-- Filter Controls -->
    <div class="mb-6 flex flex-wrap items-center" style="gap: 16px;">
      <div>
        <el-select
          v-model="selectedCountry"
          clearable
          filterable
          placeholder="Filter by Country"
          style="width: 180px;"
          @change="onFilterChanged">
          <el-option
            v-for="country in countries"
            :key="country"
            :label="country"
            :value="country" />
        </el-select>
      </div>

      <div>
        <el-select
          v-model="selectedStrategyType"
          clearable
          filterable
          :placeholder="strategyTypes.length > 0 ? 'Filter by Strategy Type' : 'No Strategy Types Available'"
          :disabled="strategyTypes.length === 0"
          style="width: 200px;"
          @change="onFilterChanged">
          <el-option
            v-for="type in strategyTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id" />
        </el-select>
      </div>

      <div>
        <el-input
          v-model.number="minAnnualReturn"
          clearable
          placeholder="Min Return %"
          style="width: 140px;"
          type="number"
          @input="onFilterChanged">
          <template #suffix>%</template>
        </el-input>
      </div>

      <div>
        <el-input
          v-model.number="maxAnnualReturn"
          clearable
          placeholder="Max Return %"
          style="width: 140px;"
          type="number"
          @input="onFilterChanged">
          <template #suffix>%</template>
        </el-input>
      </div>

      <div>
        <el-button :loading="loading" type="primary" @click="reload">
          Refresh
        </el-button>
      </div>

      <div class="text-sm text-gray-500">
        {{ filteredStrategies.length }} of {{ allStrategies.length }} strategies
      </div>
    </div>

    <!-- Strategy Table -->
    <div class="table-section">
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="filteredStrategies"
          class="professional-table"
          stripe
          :header-cell-style="{ background: 'var(--color-surface-variant)', color: 'var(--color-heading)', fontWeight: '600' }">

          <el-table-column prop="id" label="ID" width="80" align="center">
            <template #default="scope">
              <span class="id-badge">{{ scope.row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="countryToInvest" label="Country" min-width="120" />

          <el-table-column prop="strategyType" label="Strategy Type" width="180" align="center">
            <template #default="scope">
              {{ getStrategyTypeName(scope.row.strategyType) }}
            </template>
          </el-table-column>

          <el-table-column prop="investTriggerRate" label="Trigger Rate" width="130" align="right" />

          <el-table-column prop="analysisPeriod" label="Analysis Period" width="140" align="right" />

          <el-table-column prop="daysToTest" label="Days to Test" width="120" align="right" />

          <el-table-column prop="portfolioNumber" label="Portfolio #" width="120" align="right" />

          <el-table-column prop="ratePerYear" label="Annual Return" width="150" align="right">
            <template #default="scope">
              <span :class="getRateClass(scope.row.ratePerYear)">
                {{ formatRate(scope.row.ratePerYear) }}%
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="inUse" label="In Use" width="90" align="center" />

          <el-table-column label="Actions" width="200" align="center" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click.stop="viewBacktest(scope.row)">
                View History
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click.stop="confirmDelete(scope.row)">
                Delete
              </el-button>
            </template>
          </el-table-column>
        </el-table>
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

.table-section {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: var(--space-3xl);
  box-shadow: var(--shadow-subtle);
  margin-bottom: var(--space-xl);
}

.table-wrapper {
  overflow-x: auto;
}

.professional-table {
  border-radius: 8px;
  overflow: hidden;
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

.rate-value.positive {
  color: var(--finance-green-light);
  font-weight: 600;
}

.rate-value.negative {
  color: var(--finance-red-light);
  font-weight: 600;
}

@media (max-width: 768px) {
  .analysis-container {
    padding: 1.5rem 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .table-section {
    padding: 1rem;
    border-radius: 8px;
  }

  .professional-table :deep(.el-table__cell) {
    padding: 0.75rem 0.5rem;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import ApiService from "@/core/services/apiService";
import { StrategyClient, type StrategyDto, RefStrategyTypeClient, type RefStrategyTypeDto } from "@/core/services/marketWatchClient";

export default defineComponent({
  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      allStrategies: [] as StrategyDto[],
      refStrategyTypes: [] as RefStrategyTypeDto[],
      loading: false,
      selectedCountry: "" as string,
      selectedStrategyType: null as number | null,
      minAnnualReturn: null as number | null,
      maxAnnualReturn: null as number | null,
    };
  },

  computed: {
    filteredStrategies(): StrategyDto[] {
      let filtered = this.allStrategies;

      if (this.selectedCountry) {
        filtered = filtered.filter(s => s.countryToInvest === this.selectedCountry);
      }

      if (this.selectedStrategyType !== null && this.selectedStrategyType !== undefined) {
        filtered = filtered.filter(s => s.strategyType === this.selectedStrategyType);
      }

      if (this.minAnnualReturn !== null && this.minAnnualReturn !== undefined) {
        const minRate = this.minAnnualReturn / 100;
        filtered = filtered.filter(s => (s.ratePerYear ?? 0) >= minRate);
      }

      if (this.maxAnnualReturn !== null && this.maxAnnualReturn !== undefined) {
        const maxRate = this.maxAnnualReturn / 100;
        filtered = filtered.filter(s => (s.ratePerYear ?? 0) <= maxRate);
      }

      return filtered;
    },

    countries(): string[] {
      const countrySet = new Set<string>();
      this.allStrategies.forEach(s => {
        if (s.countryToInvest) {
          countrySet.add(s.countryToInvest);
        }
      });
      return Array.from(countrySet).sort();
    },

    strategyTypes(): Array<{ id: number; name: string }> {
      const typeSet = new Set<number>();
      this.allStrategies.forEach(s => {
        if (s.strategyType !== undefined && s.strategyType !== null) {
          typeSet.add(s.strategyType);
        }
      });

      const typeIds = Array.from(typeSet).sort((a, b) => a - b);
      return typeIds.map(id => ({
        id,
        name: this.getStrategyTypeName(id)
      }));
    }
  },

  methods: {
    getStrategyTypeName(typeId: number): string {
      const type = this.refStrategyTypes.find(t => t.id === typeId);
      return type?.name || `Type ${typeId}`;
    },
    async reload() {
      await this.getList();
    },

    async onFilterChanged() {
      // Filter is reactive, no need to reload
    },

    async getList() {
      this.loading = true;
      try {
        const client = new StrategyClient(undefined, ApiService.vueInstance.axios);
        const result = await client.strategyGetList(undefined, 0, 1000);
        this.allStrategies = result.items || [];
      } catch (error) {
        console.error("Failed to load strategies", error);
        this.allStrategies = [];
      } finally {
        this.loading = false;
      }
    },

    async loadStrategyTypes() {
      try {
        const client = new RefStrategyTypeClient(undefined, ApiService.vueInstance.axios);
        const result = await client.refStrategyTypeGetList(undefined, 0, 100);
        this.refStrategyTypes = result.items || [];
      } catch (error) {
        console.error("Failed to load strategy types", error);
        this.refStrategyTypes = [];
      }
    },

    formatRate(rate: number | undefined): string {
      if (rate === undefined || rate === null) return '0.00';
      return (rate * 100).toFixed(2);
    },

    getRateClass(rate: number | undefined): string {
      if (!rate) return '';
      return rate >= 0 ? 'rate-value positive' : 'rate-value negative';
    },

    viewBacktest(strategy: StrategyDto) {
      // Navigate to backtest history with strategy ID
      this.router.push({
        name: 'simulateBacktestHistory',
        query: { strategyId: strategy.id?.toString() }
      });
    },

    async confirmDelete(strategy: StrategyDto) {
      try {
        await this.$confirm(
          `Are you sure you want to delete strategy ID ${strategy.id}? This will also delete all related backtest history.`,
          'Delete Strategy',
          {
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        );
        await this.deleteStrategy(strategy);
      } catch (error) {
        // User cancelled
      }
    },

    async deleteStrategy(strategy: StrategyDto) {
      if (!strategy.id) return;

      this.loading = true;
      try {
        const client = new StrategyClient(undefined, ApiService.vueInstance.axios);
        await client.strategyDelete(strategy.id);

        this.$message({
          type: 'success',
          message: 'Strategy and related backtest history deleted successfully'
        });

        await this.getList();
      } catch (error) {
        console.error("Failed to delete strategy", error);
        this.$message({
          type: 'error',
          message: 'Failed to delete strategy'
        });
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadStrategyTypes();
    this.getList();
  },
});
</script>
