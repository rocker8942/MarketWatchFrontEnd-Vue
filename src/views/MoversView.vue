<template>
  <div class="data-workspace">
    <PageHeader title="Market Movers" />

    <div class="movers-toolbar">
      <label>
        <span>Period</span>
        <select v-model="selectedPeriod" @change="loadMovers">
          <option v-for="period in periods" :key="period.code" :value="period.code">{{ period.label }}</option>
        </select>
      </label>
      <label>
        <span>Country</span>
        <select v-model="selectedCountry" @change="loadMovers">
          <option value="All">All markets</option>
          <option value="US">US</option>
          <option value="AU">Australia</option>
          <option value="Korea">Korea</option>
        </select>
      </label>
      <div class="ranking-switch" role="group" aria-label="Mover ranking">
        <button
          v-for="ranking in rankings"
          :key="ranking.id"
          type="button"
          :aria-pressed="selectedRanking === ranking.id"
          @click="selectedRanking = ranking.id">
          {{ ranking.label }}
        </button>
      </div>
    </div>

    <p v-if="loadError" class="movers-feedback" role="alert">
      Could not load movers. <button type="button" @click="loadMovers">Retry</button>
    </p>
    <p v-else-if="loading" class="movers-feedback" role="status">Loading movers…</p>

    <div class="movers-grid" :aria-busy="loading">
      <section
        v-for="ranking in rankings"
        :key="ranking.id"
        class="ranking"
        :class="{ 'active-ranking': selectedRanking === ranking.id }"
        :aria-labelledby="'movers-' + ranking.id">
        <h2 :id="'movers-' + ranking.id">{{ ranking.label }}</h2>
        <table class="compact-table movers-table">
          <thead>
            <tr>
              <th scope="col" class="rank-number">#</th>
              <th scope="col">Instrument</th>
              <th scope="col" class="last-price number">Last</th>
              <th scope="col" class="change-column number">Change</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, index) in ranking.rows" :key="row.code">
              <tr>
                <td class="rank-number">{{ index + 1 }}</td>
                <td>
                  <div class="mover-instrument">
                    <RouterLink
                      :to="{ name: 'stockChart', query: { stockCode: row.code } }"
                      class="mover-symbol">
                      {{ row.code }}
                    </RouterLink>
                    <span class="mover-name" :title="row.name">{{ row.name || '—' }}</span>
                    <button
                      type="button"
                      class="mover-detail-toggle"
                      :aria-label="'Price details for ' + row.code"
                      :aria-expanded="expandedDetails[ranking.id] === row.code"
                      :aria-controls="ranking.id + '-detail-' + index"
                      @click="toggleDetails(ranking.id, row.code)">
                      <span aria-hidden="true">{{ expandedDetails[ranking.id] === row.code ? '−' : '+' }}</span>
                    </button>
                  </div>
                </td>
                <td class="number">{{ formatCurrency(row.currentPrice, row.currencyCode) }}</td>
                <td class="number mover-change" :class="changeClass(row.changePercent)">
                  {{ formatPercent(row.changePercent) }}
                </td>
              </tr>
              <tr
                v-show="expandedDetails[ranking.id] === row.code"
                :id="ranking.id + '-detail-' + index"
                class="mover-detail-row">
                <td colspan="4">
                  <div class="mover-details">
                    <span v-if="row.name">{{ row.name }}</span>
                    <span>Previous price <strong>{{ formatCurrency(row.previousPrice, row.currencyCode) }}</strong></span>
                    <a :href="whyMovedUrl(row, ranking.id)" target="_blank" rel="noopener noreferrer">
                      Research this move
                    </a>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <p v-if="!loading && !loadError && !ranking.rows.length" class="movers-feedback">
          No {{ ranking.label.toLowerCase() }} for this period and market.
        </p>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import ApiService from "@/core/services/apiService";
import { formatStockPrice } from "@/core/services/stockCurrency";

type RankingId = "gainers" | "losers";

interface MoverEntry {
  code: string;
  name: string;
  currencyCode?: string | null;
  currentPrice?: number | null;
  previousPrice?: number | null;
  changePercent?: number | null;
}

interface MoversResponse {
  topGainers?: MoverEntry[];
  topLosers?: MoverEntry[];
}

const periods = [
  { code: "7d", label: "7 days" },
  { code: "1m", label: "1 month" },
  { code: "6m", label: "6 months" },
  { code: "1y", label: "1 year" },
];

