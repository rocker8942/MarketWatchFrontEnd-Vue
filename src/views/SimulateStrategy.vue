<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Strategies</h1>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchQuery"
          placeholder="Search"
          class="search-input"
          clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-toolbar">
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="showFilterDialog = true">
          <el-icon><FilterIcon /></el-icon>
          Filter
        </button>
        <span class="result-count">{{ sortedStrategies.length }} strategies</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="paginatedStrategies"
        class="clean-table"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange">

        <el-table-column type="selection" width="48" />

        <el-table-column label="Name" min-width="200" sortable>
          <template #default="scope">
            <div class="name-cell">
              {{ getStrategyTypeName(scope.row.strategyType) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Country" width="150" sortable prop="countryToInvest" />

        <el-table-column label="Annual Return" width="150" sortable prop="ratePerYear">
          <template #default="scope">
            {{ formatRate(scope.row.ratePerYear) }}%
          </template>
        </el-table-column>

        <el-table-column label="Entry Trigger" width="130" sortable prop="investTriggerRate">
          <template #default="scope">
            {{ formatRate(scope.row.investTriggerRate) }}%
          </template>
        </el-table-column>

        <el-table-column label="Stop Loss Rate" width="150" sortable>
          <template #default="scope">
            {{ formatRate(scope.row.lossCutRate) }}%
          </template>
        </el-table-column>

        <el-table-column label="Days to Test" width="130" align="right" prop="daysToTest" />

        <el-table-column label="Analysis Period" width="150" align="right" prop="analysisPeriod" />

        <el-table-column label="Analysis Method" width="150" sortable prop="analysisMethod">
          <template #default="scope">
            {{ getAnalysisMethodName(scope.row.analysisMethod) }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="180" align="center" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="action-icon-btn primary" @click="runSimulation(scope.row)" title="Run Simulation">
                <el-icon><VideoPlay /></el-icon>
              </button>
              <button class="action-icon-btn" @click="viewBacktest(scope.row)" title="View History">
                <el-icon><Right /></el-icon>
              </button>
              <button class="action-icon-btn danger" @click="confirmDelete(scope.row)" title="Delete">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 25, 50, 100]"
          :total="sortedStrategies.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- Filter Dialog -->
    <el-dialog v-model="showFilterDialog" title="Filter Strategies" width="500px">
      <el-form label-position="top">
        <el-form-item label="Country">
          <el-select
            v-model="selectedCountry"
            clearable
            filterable
            placeholder="Select country"
            style="width: 100%">
            <el-option
              v-for="country in countries"
              :key="country"
              :label="country"
              :value="country" />
          </el-select>
        </el-form-item>

        <el-form-item label="Strategy Type">
          <el-select
            v-model="selectedStrategyType"
            clearable
            filterable
            placeholder="Select strategy type"
            style="width: 100%">
            <el-option
              v-for="type in strategyTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="Annual Return Range">
          <div style="display: flex; gap: 12px;">
            <el-input
              v-model.number="minAnnualReturn"
              placeholder="Min %"
              type="number">
              <template #suffix>%</template>
            </el-input>
            <el-input
              v-model.number="maxAnnualReturn"
              placeholder="Max %"
              type="number">
              <template #suffix>%</template>
            </el-input>
          </div>
        </el-form-item>

        <el-form-item label="Days To Test Range">
          <div style="display: flex; gap: 12px;">
            <el-input
              v-model.number="minDaysToTest"
              placeholder="Min days"
              type="number">
              <template #suffix>days</template>
            </el-input>
            <el-input
              v-model.number="maxDaysToTest"
              placeholder="Max days"
              type="number">
              <template #suffix>days</template>
            </el-input>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="clearFilters">Clear</el-button>
        <el-button type="primary" @click="applyFilters">Apply Filters</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* Page Container */
.page-container {
  padding: 2rem 3rem;
  max-width: 100%;
  background: var(--color-background);
  min-height: 100vh;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-input {
  width: 280px;
}

.search-input :deep(.el-input__wrapper) {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: none;
  padding: 0.5rem 0.75rem;
}

/* Filter Toolbar */
.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-variant);
}

.result-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Table Container */
.table-container {
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

/* Clean Table Styling */
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
  padding: 1rem;
  font-size: 0.9375rem;
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

/* Name Cell */
.name-cell {
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-icon-btn:hover {
  background: var(--color-surface-variant);
  color: var(--color-heading);
}

.action-icon-btn.primary {
  color: var(--el-color-primary);
}

.action-icon-btn.primary:hover {
  background: rgba(64, 158, 255, 0.1);
  color: var(--el-color-primary-light-3);
}

.action-icon-btn.danger:hover {
  background: rgba(239, 83, 80, 0.08);
  color: var(--finance-red-light);
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border-subtle);
}

.pagination-container :deep(.el-pagination) {
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .page-container {
    padding: 1.5rem 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-right {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .filter-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import ApiService from "@/core/services/apiService";
import { StrategyClient, type StrategyDto, RefStrategyTypeClient, type RefStrategyTypeDto } from "@/core/services/marketWatchClient";
import { Search, Filter as FilterIcon, Right, Delete, VideoPlay } from '@element-plus/icons-vue';

export default defineComponent({
  components: {
    Search,
    FilterIcon,
    Right,
    Delete,
    VideoPlay
  },
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
      minDaysToTest: null as number | null,
      maxDaysToTest: null as number | null,
      searchQuery: "",
      showFilterDialog: false,
      currentPage: 1,
      pageSize: 25,
      selectedRows: [] as StrategyDto[],
      sortColumn: "" as string,
      sortOrder: "" as string // "ascending" or "descending"
    };
  },

  computed: {
    filteredStrategies(): StrategyDto[] {
      // Filter out disabled (soft-deleted) strategies
      let filtered = this.allStrategies.filter(s => !s.disabled);

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(s => {
          const typeName = this.getStrategyTypeName(s.strategyType).toLowerCase();
          const country = (s.countryToInvest || '').toLowerCase();
          return typeName.includes(query) || country.includes(query);
        });
      }

      // Country filter
      if (this.selectedCountry) {
        filtered = filtered.filter(s => s.countryToInvest === this.selectedCountry);
      }

      // Strategy type filter
      if (this.selectedStrategyType !== null && this.selectedStrategyType !== undefined) {
        filtered = filtered.filter(s => s.strategyType === this.selectedStrategyType);
      }

      // Annual return range filter
      if (this.minAnnualReturn !== null && this.minAnnualReturn !== undefined) {
        const minRate = this.minAnnualReturn / 100;
        filtered = filtered.filter(s => (s.ratePerYear ?? 0) >= minRate);
      }

      if (this.maxAnnualReturn !== null && this.maxAnnualReturn !== undefined) {
        const maxRate = this.maxAnnualReturn / 100;
        filtered = filtered.filter(s => (s.ratePerYear ?? 0) <= maxRate);
      }

      // Days to test range filter
      if (this.minDaysToTest !== null && this.minDaysToTest !== undefined) {
        filtered = filtered.filter(s => (s.daysToTest ?? 0) >= this.minDaysToTest!);
      }

      if (this.maxDaysToTest !== null && this.maxDaysToTest !== undefined) {
        filtered = filtered.filter(s => (s.daysToTest ?? 0) <= this.maxDaysToTest!);
      }

      return filtered;
    },

    sortedStrategies(): StrategyDto[] {
      const sorted = [...this.filteredStrategies];

      if (this.sortColumn && this.sortOrder) {
        sorted.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (this.sortColumn) {
            case 'ratePerYear':
              aValue = a.ratePerYear ?? 0;
              bValue = b.ratePerYear ?? 0;
              break;
            default:
              return 0;
          }

          if (this.sortOrder === 'ascending') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        });
      }

      return sorted;
    },

    paginatedStrategies(): StrategyDto[] {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.sortedStrategies.slice(start, end);
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
    },

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
        padding: '1rem',
        fontSize: '0.9375rem'
      };
    }
  },

  methods: {
    getStrategyTypeName(typeId: number): string {
      const type = this.refStrategyTypes.find(t => t.id === typeId);
      return type?.name || `Type ${typeId}`;
    },

    getAnalysisMethodName(methodId: number | undefined): string {
      if (methodId === undefined || methodId === null) return 'Correlation';
      switch (methodId) {
        case 0:
          return 'Correlation';
        case 1:
          return 'Cointegration';
        default:
          return `Method ${methodId}`;
      }
    },

    async reload() {
      await this.getList();
    },

    async onFilterChanged() {
      // Filter is reactive, reset to first page
      this.currentPage = 1;
    },

    applyFilters() {
      this.showFilterDialog = false;
      this.currentPage = 1;
    },

    clearFilters() {
      this.selectedCountry = "";
      this.selectedStrategyType = null;
      this.minAnnualReturn = null;
      this.maxAnnualReturn = null;
      this.minDaysToTest = null;
      this.maxDaysToTest = null;
      this.searchQuery = "";
      this.currentPage = 1;
      this.showFilterDialog = false;
    },

    handleSelectionChange(selection: StrategyDto[]) {
      this.selectedRows = selection;
    },

    handleSortChange(sortData: { column: any; prop: string; order: string | null }) {
      if (!sortData.order) {
        // Clear sort
        this.sortColumn = "";
        this.sortOrder = "";
      } else {
        this.sortColumn = sortData.prop;
        this.sortOrder = sortData.order;
      }
      // Reset to first page when sorting changes
      this.currentPage = 1;
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

    runSimulation(strategy: StrategyDto) {
      if (!strategy.id) return;

      const countryCode = strategy.countryToInvest || '';
      console.log('Strategy country code:', countryCode, 'Type:', typeof countryCode, 'Length:', countryCode.length);
      console.log('Full strategy:', {
        id: strategy.id,
        strategyType: strategy.strategyType,
        countryToInvest: strategy.countryToInvest
      });

      // Navigate to Run Simulation page with pre-filled parameters
      // Pass country code as string, SimulateRunView will map it to the correct value
      const query: any = {
        strategyType: strategy.strategyType?.toString(),
        countryCode: countryCode,
        analysisPeriod: (strategy.analysisPeriod || 60).toString(),
        coefficientAllowed: (strategy.coefficientAllowed || 0.85).toString(),
        investTriggerRate: (strategy.investTriggerRate || 0.02).toString(),
        lossCutRate: (strategy.lossCutRate || -0.01).toString(),
        portfolioNumber: (strategy.portfolioNumber || 10).toString(),
        tradeFee: '0.001',
        slippage: '0.001',
        runAsync: 'true'
      };

      // Add start date if available
      if (strategy.investStartDate) {
        query.startDate = new Date(strategy.investStartDate).toISOString();
      }

      this.router.push({
        name: 'simulateRun',
        query: query
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
