<template>
  <div class="data-workspace market-dashboard">
    <PageHeader title="Market Dashboard" />
    <div class="market-dashboard-grid">
      <section class="market-watchlist" aria-label="Market snapshot">
        <table class="market-snapshot">
          <thead>
            <tr>
              <th scope="col">Instrument</th>
              <th scope="col" class="market-number">Latest</th>
              <th scope="col" class="market-number" aria-label="One-session change">1-session Δ</th>
              <th scope="col" class="market-date">As of</th>
              <th scope="col" class="market-trend">20 sessions</th>
            </tr>
          </thead>
          <tbody v-for="group in marketGroups" :key="group.label">
            <tr class="market-group">
              <th scope="rowgroup" colspan="5">{{ group.label }}</th>
            </tr>
            <tr v-for="instrument in group.instruments" :key="instrument.code"
              :class="{ 'market-selected': instrument.code === selectedCode }">
              <th scope="row">
                <button type="button" class="market-instrument"
                  :aria-pressed="instrument.code === selectedCode"
                  aria-controls="market-detail"
                  @click="selectedCode = instrument.code">
                  <strong>{{ instrument.code }}</strong>
                  <span>{{ instrument.name }}</span>
                </button>
              </th>
              <td class="market-number">
                {{ formatValue(instrument.latest?.value, instrument.unit) }}
                <time v-if="instrument.latest" class="market-mobile-date"
                  :datetime="instrument.latest.date">{{ instrument.latest.date }}</time>
              </td>
              <td class="market-number" :class="changeClass(instrument.change)">
                {{ formatChange(instrument.change, instrument.unit) }}
              </td>
              <td class="market-date">
                <time v-if="instrument.latest" :datetime="instrument.latest.date">{{ instrument.latest.date }}</time>
                <span v-else>—</span>
              </td>
              <td class="market-trend">
                <SparklineChart v-if="instrument.sparkline.length > 2" aria-hidden="true"
                  :data="instrument.sparkline" :height="22" />
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="market-note">Change compares the latest two recorded sessions. Funds and ETFs use USD adjusted closes.</p>
      </section>

      <section id="market-detail" class="market-chart-panel" aria-labelledby="market-detail-title">
        <header class="market-chart-heading">
          <div>
            <h2 id="market-detail-title">{{ selectedInstrument.name }}</h2>
            <p>{{ selectedInstrument.code }} · {{ unitLabels[selectedInstrument.unit] }}</p>
          </div>
          <div v-if="selectedInstrument.latest" class="market-chart-quote">
            <strong>{{ formatValue(selectedInstrument.latest.value, selectedInstrument.unit) }}</strong>
            <span :class="changeClass(selectedInstrument.change)">{{ formatChange(selectedInstrument.change, selectedInstrument.unit) }}</span>
          </div>
        </header>
        <LineChart v-if="selectedInstrument.chart.length > 2" :key="selectedCode"
          :data="selectedInstrument.chart" :height="320" :smooth="false" show-data-zoom />
        <p v-else class="market-chart-state" role="status">{{ chartStatus }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import LineChart from "@/components/charts/LineChart.vue";
import SparklineChart from "@/components/charts/SparklineChart.vue";
import ApiService from "@/core/services/apiService";
import { StockPriceClient, type StockChartDto } from "@/core/services/marketWatchClient";

type Unit = "index" | "usd" | "yield";
type Instrument = { code: string; name: string; unit: Unit };
type Observation = { date: string; value: number };

const unitLabels: Record<Unit, string> = {
  yield: "Yield (%)",
  usd: "Adjusted close (USD)",
  index: "Index level (pts)",
};

const groups: { label: string; instruments: Instrument[] }[] = [
  {
    label: "Equity indexes",
    instruments: [
      { code: "^GSPC", name: "S&P 500", unit: "index" },
      { code: "^FTSE", name: "FTSE 100", unit: "index" },
    ],
  },
  {
    label: "Regional ETFs",
    instruments: [
      { code: "FXI", name: "China Large-Cap ETF", unit: "usd" },
      { code: "EWY", name: "South Korea ETF", unit: "usd" },
      { code: "EWA", name: "Australia ETF", unit: "usd" },
    ],
  },
  {
    label: "Currency, gold and rates",
    instruments: [
      { code: "UUP", name: "US Dollar Bullish Fund", unit: "usd" },
      { code: "GLD", name: "SPDR Gold Shares", unit: "usd" },
      { code: "^TYX", name: "30-Year Treasury Yield", unit: "yield" },
    ],
  },
];

const selectedCode = ref(groups[0].instruments[0].code);
const observations = ref<Record<string, Observation[]>>({});
const failedSymbols = ref(new Set<string>());
const decimal = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function normalizeHistory(history: StockChartDto[]): Observation[] {
  const byDate = new Map<string, number>();
  for (const row of history) {
    if (!row.date || !Number.isFinite(row.date.getTime()) || typeof row.adjClosePrice !== "number" || !Number.isFinite(row.adjClosePrice)) continue;
    const date = row.date.toISOString().slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, row.adjClosePrice);
  }
  return [...byDate]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([date, value]) => ({ date, value }));
}

