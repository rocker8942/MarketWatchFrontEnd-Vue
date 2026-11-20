<template>
  <div class="data-workspace">
    <PageHeader title="Stock Prices" />

    <div class="quote-toolbar">
      <el-autocomplete
        v-model="searchQuery"
        :fetch-suggestions="querySearch"
        placeholder="Search by symbol or company"
        aria-label="Search by symbol or company"
        class="quote-search"
        clearable
        fit-input-width
        value-key="code"
        @select="handleStockSelect"
        @keyup.enter="handleSearch"
        @clear="handleSearch">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #default="{ item }">
          <span class="suggestion"><strong>{{ item.code }}</strong> {{ item.name }}</span>
        </template>
      </el-autocomplete>
      <el-button type="primary" class="quote-search-button" @click="handleSearch">Search</el-button>
      <button class="quote-mobile-only sort-button" type="button" @click="sortBy('date')">
        Date {{ sortIndicator('date') }}
      </button>
    </div>

    <p v-if="loadError" role="alert" class="quote-feedback">{{ loadError }}</p>
    <div class="quote-grid" :aria-busy="loading">
      <table class="quote-table compact-table">
        <thead>
          <tr>
            <th scope="col" :aria-sort="sortState('name')">
              <button class="sort-button" type="button" @click="sortBy('name')">
                Instrument {{ sortIndicator('name') }}
              </button>
            </th>
            <th scope="col" class="number">Price</th>
            <th scope="col" class="quote-desktop-only quote-date" :aria-sort="sortState('date')">
              <button class="sort-button" type="button" @click="sortBy('date')">
                As of {{ sortIndicator('date') }}
              </button>
            </th>
            <th scope="col" class="quote-desktop-only quote-volume number">Volume</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, index) in formattedProducts" :key="row.id ?? index">
            <tr>
              <td>
                <div class="quote-instrument">
                  <RouterLink
                    v-if="row.code"
                    :to="{ name: 'stockChart', query: { stockCode: row.code } }"
                    class="quote-symbol">
                    {{ row.code }}
                  </RouterLink>
                  <span class="quote-name" :title="row.name">{{ row.name || '—' }}</span>
                  <button
                    type="button"
                    class="quote-mobile-only details-button"
                    :aria-label="'Quote details for ' + (row.code || row.name || 'instrument')"
                    :aria-expanded="expandedIndex === index"
                    :aria-controls="'quote-detail-' + index"
                    @click="expandedIndex = expandedIndex === index ? null : index">
                    <span aria-hidden="true">{{ expandedIndex === index ? '−' : '+' }}</span>
                  </button>
                </div>
              </td>
              <td class="number">{{ formatCurrency(row.currentPrice, row.currencyCode) }}</td>
              <td class="quote-desktop-only quote-date">{{ row.date }}</td>
              <td class="quote-desktop-only quote-volume number">{{ row.volume }}</td>
            </tr>
            <tr v-show="expandedIndex === index" :id="'quote-detail-' + index" class="quote-mobile-only detail-row">
              <td colspan="2">
                <dl class="quote-details">
                  <div v-if="row.name"><dt>Company</dt><dd>{{ row.name }}</dd></div>
                  <div><dt>As of</dt><dd>{{ row.date }}</dd></div>
                  <div><dt>Volume</dt><dd>{{ row.volume }}</dd></div>
                </dl>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <p v-if="loading && !formattedProducts.length" class="quote-feedback" role="status">Loading quotes…</p>
      <p v-else-if="!formattedProducts.length && !loadError" class="quote-feedback" role="status">
        {{ appliedSearch ? 'No quotes match this search.' : 'No quotes available.' }}
      </p>
    </div>

    <div v-if="totalCount" class="quote-pagination">
      <span>{{ totalCount.toLocaleString() }} {{ totalCount === 1 ? 'quote' : 'quotes' }}</span>
      <el-pagination
        v-if="totalCount > pageSize"
        layout="prev, pager, next, jumper"
        :pager-count="5"
        :total="totalCount"
        :page-size="pageSize"
        :current-page="currentPage"
        @update:current-page="handlePageChange" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import moment from "moment";
