<template>
  <div class="data-workspace history-workspace">
    <PageHeader title="Strategy History" />

    <div class="filter-bar">
      <div class="filter-bar-left">
        <el-select
          v-model="selectedStrategyId"
          clearable
          filterable
          placeholder="Filter by strategy name"
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

    <el-table
      v-loading="loading"
      :data="rows"
      class="compact-table"
      stripe
      size="small"
      :default-sort="defaultSort"
      :row-key="getRowKey">
      <el-table-column v-if="detailColumns.length" width="42" align="center">
        <template #default="{ row, $index }">
          <el-button
            type="primary"
            link
            title="Trade details"
            :aria-label="'Details for trade ' + ($index + 1)"
            @click="openDetails(row)">…</el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-for="col in primaryColumns"
        :key="col"
        :prop="getOriginalColumnName(col)"
        :label="columnLabel(col)"
        :min-width="getMinWidth(col)"
        :align="isRateOfReturnColumn(col) ? 'right' : 'left'"
        :sortable="isDateColumn(col)"
        show-overflow-tooltip>
        <template #default="{ row }">
          <span :class="isRateOfReturnColumn(col) ? returnClass(row[col]) : undefined">
            {{ formatCell(row, col, true) }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailsVisible" title="Fund trade details" width="min(580px, calc(100vw - 24px))">
      <dl v-if="detailTrade" class="trade-details">
        <div v-for="col in columns" :key="col">
          <dt>{{ columnLabel(col) }}</dt>
          <dd>{{ formatCell(detailTrade, col) }}</dd>
        </div>
      </dl>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { FundStrategyClient, StockInfoClient } from "@/core/services/marketWatchClient";
import PageHeader from "@/components/PageHeader.vue";

type AnyRow = Record<string, any>;

export default defineComponent({
  components: {
    PageHeader
  },
  data() {
    return {
      rows: [] as AnyRow[],
      detailTrade: null as AnyRow | null,
      detailsVisible: false,
      totalCount: 0,
      loading: false,
      selectedStrategyId: "" as number | "",
      columns: [] as string[],
      strategyIdKey: "" as string,
      dateKey: "" as string,
      stockMap: new Map<string, string>(), // stockCode -> stockName
      strategyMap: new Map<string, string>(), // strategyId -> strategyName
      sellTypeMap: new Map<string, string>(), // sellTypeId -> sellTypeName
      strategies: [] as Array<{ id: number; name: string }>,
    };
  },

  computed: {
    primaryColumns(): string[] {
      const instrument = ["Follow Stock", "stockCode", "symbol", "stockId", "Leader Stock"]
        .map(key => this.columns.find(col => col.toLowerCase() === key.toLowerCase()))
        .find(Boolean);
      const exitReason = this.columns.find(col =>
        ["sell type", "exitreason", "sellreason"].includes(col.toLowerCase())
      );
      const strategy = this.columns.find(col => col === "StrategyName");
      const rate = this.columns.find(col => this.isRateOfReturnColumn(col));
      return [this.dateKey, instrument, rate, strategy, exitReason].filter((col): col is string => !!col);
    },

    detailColumns(): string[] {
      return this.columns.filter(col => !this.primaryColumns.includes(col));
    },

    defaultSort(): any {
      if (!this.dateKey) return undefined;
      return { prop: this.dateKey, order: "descending" };
    },
  },

  methods: {
    openDetails(row: AnyRow) {
      this.detailTrade = row;
      this.detailsVisible = true;
    },

    async reload() {
      await this.getList();
    },

    async onStrategyIdChanged() {
      await this.getList();
    },

    async loadStocks() {
      try {
        const client = new StockInfoClient(undefined, ApiService.vueInstance.axios);
        const result = await client.stockInfoGetList(undefined, 0, 1000);
        this.stockMap.clear();
        if (result.items) {
          for (const stock of result.items) {
            // Handle both id/Id and name/Name (PascalCase from ABP)
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

    async loadStrategies() {
      try {
        const client = new FundStrategyClient(undefined, ApiService.vueInstance.axios);
        const result = await client.fundStrategyGetList(undefined, 0, 1000);
        this.strategyMap.clear();
        this.strategies = [];
        console.log("Raw strategy result:", result);
        if (result.items) {
          for (const strategy of result.items) {
            // Handle both id and Id (PascalCase from ABP)
            const strategyId = (strategy as any).id ?? (strategy as any).Id;
            const strategyName = (strategy as any).name ?? (strategy as any).Name;

            if (strategyId !== undefined && strategyName) {
              this.strategyMap.set(String(strategyId), strategyName);
              this.strategies.push({ id: strategyId, name: strategyName });
            }
          }
        }
        console.log("Strategy Map loaded:", this.strategyMap);
        console.log("Strategy Map size:", this.strategyMap.size);
        console.log("Strategy Map entries:", Array.from(this.strategyMap.entries()));
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
        console.log("SellType Map loaded:", this.sellTypeMap);
      } catch (e) {
        console.error("Failed to load sell types", e);
      }
    },

    async getList() {
      this.loading = true;
      try {
        const params: Record<string, any> = {
          SkipCount: 0,
          MaxResultCount: 1000,
        };

        if (this.selectedStrategyId) {
          params.StrategyId = this.selectedStrategyId;
        }

        const res = await ApiService.vueInstance.axios.get("/api/app/fund-trade-history", { params });
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

        this.rows = items;
        this.totalCount = total;

        this.refreshKeys();
      } catch (e) {
        console.error("Failed to load tblFundTradeHistory", e);
        this.rows = [];
        this.totalCount = 0;
        this.columns = [];
        this.strategyIdKey = "";
        this.dateKey = "";
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

      this.strategyIdKey = strategyIdKey;
      this.dateKey = dateKey;

      // Transform column names
      const transformColumnName = (col: string): string => {
        const lc = col.toLowerCase();
        if (col === strategyIdKey) return "StrategyName";
        if (lc === "mainleader") return "Leader Stock";
        if (lc === "followstock") return "Follow Stock";
        if (lc === "selltype") return "Sell Type";
        return col;
      };

      // Put date + strategyId columns first (if present)
      const ordered: string[] = [];
      if (dateKey) ordered.push(dateKey);
      if (strategyIdKey && strategyIdKey !== dateKey) ordered.push(strategyIdKey);

      for (const k of all) {
        if (!ordered.includes(k)) ordered.push(k);
      }

      // Transform all column names
      this.columns = ordered.map(transformColumnName);

    },

    getOriginalColumnName(displayName: string): string {
      const originalNames: Record<string, string> = {
        StrategyName: this.strategyIdKey,
        "Leader Stock": "mainleader",
        "Follow Stock": "followstock",
        "Sell Type": "selltype",
      };
      const original = originalNames[displayName];
      if (!original || displayName === "StrategyName") return original || displayName;
      for (const row of this.rows) {
        const key = Object.keys(row).find(key => key.toLowerCase() === original);
        if (key) return key;
      }
      return displayName;
    },

    columnLabel(col: string): string {
      if (this.isDateColumn(col) && col === this.dateKey) return "Trade date";
      if (this.isRateOfReturnColumn(col)) return "Return";
      if (col === "StrategyName") return "Strategy";
      if (["follow stock", "stockcode", "stockid", "symbol"].includes(col.toLowerCase())) return "Instrument";
      if (["sell type", "exitreason", "sellreason"].includes(col.toLowerCase())) return "Exit reason";
      return col.replace(/([a-z])([A-Z])/g, "$1 $2");
    },

    formatCell(row: AnyRow, col: string, useLeaderFallback = false): string {
      const value = row[this.getOriginalColumnName(col)];
      if (useLeaderFallback && col === "Follow Stock" && !value) {
        return this.formatValue(row[this.getOriginalColumnName("Leader Stock")], "Leader Stock");
      }
      if (this.isDateColumn(col)) return this.formatDate(value);
      if (this.isRateOfReturnColumn(col)) return this.formatPercentage(value);
      return this.formatValue(value, col);
    },

    returnClass(value: any): string {
      const rate = Number(value);
      if (rate > 0) return "positive";
      if (rate < 0) return "negative";
      return "";
    },

    isDateColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === (this.dateKey || "").toLowerCase() || lc.includes("date");
    },

    isRateOfReturnColumn(col: string): boolean {
      const lc = (col || "").toLowerCase();
      return lc === "rateorreturn" || lc === "rateofreturn";
    },

    formatDate(value: any): string {
      if (!value) return "—";
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString();
    },

    formatPercentage(value: any): string {
      if (value === null || value === undefined || value === "") return "—";
      const rate = Number(value);
      if (!Number.isFinite(rate)) return "—";
      return new Intl.NumberFormat(undefined, {
        style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero",
      }).format(rate);
    },

    formatValue(value: any, col: string): string {
      if (value === null || value === undefined || value === "") return "—";

      const lc = col.toLowerCase();

      // Transform strategyId to strategy name
      if (lc === "strategyname") {
        const strategyId = String(value).trim();
        const name = this.strategyMap.get(strategyId);
        return name || String(value);
      }

      // Transform stock codes to stock names
      if (lc === "leader stock" || lc === "follow stock") {
        const stockCode = String(value).trim();
        const stockName = this.stockMap.get(stockCode);
        return stockName ? stockCode + " · " + stockName : stockCode;
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
      if (this.isDateColumn(col)) return 104;
      if (this.isRateOfReturnColumn(col)) return 88;
      return col === "StrategyName" ? 140 : 96;
    },

    getRowKey(row: AnyRow, index: number): string | number {
      if (row && (row.id !== undefined && row.id !== null)) return row.id;
      if (row && (row.Id !== undefined && row.Id !== null)) return row.Id;
      return index;
    },
  },

  async mounted() {
    await Promise.all([this.loadStocks(), this.loadStrategies(), this.loadSellTypes()]);
    await this.getList();
  },
});
</script>

<style scoped>
.history-workspace {
  min-width: 0;
}

.history-workspace .filter-bar {
  padding: 0;
  gap: 8px;
  margin: 0 0 8px;
  border: 0;
  background: none;
  box-shadow: none;
  flex-wrap: wrap;
}

.filter-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.flex-1 {
  flex: 1;
}

.strategy-select {
  width: min(220px, 56vw);
  min-width: 0;
}

.results-count,
.trade-details dt {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.trade-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 128px), 1fr));
  gap: 8px 16px;
  margin: 0;
  padding: 8px 12px;
  background: var(--color-surface-variant);
}

.trade-details dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.positive {
  color: var(--data-gain, var(--finance-green));
}

.negative {
  color: var(--data-loss, var(--finance-red));
}
</style>
