<template>
  <div class="analysis-container">
    <PageHeader
      title="Simulate - Backtest History"
      subtitle="Trade history results from simulations"
    />

    <div class="filter-bar">
      <div class="filter-bar-left">
        <el-select
          v-model="selectedStrategyId"
          clearable
          filterable
          placeholder="Filter by strategy"
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

      <div class="flex-1"></div>

      <div class="filter-bar-right">
        <div class="results-count">
          {{ totalCount }} rows
        </div>
      </div>
    </div>

    <!-- Summary Section -->
    <el-card v-if="summary && selectedStrategyId" class="summary-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">Strategy Summary</span>
        </div>
      </template>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Strategy Type</div>
          <div class="metric-value">{{ summary.strategyTypeName || '—' }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Annual Return</div>
          <div class="metric-value" :class="getReturnClass(summary.ratePerYear)">
            {{ formatPercentage(summary.ratePerYear) }}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Days to Test</div>
          <div class="metric-value">{{ summary.daysToTest ?? '—' }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Analysis Period</div>
          <div class="metric-value">{{ summary.analysisPeriod ?? '—' }} days</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Correlation Threshold</div>
          <div class="metric-value">{{ formatNumber(summary.coefficientAllowed) }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Entry Trigger</div>
          <div class="metric-value">{{ formatPercentage(summary.investTriggerRate) }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Stop Loss</div>
          <div class="metric-value negative">{{ formatPercentage(summary.lossCutRate) }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Portfolio Size</div>
          <div class="metric-value">{{ summary.portfolioNumber ?? '—' }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Trade Fee</div>
          <div class="metric-value">{{ formatPercentage(summary.tradeFee) }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Slippage</div>
          <div class="metric-value">{{ formatPercentage(summary.slippage) }}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Total Trades</div>
          <div class="metric-value">{{ summary.totalTrades }}</div>
        </div>
      </div>
    </el-card>

    <div class="table-section">
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="paginatedRows"
          class="professional-table"
          stripe
          :default-sort="defaultSort"
          :header-cell-style="{ background: 'var(--color-surface-variant)', color: 'var(--color-heading)', fontWeight: '600' }"
          :row-key="getRowKey"
          @sort-change="handleSortChange">
          <el-table-column
            v-for="col in columns"
            :key="col"
            :prop="getOriginalColumnName(col)"
            :label="col"
            :min-width="getMinWidth(col)"
            :align="getColumnAlign(col)"
            :sortable="isSortableColumn(col) ? 'custom' : false">
            <template #default="scope">
              <span v-if="isDateColumn(col)">{{ formatDate(scope.row[getOriginalColumnName(col)]) }}</span>
              <span v-else-if="isRateOfReturnColumn(col)" :class="getRateOfReturnClass(scope.row[getOriginalColumnName(col)])">
                {{ formatPercentage(scope.row[getOriginalColumnName(col)]) }}
              </span>
              <span v-else-if="isLeaderChangeColumn(col)" :class="getRateOfReturnClass(scope.row[getOriginalColumnName(col)])">
                {{ formatPercentage(scope.row[getOriginalColumnName(col)]) }}
              </span>
              <span v-else-if="isPriceColumn(col)">
                {{ formatPrice(scope.row[getOriginalColumnName(col)]) }}
              </span>
              <span v-else-if="isStockColumn(col)" class="stock-link" @click="handleStockClick(scope.row[getOriginalColumnName(col)])">
                {{ formatValue(scope.row[getOriginalColumnName(col)], col) }}
              </span>
              <span v-else>{{ formatValue(scope.row[getOriginalColumnName(col)], col) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[25, 50, 100, 200]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { StrategyClient, StockInfoClient, RefStrategyTypeClient } from "@/core/services/marketWatchClient";
import PageHeader from "@/components/PageHeader.vue";

type AnyRow = Record<string, any>;

export default defineComponent({
  components: {
    PageHeader
  },
  data() {
    return {
      rows: [] as AnyRow[],
      totalCount: 0,
      loading: false,
      selectedStrategyId: "" as number | "",
      selectedStrategyDetails: null as any,
      strategyIds: [] as string[],
      columns: [] as string[],
      strategyIdKey: "" as string,
      dateKey: "" as string,
      rateOfReturnKey: "" as string,
      stockMap: new Map<string, string>(),
      strategyMap: new Map<string, string>(),
      strategyTypeMap: new Map<string, string>(),
      strategyToTypeMap: new Map<string, string>(),
      sellTypeMap: new Map<string, string>(),
      strategies: [] as Array<{ id: number; name: string }>,
      currentPage: 1,
      pageSize: 50,
      sortProp: "",
      sortOrder: "",
    };
  },

  computed: {
    defaultSort(): any {
      if (!this.dateKey) return undefined;
      return { prop: this.dateKey, order: "descending" };
    },

    paginatedRows(): AnyRow[] {
      // Sort all rows first
      let sortedRows = [...this.rows];

      if (this.sortProp && this.sortOrder) {
        sortedRows.sort((a, b) => {
          const aVal = a[this.sortProp];
          const bVal = b[this.sortProp];

          // Handle null/undefined values
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;

          // Handle dates
          const lowerProp = this.sortProp.toLowerCase();
          if (lowerProp.includes("date") || this.sortProp === this.dateKey) {
            const aDate = new Date(aVal).getTime();
            const bDate = new Date(bVal).getTime();
            return this.sortOrder === "ascending" ? aDate - bDate : bDate - aDate;
          }

          // Handle numbers
          if (typeof aVal === "number" && typeof bVal === "number") {
            return this.sortOrder === "ascending" ? aVal - bVal : bVal - aVal;
          }

          // Handle strings
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          if (this.sortOrder === "ascending") {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
          }
        });
      }

      // Then paginate
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return sortedRows.slice(start, end);
    },

    summary(): any {
      if (!this.selectedStrategyDetails) {
        return null;
      }

      const strategy = this.selectedStrategyDetails;

      // Extract strategy fields (handle both PascalCase and camelCase)
      const strategyType = strategy.strategyType ?? strategy.StrategyType;
      const ratePerYear = strategy.ratePerYear ?? strategy.RatePerYear;
      const daysToTest = strategy.daysToTest ?? strategy.DaysToTest;
      const analysisPeriod = strategy.analysisPeriod ?? strategy.AnalysisPeriod;
      const coefficientAllowed = strategy.coefficientAllowed ?? strategy.CoefficientAllowed;
      const investTriggerRate = strategy.investTriggerRate ?? strategy.InvestTriggerRate;
      const lossCutRate = strategy.lossCutRate ?? strategy.LossCutRate;
      const portfolioNumber = strategy.portfolioNumber ?? strategy.PortfolioNumber;
      const tradeFee = strategy.tradeFee ?? strategy.TradeFee;
      const slippage = strategy.slippage ?? strategy.Slippage;

      return {
        strategyType,
        strategyTypeName: this.strategyTypeMap.get(String(strategyType)),
        ratePerYear,
        daysToTest,
        analysisPeriod,
        coefficientAllowed,
        investTriggerRate,
        lossCutRate,
        portfolioNumber,
        tradeFee,
        slippage,
        totalTrades: this.rows.length
      };
    },
  },

  methods: {
    async reload() {
      this.currentPage = 1;
      await this.getList();
    },

    async onStrategyIdChanged() {
      this.currentPage = 1;
      await this.loadSelectedStrategyDetails();
      await this.getList();
    },

    handlePageChange(page: number) {
      this.currentPage = page;
    },

    handleSizeChange(size: number) {
      this.pageSize = size;
      this.currentPage = 1;
    },

    handleSortChange({ prop, order }: { prop: string; order: string | null }) {
      this.sortProp = prop || "";
      this.sortOrder = order || "";
      this.currentPage = 1; // Reset to first page when sorting changes
    },

    async loadStocks() {
      try {
        const client = new StockInfoClient(undefined, ApiService.vueInstance.axios);
        const result = await client.stockInfoGetList(undefined, 0, 1000);
        this.stockMap.clear();
        if (result.items) {
          for (const stock of result.items) {
            const stockId = (stock as any).id ?? (stock as any).Id;
            const stockName = (stock as any).name ?? (stock as any).Name;

            if (stockId && stockName) {
              this.stockMap.set(String(stockId), stockName);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load stocks", e);
      }
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
        this.strategyMap.clear();
        this.strategyToTypeMap.clear();
        this.strategies = [];
        if (result.items) {
          for (const strategy of result.items) {
            const strategyId = (strategy as any).id ?? (strategy as any).Id;
            const strategyType = (strategy as any).strategyType ?? (strategy as any).StrategyType;
            const ratePerYear = (strategy as any).ratePerYear ?? (strategy as any).RatePerYear;
            const daysToTest = (strategy as any).daysToTest ?? (strategy as any).DaysToTest;

            if (strategyId !== undefined) {
              // Build display name with id, type, annual return, and trade days
              let displayName = `${strategyId}`;

              if (strategyType !== undefined && strategyType !== null) {
                this.strategyToTypeMap.set(String(strategyId), String(strategyType));
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

              this.strategyMap.set(String(strategyId), displayName);
              this.strategies.push({ id: strategyId, name: displayName });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load strategies", e);
      }
    },

    async loadSellTypes() {
      try {
        const res = await ApiService.vueInstance.axios.get("/api/app/ref-sell-type", {
          params: { SkipCount: 0, MaxResultCount: 100 }
        });
        this.sellTypeMap.clear();
        const data = res.data;
        const items = data?.items ?? data?.result?.items ?? [];

        for (const sellType of items) {
          const id = sellType.id ?? sellType.Id;
          const name = sellType.name ?? sellType.Name;

          if (id !== undefined && id !== null && name) {
            this.sellTypeMap.set(String(id), name);
          }
        }
      } catch (e) {
        console.error("Failed to load sell types", e);
      }
    },

    async loadSelectedStrategyDetails() {
      if (!this.selectedStrategyId) {
        this.selectedStrategyDetails = null;
        return;
      }

      try {
        const client = new StrategyClient(undefined, ApiService.vueInstance.axios);
        const strategy = await client.strategyGet(this.selectedStrategyId);
        this.selectedStrategyDetails = strategy;
      } catch (e) {
        console.error("Failed to load strategy details", e);
        this.selectedStrategyDetails = null;
      }
    },

    async getList() {
      this.loading = true;
      try {
        // Don't load anything if no strategy is selected
        if (!this.selectedStrategyId) {
          this.rows = [];
          this.totalCount = 0;
          this.columns = [];
          this.loading = false;
          return;
        }

        const baseParams: Record<string, any> = {
          StrategyId: this.selectedStrategyId
        };

        // Fetch all data in batches (backend limit is 1000)
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
          let total = 0;

          if (Array.isArray(payload)) {
            items = payload;
            total = payload.length;
          } else if (Array.isArray(payload?.items)) {
            items = payload.items;
            total = payload.totalCount ?? payload.items.length;
          } else {
            items = [];
            total = 0;
          }

          allItems = allItems.concat(items);

          // Check if we got all data
          if (items.length < batchSize) {
            hasMore = false;
          } else {
            skip += batchSize;
          }
        }

        this.rows = allItems;
        this.totalCount = allItems.length;

        this.refreshKeys();

        // Set default sort if not already set
        if (!this.sortProp && this.dateKey) {
          this.sortProp = this.dateKey;
          this.sortOrder = "descending";
        }
      } catch (e) {
        console.error("Failed to load backtest history", e);
        this.rows = [];
        this.totalCount = 0;
        this.columns = [];
        this.strategyIds = [];
        this.strategyIdKey = "";
        this.dateKey = "";
        this.rateOfReturnKey = "";
      } finally {
        this.loading = false;
      }
    },

    refreshKeys() {
      const keys = new Set<string>();
      for (const row of this.rows.slice(0, 50)) {
        Object.keys(row || {}).forEach((k) => keys.add(k));
      }

      const all = Array.from(keys);

      const strategyIdKey = all.find((k) => k.toLowerCase() === "strategyid") || all.find((k) => k.toLowerCase().includes("strategyid")) || "";
      const dateKey = all.find((k) => k.toLowerCase() === "tradedate") || all.find((k) => k.toLowerCase().includes("date")) || "";
      const rateOfReturnKey = all.find((k) => k.toLowerCase() === "rateofreturn" || k.toLowerCase() === "rateorreturn") || "";

      this.strategyIdKey = strategyIdKey;
      this.dateKey = dateKey;
      this.rateOfReturnKey = rateOfReturnKey;

      // Transform column names
      const transformColumnName = (col: string): string => {
        const lc = col.toLowerCase();
        if (lc === "strategyid") return "StrategyName";
        if (lc === "mainleader") return "Leader Stock";
        if (lc === "followstock") return "Follow Stock";
        if (lc === "selltype") return "Sell Type";
        if (lc === "tradedate") return "Trade Date";
        if (lc === "selldate") return "Sell Date";
        if (lc === "rateofreturn" || lc === "rateorreturn") return "Rate Of Return";
        return col;
      };

      // Order columns to match simulate/run table:
      // 1. Trade Date, 2. Sell Date, 3. Leader Stock, 4. Follow Stock, 5. Rate Of Return, 6. Sell Type, 7. Other columns
      const ordered: string[] = [];
      const sellDateKey = all.find((k) => k.toLowerCase() === "selldate") || "";
      const leaderKey = all.find((k) => k.toLowerCase() === "mainleader") || "";
      const followerKey = all.find((k) => k.toLowerCase() === "followstock") || "";
      const sellTypeKey = all.find((k) => k.toLowerCase() === "selltype") || "";

      // Add columns in the same order as simulate/run table
      if (dateKey) ordered.push(dateKey);
      if (sellDateKey) ordered.push(sellDateKey);
      if (leaderKey) ordered.push(leaderKey);
      if (followerKey) ordered.push(followerKey);
      if (rateOfReturnKey) ordered.push(rateOfReturnKey);
      if (sellTypeKey) ordered.push(sellTypeKey);

      // Add remaining columns
      for (const k of all) {
        if (!ordered.includes(k)) ordered.push(k);
      }

      // Filter out ID columns (including strategyId)
      const filtered = ordered.filter((k) => {
        const lc = k.toLowerCase();
        // Hide all ID columns
        return !lc.endsWith("id") && lc !== "id";
      });

      // Transform all column names
      this.columns = filtered.map(transformColumnName);

      if (strategyIdKey) {
        const set = new Set<string>();
        for (const row of this.rows) {
          const v = row?.[strategyIdKey];
          if (v !== null && v !== undefined && v !== "") {
            set.add(String(v).trim());
          }
        }
        this.strategyIds = Array.from(set).sort();
      } else {
        this.strategyIds = [];
      }
    },

    getOriginalColumnName(displayName: string): string {
      const lc = displayName.toLowerCase();
      if (lc === "strategyname") return this.strategyIdKey;
      if (lc === "trade date") return this.dateKey;
      if (lc === "rate of return") return this.rateOfReturnKey;
      if (lc === "sell date") {
        const keys = Object.keys(this.rows[0] || {});
        return keys.find((k) => k.toLowerCase() === "selldate") || displayName;
      }
      if (lc === "leader stock") {
        const keys = Object.keys(this.rows[0] || {});
        return keys.find((k) => k.toLowerCase() === "mainleader") || displayName;
      }
      if (lc === "follow stock") {
        const keys = Object.keys(this.rows[0] || {});
        return keys.find((k) => k.toLowerCase() === "followstock") || displayName;
      }
      if (lc === "sell type") {
        const keys = Object.keys(this.rows[0] || {});
        return keys.find((k) => k.toLowerCase() === "selltype") || displayName;
      }
      return displayName;
    },

    isSortableColumn(col: string): boolean {
      const lc = col.toLowerCase();
      // Make Trade Date, Sell Date, Rate Of Return, Leader Change, and Price columns sortable
      return lc === "trade date" || lc === "sell date" || lc === "rate of return" || this.isDateColumn(col) || this.isRateOfReturnColumn(col) || this.isLeaderChangeColumn(col) || this.isPriceColumn(col);
    },

    isDateColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === (this.dateKey || "").toLowerCase() || lc.includes("date") || lc === "trade date" || lc === "sell date";
    },

    isRateOfReturnColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === "rateorreturn" || lc === "rateofreturn" || lc === "rate of return";
    },

    isStockColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === "leader stock" || lc === "follow stock";
    },

    isLeaderChangeColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === "leader change" || lc === "leaderchange" || lc.includes("leader") && lc.includes("change");
    },

    isPriceColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === "buyprice" || lc === "buy price" || lc === "sellprice" || lc === "sell price";
    },

    handleStockClick(stockCode: string) {
      if (!stockCode) return;
      const code = String(stockCode).trim();
      this.$router.push({ name: "stockChart", query: { stockCode: code } });
    },

    formatDate(value: any): string {
      if (!value) return "—";
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString();
    },

    formatPercentage(value: any): string {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value !== "number") return String(value);
      return (value * 100).toFixed(2) + "%";
    },

    formatNumber(value: any): string {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value !== "number") return String(value);
      return value.toFixed(2);
    },

    formatPrice(value: any): string {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value !== "number") {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return String(value);
        value = parsed;
      }
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatValue(value: any, col: string): string {
      if (value === null || value === undefined || value === "") return "—";

      const lc = col.toLowerCase();

      // Transform strategyId to strategy type name
      if (lc === "strategyname") {
        const strategyId = String(value).trim();
        const strategyTypeId = this.strategyToTypeMap.get(strategyId);
        if (strategyTypeId) {
          const strategyTypeName = this.strategyTypeMap.get(strategyTypeId);
          if (strategyTypeName) {
            return strategyTypeName;
          }
        }
        // Fallback to strategy name if type not found
        const name = this.strategyMap.get(strategyId);
        return name || String(value);
      }

      // Transform stock codes to stock names
      if (lc === "leader stock" || lc === "follow stock") {
        const stockCode = String(value).trim();
        return this.stockMap.get(stockCode) || stockCode;
      }

      // Transform sellType ID to sellType name
      if (lc === "sell type") {
        const sellTypeId = String(value).trim();
        const name = this.sellTypeMap.get(sellTypeId);
        return name || String(value);
      }

      if (typeof value === "number") return String(value);
      if (typeof value === "boolean") return value ? "true" : "false";
      return String(value);
    },

    getMinWidth(col: string): number {
      const lc = col.toLowerCase();

      // Date columns
      if (this.isDateColumn(col)) return 120;

      // Rate of return
      if (this.isRateOfReturnColumn(col)) return 110;

      // Leader change
      if (this.isLeaderChangeColumn(col)) return 120;

      // Price columns
      if (this.isPriceColumn(col)) return 130;

      // Stock columns
      if (this.isStockColumn(col)) return 140;

      // Sell type
      if (lc === "sell type") return 150;

      // Default
      return 120;
    },

    getColumnAlign(col: string): string {
      // Right-align percentages and numeric values
      if (this.isRateOfReturnColumn(col)) return "right";
      if (this.isLeaderChangeColumn(col)) return "right";
      if (this.isPriceColumn(col)) return "right";

      // Left-align everything else (dates, stocks, sell type)
      return "left";
    },

    getRowKey(row: AnyRow, index: number): string | number {
      if (row && (row.id !== undefined && row.id !== null)) return row.id;
      if (row && (row.Id !== undefined && row.Id !== null)) return row.Id;
      return index;
    },

    getRateOfReturnClass(value: any): string {
      if (value === null || value === undefined || value === "") return "";
      const numValue = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(numValue)) return "";
      if (numValue > 0) return "rate-positive";
      if (numValue < 0) return "rate-negative";
      return "";
    },

    getReturnClass(value: any): string {
      if (value === null || value === undefined || value === "") return "";
      const numValue = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(numValue)) return "";
      if (numValue > 0) return "positive";
      if (numValue < 0) return "negative";
      return "";
    },
  },

  async mounted() {
    // Check if strategyId is passed via query params
    const queryStrategyId = this.$route.query.strategyId;
    if (queryStrategyId) {
      this.selectedStrategyId = parseInt(queryStrategyId as string, 10);
    }

    // Load strategy types first, then load strategies so the type map is available
    await Promise.all([this.loadStocks(), this.loadStrategyTypes(), this.loadSellTypes()]);
    await this.loadStrategies();

    // Load selected strategy details if strategyId is set
    if (this.selectedStrategyId) {
      await this.loadSelectedStrategyDetails();
    }

    await this.getList();
  },
});
</script>

<style scoped>
.analysis-container {
  padding: var(--space-4xl) var(--space-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* Filter Bar */
.filter-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-bar-right {
  display: flex;
  align-items: center;
}

.flex-1 {
  flex: 1;
}

.strategy-select {
  min-width: 350px;
}

.results-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
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

.stock-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.stock-link:hover {
  color: #66b1ff;
}

.pagination-wrapper {
  margin-top: var(--space-2xl);
  display: flex;
  justify-content: center;
}

.rate-positive {
  color: #27ae60;
  font-weight: 600;
}

.rate-negative {
  color: #e74c3c;
  font-weight: 600;
}

/* Summary Card */
.summary-card {
  margin-bottom: var(--space-xl);
  background: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  box-shadow: var(--shadow-subtle);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: var(--color-surface-variant);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  word-break: break-word;
}

.metric-card:first-child .metric-value {
  font-size: 1.125rem;
}

.metric-value.positive {
  color: #27ae60;
}

.metric-value.negative {
  color: #e74c3c;
}
</style>