import PageHeader from "@/components/PageHeader.vue";
import ApiService from "@/core/services/apiService";
import { StockInfoClient, StockPriceClient } from "@/core/services/marketWatchClient";
import type { StockPriceDto } from "@/core/services/marketWatchClient";
import { formatStockPrice } from "@/core/services/stockCurrency";

type QuoteSort = "name" | "date";
type StockSuggestion = { code: string; name: string };
const quoteSortColumns: Record<QuoteSort, string> = { name: "StockInfo.Name", date: "Date" };

export default defineComponent({
  components: { PageHeader, RouterLink, Search },

  data() {
    return {
      products: [] as StockPriceDto[],
      pageSize: 25,
      currentPage: 1,
      totalCount: 0,
      sortField: null as QuoteSort | null,
      sortOrder: "asc" as "asc" | "desc",
      searchQuery: "",
      appliedSearch: "",
      recentStocks: [] as StockSuggestion[],
      expandedIndex: null as number | null,
      loadError: "",
      loading: false,
      requestVersion: 0,
    };
  },

  computed: {
    formattedProducts() {
      return this.products.map((product) => {
        const date = moment.utc(product.date);
        return {
          ...product,
          date: product.date && date.isValid() ? date.format("YYYY-MM-DD") : "—",
          volume: typeof product.volume === "number" && Number.isFinite(product.volume)
            ? product.volume.toLocaleString("en-US")
            : "—",
        };
      });
    },
  },

  methods: {
    async getList() {
      const version = ++this.requestVersion;
      this.loading = true;
      this.loadError = "";
      this.expandedIndex = null;

      try {
        const stockClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
        const sorting = this.sortField
          ? quoteSortColumns[this.sortField] + " " + this.sortOrder + ", Id " + this.sortOrder
          : undefined;
        const response = await stockClient.stockPriceGetStockPriceWithDetails(
          sorting,
          (this.currentPage - 1) * this.pageSize,
          this.pageSize,
          this.appliedSearch || undefined,
          undefined,
          undefined
        );
        if (version !== this.requestVersion) return;
        this.products = response.items ?? [];
        this.totalCount = response.totalCount ?? 0;
      } catch (error) {
        if (version !== this.requestVersion) return;
        this.products = [];
        this.totalCount = 0;
        this.loadError = "Could not load quotes. Search again to retry.";
        console.error("Could not load quotes", error);
      } finally {
        if (version === this.requestVersion) this.loading = false;
      }
    },

    formatCurrency: formatStockPrice,

    handlePageChange(page: number) {
      this.currentPage = page;
      void this.getList();
    },

    sortState(field: QuoteSort) {
      if (this.sortField !== field) return undefined;
      return this.sortOrder === "asc" ? "ascending" as const : "descending" as const;
    },

    sortIndicator(field: QuoteSort) {
      if (this.sortField !== field) return "";
      return this.sortOrder === "asc" ? "↑" : "↓";
    },

    sortBy(field: QuoteSort) {
      this.sortOrder = this.sortField === field
        ? (this.sortOrder === "asc" ? "desc" : "asc")
        : (field === "date" ? "desc" : "asc");
      this.sortField = field;
      this.currentPage = 1;
      void this.getList();
    },

    handleSearch() {
      const query = this.searchQuery.trim();
      const normalized = query.toLowerCase();
      const exactCode = this.recentStocks.find((stock) => stock.code.toLowerCase() === normalized);
      const companyMatches = query ? this.recentStocks.filter((stock) => stock.name.toLowerCase() === normalized) : [];
      const filter = exactCode?.code ?? (companyMatches.length === 1 ? companyMatches[0].code : query);
      if (this.loading && this.currentPage === 1 && this.appliedSearch === filter) return;
      this.appliedSearch = filter;
      this.currentPage = 1;
      void this.getList();
    },

    async loadRecentStocks() {
      try {
        const stockInfoClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);
        const response = await stockInfoClient.stockInfoGetList("name asc", 0, 1000);
        this.recentStocks = response.items?.map((item) => ({
          code: item.id ?? "",
          name: item.name ?? "",
        })) ?? [];
      } catch (error) {
        console.error("Could not load quote search suggestions", error);
      }
    },

    querySearch(queryString: string, callback: (suggestions: StockSuggestion[]) => void) {
      const query = queryString.toLowerCase();
      callback(this.recentStocks.filter((stock) =>
        stock.code.toLowerCase().includes(query) || stock.name.toLowerCase().includes(query)
      ));
    },

    handleStockSelect(item: StockSuggestion) {
      this.searchQuery = item.code;
      this.handleSearch();
    },
  },

  mounted() {
    void this.loadRecentStocks();
    void this.getList();
  },
});
</script>