export default defineComponent({
  components: { PageHeader, RouterLink },

  data() {
    return {
      periods,
      selectedPeriod: "7d",
      selectedCountry: "All",
      selectedRanking: "gainers" as RankingId,
      expandedDetails: { gainers: null, losers: null } as Record<RankingId, string | null>,
      loading: false,
      loadError: false,
      requestVersion: 0,
      topGainers: [] as MoverEntry[],
      topLosers: [] as MoverEntry[],
    };
  },

  computed: {
    rankings(): { id: RankingId; label: string; rows: MoverEntry[] }[] {
      return [
        { id: "gainers", label: "Gainers", rows: this.topGainers },
        { id: "losers", label: "Losers", rows: this.topLosers },
      ];
    },
  },

  methods: {
    async loadMovers() {
      const version = ++this.requestVersion;
      this.loading = true;
      this.loadError = false;
      this.topGainers = [];
      this.topLosers = [];
      this.expandedDetails = { gainers: null, losers: null };

      try {
        const params = {
          period: this.selectedPeriod,
          country: this.selectedCountry === "All" ? undefined : this.selectedCountry,
        };
        const { data } = await ApiService.vueInstance.axios.get<MoversResponse>("/api/app/stock-price/movers", { params });
        if (version !== this.requestVersion) return;
        this.topGainers = data.topGainers ?? [];
        this.topLosers = data.topLosers ?? [];
      } catch (error) {
        if (version !== this.requestVersion) return;
        this.loadError = true;
        console.error("Could not load movers", error);
      } finally {
        if (version === this.requestVersion) this.loading = false;
      }
    },

    formatCurrency: formatStockPrice,

    formatPercent(value?: number | null) {
      if (typeof value !== "number" || !Number.isFinite(value)) return "—";
      const sign = value > 0 ? "+" : value < 0 ? "−" : "";
      return sign + Math.abs(value).toFixed(2) + "%";
    },

    changeClass(value?: number | null) {
      if (typeof value !== "number" || !Number.isFinite(value) || value === 0) return "";
      return value > 0 ? "positive" : "negative";
    },

    toggleDetails(ranking: RankingId, code: string) {
      this.expandedDetails[ranking] = this.expandedDetails[ranking] === code ? null : code;
    },

    whyMovedUrl(row: MoverEntry, ranking: RankingId) {
      const direction = ranking === "gainers" ? "rise" : "fall";
      const period = this.periods.find(({ code }) => code === this.selectedPeriod)?.label ?? this.selectedPeriod;
      const market = this.selectedCountry === "All" ? "" : " " + this.selectedCountry + " market";
      const magnitude = typeof row.changePercent === "number" && Number.isFinite(row.changePercent)
        ? " " + Math.abs(row.changePercent).toFixed(2) + "%"
        : "";
      const query = "why did " + (row.name || row.code) + " (" + row.code + ") stock price " + direction + magnitude + " over the last " + period + market;
      return "https://www.google.com/search?q=" + encodeURIComponent(query);
    },
  },

  mounted() {
    void this.loadMovers();
  },
});
</script>

<style scoped>
.movers-toolbar,
.movers-toolbar label,
.ranking-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.movers-toolbar {
  flex-wrap: wrap;
  margin-bottom: 12px;
  gap: 8px 16px;
}

.movers-toolbar label {
  font-size: 0.8125rem;
  font-weight: 600;
}

.movers-toolbar select,
.ranking-switch button {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background-card);
  color: var(--color-text);
  min-height: 32px;
  padding: 0 8px;
  font: inherit;
}

.ranking-switch {
  display: none;
}

.movers-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ranking {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-background-card);
}

.ranking h2 {
  margin: 0;
  padding: 7px 10px;
  font-size: 0.9375rem;
  font-weight: 650;
  line-height: 1.4;
}

.movers-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.movers-table th,
.movers-table td {
  padding: 3px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: left;
  overflow-wrap: anywhere;
}

.movers-table th {
  height: 32px;
  background: var(--color-surface-variant);
  color: var(--color-heading);
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}

.movers-table td {
  height: 34px;
}

.movers-table .rank-number {
  width: 34px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.movers-table .number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.movers-table .last-price {
  width: 24%;
}

.movers-table .change-column {
  width: 15%;
}

.mover-instrument {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.mover-symbol,
.mover-details a {
  color: var(--color-primary);
  font-weight: 600;
}

.mover-symbol:hover,
.mover-details a:hover {
  text-decoration: underline;
}

.mover-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-secondary);
}

.mover-detail-toggle,
.movers-feedback button {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  cursor: pointer;
}

.mover-detail-toggle {
  flex: none;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 1rem;
}

.mover-detail-toggle:hover {
  background: var(--color-surface-variant);
}

.mover-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.mover-details strong {
  margin-left: 5px;
  font-variant-numeric: tabular-nums;
}

.mover-detail-row td {
  background: var(--color-surface-variant);
}

.mover-change {
  font-weight: 650;
}

.movers-feedback {
  margin: 0;
  padding: 10px;
  font-size: 0.8125rem;
}

.movers-feedback button {
  padding: 0;
  text-decoration: underline;
}

@media (max-width: 760px) {
  .movers-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .ranking-switch {
    display: flex;
  }

  .ranking-switch button {
    min-height: 36px;
    cursor: pointer;
    font-size: 0.8125rem;
  }

  .ranking-switch button[aria-pressed="true"] {
    background: var(--color-surface-variant);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 650;
  }

  .ranking:not(.active-ranking),
  .ranking h2 {
    display: none;
  }

  .movers-toolbar select {
    min-height: 36px;
  }

  .movers-table .last-price {
    width: 31%;
  }

  .movers-table .change-column {
    width: 21%;
  }

  .mover-instrument {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 2px;
    line-height: 1.2;
  }

  .mover-name {
    grid-row: 2;
  }

  .mover-detail-toggle {
    grid-area: 1 / 2 / span 2 / auto;
    width: 28px;
    height: 32px;
  }
}
</style>