function chartRows(series: Observation[], label: string) {
  return [["Date", label], ...series.map(({ date, value }) => [date, value])];
}

const marketGroups = computed(() => groups.map(group => ({
  label: group.label,
  instruments: group.instruments.map(instrument => {
    const series = observations.value[instrument.code] ?? [];
    const latest = series[series.length - 1];
    const previous = series[series.length - 2];
    let change: number | null = null;
    if (latest && previous) {
      if (instrument.unit === "yield") change = (latest.value - previous.value) * 100;
      else if (previous.value > 0) change = (latest.value / previous.value - 1) * 100;
    }
    const label = unitLabels[instrument.unit];
    return {
      ...instrument, latest, change,
      chart: chartRows(series, label),
      sparkline: chartRows(series.slice(-20), label),
    };
  }),
})));

const selectedInstrument = computed(() =>
  marketGroups.value.flatMap(group => group.instruments).find(instrument => instrument.code === selectedCode.value)
    ?? marketGroups.value[0].instruments[0]
);

const chartStatus = computed(() => {
  if (failedSymbols.value.has(selectedCode.value)) return "Market data could not be loaded.";
  if (!observations.value[selectedCode.value]) return "Loading market data…";
  return "At least two observations are needed to plot this instrument.";
});

function formatValue(value: number | undefined, unit: Unit): string {
  if (value === undefined) return "—";
  if (unit === "yield") return `${decimal.format(value)}%`;
  return unit === "usd" ? `USD ${decimal.format(value)}` : `${decimal.format(value)} pts`;
}

function formatChange(value: number | null, unit: Unit): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const magnitude = Math.abs(value);
  const sign = magnitude >= 0.005 ? (value > 0 ? "+" : "−") : "";
  return `${sign}${decimal.format(magnitude)}${unit === "yield" ? " bp" : "%"}`;
}

function changeClass(value: number | null) {
  return {
    "market-gain": value !== null && value >= 0.005,
    "market-loss": value !== null && value <= -0.005,
  };
}

onMounted(async () => {
  const client = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
  await Promise.all(groups.flatMap(group => group.instruments).map(async ({ code }) => {
    try {
      observations.value[code] = normalizeHistory(await client.stockPriceGetStockPriceByCode("date desc", 0, 1000, code));
    } catch {
      failedSymbols.value.add(code);
    }
  }));
});
</script>

<style scoped>
.market-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}

.market-watchlist, .market-chart-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
}

.market-snapshot {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.market-snapshot th, .market-snapshot td {
  padding: 4px 8px;
  text-align: left;
  border-bottom: 1px solid var(--color-border-subtle);
}

.market-snapshot th { text-transform: none; letter-spacing: normal; }

.market-snapshot thead th {
  height: 32px;
  background: var(--color-surface-variant);
  font-weight: 600;
  color: var(--color-heading);
}

.market-group th {
  color: var(--color-text-secondary);
  font-weight: 600;
  background: var(--color-surface-variant);
}

.market-snapshot .market-number,
.market-snapshot .market-date { text-align: right; white-space: nowrap; }

.market-date { color: var(--color-text-secondary); }
.market-trend { width: 90px; white-space: nowrap; }
.market-mobile-date { display: none; }

.market-instrument {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 7px;
  min-width: 0;
  min-height: 26px;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  color: var(--color-primary);
  font: inherit;
  cursor: pointer;
}

.market-instrument strong { font-weight: 650; }
.market-instrument span { color: var(--color-text); }
.market-instrument:hover strong { text-decoration: underline; }
.market-selected { background: var(--color-surface-variant); }
.market-selected th[scope="row"] { box-shadow: inset 2px 0 var(--color-primary); }

.market-note, .market-chart-heading p {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.market-note { padding: 6px 8px; }
.market-chart-panel { padding: 10px; }
.market-chart-heading { display: flex; justify-content: space-between; align-items: start; gap: 8px; }
.market-chart-heading h2 { font-size: 1rem; line-height: 1.25; font-weight: 650; }
.market-chart-quote { display: flex; flex-wrap: wrap; justify-content: end; gap: 4px 8px; font-variant-numeric: tabular-nums; }
.market-chart-quote strong { font-weight: 650; }
.market-chart-state { display: grid; place-items: center; min-height: 240px; color: var(--color-text-secondary); }

.market-gain { color: var(--finance-green); }
.market-loss { color: var(--finance-red); }
@media (prefers-color-scheme: dark) {
  .market-gain { color: #81c784; }
  .market-loss { color: #ff8a80; }
}

@media (max-width: 1040px) {
  .market-dashboard-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 560px) {
  .market-snapshot .market-trend, .market-snapshot .market-date { display: none; }
  .market-mobile-date { display: block; font-size: 0.6875rem; color: var(--color-text-secondary); }
  .market-instrument { flex-direction: column; justify-content: center; align-items: start; min-height: 38px; line-height: 1.25; }
  .market-instrument span { font-size: 0.75rem; }
  .market-chart-heading { flex-wrap: wrap; }
}
</style>
