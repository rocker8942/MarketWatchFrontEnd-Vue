<template>
  <div class="data-workspace">
    <PageHeader title="Simulation Strategies" />

    <div class="filter-toolbar" aria-label="Strategy filters" role="group">
      <el-input
        v-model="searchQuery"
        aria-label="Search strategies"
        placeholder="Search strategies"
        class="search-input"
        clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedCountry" aria-label="Country" placeholder="All countries" clearable filterable>
        <el-option v-for="country in countries" :key="country" :label="country" :value="country" />
      </el-select>
      <el-select v-model="selectedStrategyType" aria-label="Strategy type" placeholder="All strategy types" clearable filterable>
        <el-option v-for="type in strategyTypes" :key="type.id" :label="type.name" :value="type.id" />
      </el-select>
      <div class="range-filter" role="group" aria-label="Annual return range">
        <el-input v-model="minAnnualReturn" aria-label="Minimum annual return percent" placeholder="Min return %" type="number" />
        <el-input v-model="maxAnnualReturn" aria-label="Maximum annual return percent" placeholder="Max return %" type="number" />
      </div>
      <div class="range-filter" role="group" aria-label="Test period range">
        <el-input v-model="minDaysToTest" aria-label="Minimum days to test" placeholder="Min days" type="number" />
        <el-input v-model="maxDaysToTest" aria-label="Maximum days to test" placeholder="Max days" type="number" />
      </div>
      <el-button text @click="clearFilters">Clear filters</el-button>
      <span class="result-count">
        {{ sortedStrategies.length }} strategies<span v-if="selectedRows.length"> · {{ selectedRows.length }} selected</span>
      </span>
      <el-button v-if="selectedRows.length === 1" @click="viewGraph(selectedRows[0])">View selected NAV</el-button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="paginatedStrategies"
        class="compact-table"
        row-key="id"
        size="small"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange">

        <el-table-column type="selection" width="44" />

        <el-table-column label="Strategy" min-width="120" prop="strategyType" sortable="custom" show-overflow-tooltip>
          <template #default="scope">
            <div class="name-cell" :title="getStrategyTypeName(scope.row.strategyType)">
              {{ getStrategyTypeName(scope.row.strategyType) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Market" width="84" sortable="custom" prop="countryToInvest" />

        <el-table-column label="Annual return" width="116" align="right" sortable="custom" prop="ratePerYear">
          <template #default="scope">
            <span :class="getRateClass(scope.row.ratePerYear)">{{ formatRate(scope.row.ratePerYear, true) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Entry trigger" width="112" align="right" sortable="custom" prop="investTriggerRate">
          <template #default="scope">
            {{ formatRate(scope.row.investTriggerRate) }}
          </template>
        </el-table-column>

        <el-table-column label="Stop loss" width="99" align="right" prop="lossCutRate" sortable="custom">
          <template #default="scope">
            {{ formatRate(scope.row.lossCutRate) }}
          </template>
        </el-table-column>

        <el-table-column label="Test days" width="95" align="right" prop="daysToTest" sortable="custom" />

        <el-table-column label="Analysis days" width="115" align="right" prop="analysisPeriod" sortable="custom" />

        <el-table-column label="Method" width="130" sortable="custom" prop="analysisMethod">
          <template #default="scope">
            {{ getAnalysisMethodName(scope.row.analysisMethod) }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="144" align="center">
          <template #default="scope">
            <div class="action-buttons">
              <el-tooltip content="Run Simulation" placement="top" :trigger="['hover', 'focus']">
                <button class="action-icon-btn primary" @click="runSimulation(scope.row)" aria-label="Run Simulation">
                  <el-icon><VideoPlay /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="View History" placement="top" :trigger="['hover', 'focus']">
                <button class="action-icon-btn" @click="viewBacktest(scope.row)" aria-label="View History">
                  <el-icon><Right /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="View NAV graph" placement="top" :trigger="['hover', 'focus']">
                <button class="action-icon-btn" @click="viewGraph(scope.row)" aria-label="View NAV graph">
                  <el-icon><TrendCharts /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="Delete Strategy" placement="top" :trigger="['hover', 'focus']">
                <button class="action-icon-btn danger" @click="confirmDelete(scope.row)" aria-label="Delete Strategy">
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
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
          :pager-count="5"
          background
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
.filter-toolbar,
.range-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.filter-toolbar {
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.filter-toolbar > .el-select {
  width: 10rem;
  max-width: 100%;
}

.search-input {
  width: 12rem;
  max-width: 100%;
}

.range-filter .el-input {
  width: 7.5rem;
}

.result-count {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.table-container {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.name-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.action-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.action-icon-btn:hover {
  background: var(--color-surface-variant);
  color: var(--color-heading);
}

.action-icon-btn.primary {
  color: var(--color-primary);
}

.action-icon-btn.danger:hover {
  color: var(--color-market-loss, #b42318);
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border-subtle);
}

.pagination-container :deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 0.375rem;
}

@media (max-width: 560px) {
  .search-input {
    width: 100%;
  }

  .filter-toolbar > .el-select {
    flex: 1 1 calc(50% - 0.5rem);
    min-width: 0;
  }

  .range-filter {
    width: 100%;
  }

  .range-filter .el-input {
    flex: 1;
    width: auto;
    min-width: 0;
  }

  .action-icon-btn {
    width: 30px;
    height: 36px;
  }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import ApiService from "@/core/services/apiService";
import { StrategyClient, type StrategyDto, RefStrategyTypeClient, type RefStrategyTypeDto } from "@/core/services/marketWatchClient";
import { Search, Right, Delete, VideoPlay, TrendCharts } from '@element-plus/icons-vue';

export default defineComponent({
  components: {
    PageHeader,
    Search,
    TrendCharts,
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
      minAnnualReturn: "",
      maxAnnualReturn: "",
      minDaysToTest: "",
      maxDaysToTest: "",
      searchQuery: "",
      currentPage: 1,
      pageSize: 25,
      selectedRows: [] as StrategyDto[],
      sortColumn: null as keyof StrategyDto | null,
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
      if (this.minAnnualReturn !== "" && Number.isFinite(Number(this.minAnnualReturn))) {
        const minRate = Number(this.minAnnualReturn) / 100;
        filtered = filtered.filter(s => s.ratePerYear != null && s.ratePerYear >= minRate);
      }

      if (this.maxAnnualReturn !== "" && Number.isFinite(Number(this.maxAnnualReturn))) {
        const maxRate = Number(this.maxAnnualReturn) / 100;
        filtered = filtered.filter(s => s.ratePerYear != null && s.ratePerYear <= maxRate);
      }

      // Days to test range filter
      if (this.minDaysToTest !== "" && Number.isFinite(Number(this.minDaysToTest))) {
        const minDays = Number(this.minDaysToTest);
        filtered = filtered.filter(s => s.daysToTest != null && s.daysToTest >= minDays);
      }

      if (this.maxDaysToTest !== "" && Number.isFinite(Number(this.maxDaysToTest))) {
        const maxDays = Number(this.maxDaysToTest);
        filtered = filtered.filter(s => s.daysToTest != null && s.daysToTest <= maxDays);
      }

      return filtered;
    },

    sortedStrategies(): StrategyDto[] {
      const sorted = [...this.filteredStrategies];

      const column = this.sortColumn;
      if (!column || !this.sortOrder) return sorted;

      const direction = this.sortOrder === "ascending" ? 1 : -1;
      sorted.sort((a, b) => {
        const first = this.strategySortValue(a, column);
        const second = this.strategySortValue(b, column);
        if (first == null) return second == null ? 0 : 1;
        if (second == null) return -1;
        const comparison = typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second));
        return comparison * direction;
      });

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

  },

  watch: {
    filteredStrategies() {
      this.currentPage = 1;
    },
  },

  methods: {
    getStrategyTypeName(typeId: number | null | undefined): string {
      if (typeId == null) return "—";
      const type = this.refStrategyTypes.find(t => t.id === typeId);
      if (type?.name) return type.name;
      return typeId === 6 ? 'TimeSeriesMomentum' : `Type ${typeId}`;
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

    clearFilters() {
      this.selectedCountry = "";
      this.selectedStrategyType = null;
      this.minAnnualReturn = "";
      this.maxAnnualReturn = "";
      this.minDaysToTest = "";
      this.maxDaysToTest = "";
      this.searchQuery = "";
      this.currentPage = 1;
    },

    handleSelectionChange(selection: StrategyDto[]) {
      this.selectedRows = selection;
    },

    strategySortValue(strategy: StrategyDto, prop: keyof StrategyDto) {
      if (prop === "strategyType") return this.getStrategyTypeName(strategy.strategyType);
      if (prop === "analysisMethod") return this.getAnalysisMethodName(strategy.analysisMethod);
      return strategy[prop];
    },

    handleSortChange({ prop, order }: { prop: keyof StrategyDto; order: string | null }) {
      this.sortColumn = order ? prop : null;
      this.sortOrder = order ?? "";
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

    formatRate(rate: number | null | undefined, signed = false): string {
      if (rate == null || !Number.isFinite(rate)) return "—";
      return new Intl.NumberFormat("en", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: signed ? "exceptZero" : "auto",
      }).format(rate);
    },

    getRateClass(rate: number | null | undefined): string {
      if (!rate) return "";
      return rate > 0 ? "positive" : "negative";
    },

    viewGraph(strategy: StrategyDto) {
      this.router.push({
        name: "simulateGraph",
        query: { strategyId: strategy.id?.toString() },
      });
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
