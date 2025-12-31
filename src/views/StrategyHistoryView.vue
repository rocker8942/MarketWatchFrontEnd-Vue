<template>
  <div class="analysis-container">
    <div class="page-header">
      <h1>Strategy History</h1>
      <p class="page-subtitle">Data from tblFundTradeHistory</p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <el-select
        v-model="selectedStrategyId"
        clearable
        filterable
        placeholder="Filter by strategy name"
        class="min-w-[220px]"
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

      <div class="text-sm text-gray-500">
        {{ totalCount }} rows
      </div>
    </div>

    <div class="table-section">
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="rows"
          class="professional-table"
          stripe
          :default-sort="defaultSort"
          :header-cell-style="{ background: 'var(--color-surface-variant)', color: 'var(--color-heading)', fontWeight: '600' }"
          :row-key="getRowKey">
          <el-table-column
            v-for="col in columns"
            :key="col"
            :prop="getOriginalColumnName(col)"
            :label="col"
            :min-width="getMinWidth(col)"
            :sortable="isDateColumn(col)">
            <template #default="scope">
              <span v-if="isDateColumn(col)">{{ formatDate(scope.row[getOriginalColumnName(col)]) }}</span>
              <span v-else-if="isRateOfReturnColumn(col)">{{ formatPercentage(scope.row[getOriginalColumnName(col)]) }}</span>
              <span v-else>{{ formatValue(scope.row[getOriginalColumnName(col)], col) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { FundStrategyClient, StockInfoClient } from "@/core/services/marketWatchClient";

type AnyRow = Record<string, any>;

export default defineComponent({
  data() {
    return {
      rows: [] as AnyRow[],
      totalCount: 0,
      loading: false,
      selectedStrategyId: "" as number | "",
      strategyIds: [] as string[],
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
    defaultSort(): any {
      if (!this.dateKey) return undefined;
      return { prop: this.dateKey, order: "descending" };
    },
  },

  methods: {
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
        this.strategyIds = [];
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

      console.log("All column keys:", all);
      console.log("Strategy ID key found:", strategyIdKey);
      if (this.rows.length > 0) {
        console.log("Sample row:", this.rows[0]);
      }

      this.strategyIdKey = strategyIdKey;
      this.dateKey = dateKey;

      // Transform column names
      const transformColumnName = (col: string): string => {
        const lc = col.toLowerCase();
        if (lc === "strategyid") return "StrategyName";
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
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString();
    },

    formatPercentage(value: any): string {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value !== "number") return String(value);
      // Convert to percentage with 2 decimal points
      return (value * 100).toFixed(2) + "%";
    },

    formatValue(value: any, col: string): string {
      if (value === null || value === undefined || value === "") return "—";

      const lc = col.toLowerCase();

      // Transform strategyId to strategy name
      if (lc === "strategyname") {
        const strategyId = String(value).trim();
        const name = this.strategyMap.get(strategyId);
        console.log(`Looking up strategy ID: "${strategyId}" (type: ${typeof value}), found: "${name}"`);
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
      if (this.isDateColumn(col)) return 180;
      const lc = col.toLowerCase();
      if (lc.includes("id")) return 90;
      if (lc.includes("price") || lc.includes("rate") || lc.includes("nav")) return 130;
      return 140;
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
</style>