<style scoped>
.quote-toolbar,
.quote-pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.quote-pagination :deep(.el-pagination) {
  flex-wrap: wrap;
  max-width: 100%;
}

.quote-toolbar {
  flex-wrap: nowrap;
  margin-bottom: 12px;
}

.quote-search {
  flex: 1 1 0;
  min-width: 0;
  max-width: 360px;
}

.quote-search-button {
  --el-button-bg-color: var(--finance-blue-dark);
  --el-button-border-color: var(--finance-blue-dark);
  --el-button-hover-bg-color: var(--finance-blue);
  --el-button-hover-border-color: var(--finance-blue);
}

.suggestion strong {
  margin-right: 6px;
  color: var(--color-heading);
}

.quote-grid {
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  background: var(--color-background-card);
  overflow: hidden;
}

.quote-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.quote-table th,
.quote-table td {
  padding: 5px 10px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: left;
  overflow-wrap: anywhere;
}

.quote-table th {
  height: 32px;
  background: var(--color-surface-variant);
  color: var(--color-heading);
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}

.quote-table td {
  height: 34px;
}

.quote-table tbody tr:last-child > td {
  border-bottom: 0;
}

.quote-table tbody tr:hover {
  background: var(--color-surface-variant);
}

.quote-table .number {
  width: 20%;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.quote-table .quote-date,
.quote-table .quote-volume {
  width: 17%;
  font-variant-numeric: tabular-nums;
}

.sort-button,
.details-button {
  color: var(--color-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
}

.sort-button {
  padding: 0;
  font-weight: 600;
  text-align: left;
}

.sort-button:hover,
.quote-symbol:hover {
  text-decoration: underline;
}

.quote-instrument {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.quote-symbol {
  color: var(--color-primary);
  font-weight: 600;
}

.quote-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote-pagination {
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.quote-feedback {
  margin: 0;
  padding: 12px;
}

.quote-mobile-only {
  display: none;
}

@media (max-width: 560px) {
  .quote-desktop-only {
    display: none;
  }

  button.quote-mobile-only {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    min-width: 28px;
  }

  .detail-row {
    display: table-row;
  }

  .quote-table th,
  .quote-table td {
    padding: 4px 8px;
  }

  .quote-table .number {
    width: 36%;
  }

  .quote-instrument {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 4px;
    line-height: 1.2;
  }

  .quote-name {
    grid-row: 2;
    color: var(--color-text-secondary);
  }

  .details-button {
    grid-area: 1 / 2 / span 2 / auto;
    font-size: 1rem;
  }

  .quote-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin: 4px 0;
  }

  .quote-details div {
    display: flex;
    gap: 6px;
  }

  .quote-details dt {
    color: var(--color-text-secondary);
  }

  .quote-details dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
}
</style>
