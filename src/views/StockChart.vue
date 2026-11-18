<template>
    <div class="data-workspace stock-chart-page">
        <header class="stock-header">
            <div class="stock-heading">
                <h1>{{ loadedStockName || "Stock Chart" }}</h1>
                <div v-if="loadedStockCode" class="quote-line">
                    <span class="quote-symbol">{{ loadedStockCode }}</span>
                    <template v-if="latestPrice">
                        <strong>{{ formatCurrency(latestPrice.currentPrice) }}</strong>
                        <span :class="quoteChangeClass" title="Change from the previous recorded close">{{ quoteChangeText }}</span>
                        <span class="quote-date">{{ formatDate(latestPrice.date) }}</span>
                    </template>
                </div>
            </div>
            <div class="stock-selector-bar">
                <el-autocomplete
                    v-model="selectedStockCode"
                    :disabled="refreshing || analysisUpdating"
                    :fetch-suggestions="querySearch"
                    placeholder="Symbol or company"
                    aria-label="Stock symbol or company"
                    @select="handleStockSelect"
                    @keyup.enter="handleStockChange"
                    size="default"
                    class="stock-search-input"
                    clearable
                    :trigger-on-focus="true"
                    value-key="code">
                    <template #default="{ item }">
                        <div class="stock-option">
                            <span class="stock-code">{{ item.code }}</span>
                            <span class="stock-name">{{ item.name }}</span>
                        </div>
                    </template>
                </el-autocomplete>
                <el-button
                    type="primary"
                    @click="handleStockChange"
                    size="default"
                    :disabled="!selectedStockCode || refreshing || analysisUpdating">
                    Load
                </el-button>
            </div>
        </header>
        <details class="stock-data-tools">
            <summary>
                Data maintenance
                <span v-if="refreshing || analysisUpdating" class="maintenance-status" role="status">
                    {{ refreshing ? krxProgress || "Refreshing prices…" : "Updating analysis…" }}
                </span>
            </summary>
            <div v-if="loadedStockCode" class="stock-data-actions">
                <!-- Refresh mode selector -->
                <el-select v-model="refreshSource" aria-label="Price data source" size="default"
                    @change="refreshMode = 'recent'"
                    :disabled="refreshing || analysisUpdating" class="refresh-source">
                    <el-option label="Yahoo Finance" value="Yahoo" />
                    <el-option label="Naver (Korea)" value="Naver" :disabled="!supportsNaver" />
                    <el-option label="KRX (unadjusted)" value="KRX" :disabled="!supportsNaver" />
                </el-select>
                <el-select
                    v-model="refreshMode"
                    :disabled="refreshing || analysisUpdating"
                    size="default"
                    class="refresh-range"
                    aria-label="History to refresh">
                    <el-option label="Last 30 Days" value="recent" />
                    <el-option label="Last 90 Days" value="90" />
                    <el-option label="Last Year" value="365" />
                    <el-option label="Last 5 Years" value="1826" :disabled="refreshSource === 'KRX'" />
                    <el-option :label="refreshSource === 'KRX' ? 'Maximum Available (since 2010)' : refreshSource === 'Naver' ? 'Maximum Available (3,000 sessions)' : 'All History'" value="full" />
                </el-select>

                <!-- Refresh button -->
                <el-button
                    type="primary"
                    plain
                    @click="refreshStockPrice"
                    :disabled="refreshing || analysisUpdating"
                    size="default">
                    <el-icon :class="{ 'is-loading': refreshing }">
                        <Loading v-if="refreshing" />
                        <Refresh v-else />
                    </el-icon>
                    Refresh Data
                </el-button>
                <template v-if="refreshing && refreshSource === 'KRX' && refreshMode === 'full'">
                    <span role="status" aria-live="polite">{{ krxProgress || 'Starting KRX history…' }}</span>
                    <el-button @click="stopKrxRefresh = true" :disabled="stopKrxRefresh">
                        {{ stopKrxRefresh ? 'Stopping after batch…' : 'Stop after batch' }}
                    </el-button>
                </template>

                <!-- Yahoo Finance link -->
                <el-button
                    type="primary"
                    link
                    @click="openYahooFinance"
                    class="yahoo-link">
                    <el-icon><Link /></el-icon>
                    Yahoo Finance
                </el-button>
            </div>
            <AnalysisUpdatePanel :client="analysisClient" :disabled="refreshing" @busy-change="analysisUpdating = $event" />
        </details>

        <div v-if="!loadedStockCode" class="empty-state-main">
            <el-icon><TrendCharts /></el-icon>
            <p>Search and select a stock to view details</p>
        </div>

        <!-- Main Content Layout -->
        <div v-else class="main-layout">
            <!-- Left: Chart Section -->
            <div class="chart-section">
                <!-- Period Tabs -->
                <div class="period-tabs" role="group" aria-label="Chart period">
                    <button
                        v-for="period in ['1M', '6M', 'YTD', '1Y', '5Y', 'MAX']"
                        :key="period"
                        type="button"
                        :aria-pressed="selectedPeriod === period"
                        :class="['period-tab', { active: selectedPeriod === period }]"
                        @click="selectedPeriod = period; handlePeriodChange()">
                        {{ period }}
                    </button>
                </div>

                <!-- Chart -->
                <div class="chart-wrapper">
                    <div v-if="loading" class="loading-state">
                        <el-icon class="is-loading"><Loading /></el-icon>
                        <span>Loading...</span>
                    </div>
                    <div v-else-if="chartData.length === 0" class="empty-chart-state">
                        <el-icon><Warning /></el-icon>
                        <p>No data available</p>
                    </div>
                    <AreaChart
                        v-else
                        :data="chartData"
                        :price-currency="latestPrice?.currencyCode ?? null"
                        :height="400"
                        :show-data-zoom="true"
                        color="#1976d2"
                        class="area-chart"
                    />
                </div>
            </div>

            <!-- Right: Info Panel -->
            <aside v-if="latestPrice || companyData" class="info-panel" aria-labelledby="fundamentals-heading">
                <h2 id="fundamentals-heading">Fundamentals</h2>
                <div v-if="latestPrice" class="info-section">
                    <div class="info-row">
                        <span class="info-label">Volume</span>
                        <span class="info-value">{{ formatNumber(latestPrice.volume) }}</span>
                    </div>
                </div>

                <div v-if="companyData" class="info-section">
                    <div class="info-row">
                        <span class="info-label">Market cap</span>
                        <span class="info-value" :title="formatFinancialCurrency(companyData.marketCapitalization)">{{ formatLargeNumber(companyData.marketCapitalization) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">P/E ratio</span>
                        <span class="info-value">{{ formatRatio(companyData.peRatio) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Dividend yield</span>
                        <span class="info-value">{{ formatPercent(companyData.dividendYield) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">52-week high</span>
                        <span class="info-value">{{ formatCurrency(companyData.weekHigh) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">52-week low</span>
                        <span class="info-value">{{ formatCurrency(companyData.weekLow) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">EPS</span>
                        <span class="info-value">{{ formatFinancialCurrency(companyData.eps) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Beta</span>
                        <span class="info-value">{{ formatRatio(companyData.beta) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Profit margin</span>
                        <span class="info-value">{{ formatPercent(companyData.profitMargin) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Revenue (TTM)</span>
                        <span class="info-value" :title="formatFinancialCurrency(companyData.revenueTTM)">{{ formatLargeNumber(companyData.revenueTTM) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ROE</span>
                        <span class="info-value">{{ formatPercent(companyData.returnOnEquityTTM) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Sector</span>
                        <span class="info-value">{{ companyData.sector || 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Industry</span>
                        <span class="info-value">{{ companyData.industry || 'N/A' }}</span>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { stockPriceRefreshErrorMessage } from '@/core/services/stockPriceRefreshError';
import { refreshPrice, refreshKrxMaximum, supportsNaver } from '@/core/services/stockPriceRefresh';
import AreaChart from "../components/charts/AreaChart.vue";
import AnalysisUpdatePanel from '@/components/AnalysisUpdatePanel.vue';
import { Loading, TrendCharts, Warning, Link, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ApiService from "@/core/services/apiService";
import { StockPriceClient, StockPriceDto, StockInfoClient, CompanyClient, CompanyDto } from "@/core/services/marketWatchClient";
import moment from 'moment';
import { currencyLabel, formatStockPrice } from '@/core/services/stockCurrency';
import { buildStockChartData, MOVING_AVERAGE_DAYS } from '@/core/services/stockChartData';

const stockPriceClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
const stockInfoClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });
const signedPercent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2, minimumFractionDigits: 2, signDisplay: "exceptZero" });
const companyClient = new CompanyClient(ApiService.baseUrl, ApiService.vueInstance.axios);

export default defineComponent({
    components: {
        AnalysisUpdatePanel,
        AreaChart,
        Loading,
        TrendCharts,
        Warning,
        Link,
        Refresh
    },

    data() {
        return {
            selectedStockCode: '',
            stockLoadVersion: 0,
            loadedStockCode: '', // Track the stock code that's currently loaded in the chart
            selectedPeriod: '6M',
            loading: false,
            refreshing: false,
            analysisUpdating: false,
            stopKrxRefresh: false,
            krxProgress: '',
            refreshMode: 'recent' as 'recent' | '90' | '365' | '1826' | 'full',
            refreshSource: 'Yahoo' as 'Yahoo' | 'Naver' | 'KRX',
            recentStocks: [] as Array<{ code: string, name: string }>,
            stockPrices: [] as StockPriceDto[],
            movingAverageHistory: [] as StockPriceDto[],
            latestPrice: null as StockPriceDto | null,
            companyData: null as CompanyDto | null,
        };
    },

    computed: {
        analysisClient() { return ApiService.vueInstance.axios; },
        supportsNaver(): boolean {
            return supportsNaver(this.loadedStockCode || '');
        },
        loadedStockName(): string {
            if (!this.loadedStockCode) return '';
            const stock = this.recentStocks.find(s => s.code === this.loadedStockCode);
            return stock ? stock.name : this.loadedStockCode;
        },

        quoteChange(): number | null {
            const latest = this.latestPrice;
            if (!latest?.date || !Number.isFinite(latest.date.getTime())
                || typeof latest.currentPrice !== "number" || !Number.isFinite(latest.currentPrice)) return null;
            const latestDate = latest.date.toISOString().slice(0, 10);
            const previous = [...this.movingAverageHistory, ...this.stockPrices].reverse().find(row =>
                row.date && Number.isFinite(row.date.getTime()) && row.date.toISOString().slice(0, 10) < latestDate
            );
            if (!previous || previous.currencyCode !== latest.currencyCode || typeof previous.currentPrice !== "number"
                || !Number.isFinite(previous.currentPrice) || previous.currentPrice <= 0) return null;
            const change = latest.currentPrice / previous.currentPrice - 1;
            return Number.isFinite(change) ? change : null;
        },
        quoteChangeText(): string {
            return this.quoteChange === null ? "Change unavailable" : signedPercent.format(this.quoteChange);
        },
        quoteChangeClass(): string {
            if (this.quoteChange === null || Math.abs(this.quoteChange) < 0.00005) return "quote-date";
            return this.quoteChange > 0 ? "quote-gain" : "quote-loss";
        },

        chartData(): any[] {
            const [header, ...sessions] = buildStockChartData(this.stockPrices, this.movingAverageHistory);
            if (!header) return [];
            return [header, ...sessions.map(([date, ...values]) => [
                Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '',
                ...values,
            ])];
        }
    },

    methods: {
        async loadRecentStocks() {
            try {
                console.log('Loading all stocks...');
                // Get all available stock codes from StockInfo
                const response = await stockInfoClient.stockInfoGetList(
                    'name asc',
                    0,
                    1000 // Get all stocks
                );

                console.log('Stock response:', response);

                // Map to autocomplete format with id as code and name
                this.recentStocks = response.items?.map(item => ({
                    code: item.id || '',
                    name: item.name || ''
                })) || [];

                console.log('All stocks loaded:', this.recentStocks.length, this.recentStocks);
            } catch (error) {
                console.error('Error loading stocks:', error);
            }
        },

        async loadStockData() {
            const code = this.selectedStockCode;
            if (!code) return;
            const version = ++this.stockLoadVersion;
            const isCurrent = () => version === this.stockLoadVersion && code === this.selectedStockCode;
            const period = this.selectedPeriod;
            this.loading = true;
            this.stockPrices = [];
            this.latestPrice = null;
            this.companyData = null;
            this.movingAverageHistory = [];
            try {
                const days = this.getPeriodDays();
                const endDate = moment().endOf('day').toDate();
                const startDate = period === 'MAX' ? undefined : (period === 'YTD'
                    ? moment().startOf('year').startOf('day').toDate()
                    : moment().subtract(days, 'days').startOf('day').toDate());
                const maxResultCount = period === 'MAX' ? 100000 : Math.min(1000, days);
                let response = await stockPriceClient.stockPriceGetStockPriceWithDetails(
                    'date desc', 0, maxResultCount, code, startDate, endDate);
                if (!isCurrent()) return;
                if ((response.items?.length ?? 0) === 0 && period !== 'MAX') {
                    response = await stockPriceClient.stockPriceGetStockPriceWithDetails(
                        'date desc', 0, maxResultCount, code, undefined, undefined);
                    if (!isCurrent()) return;
                }
                const prices = ((response.items ?? []) as StockPriceDto[]).slice().reverse();
                let history: StockPriceDto[] = [];
                if (prices.length > 0 && period !== 'MAX') {
                    const historyEnd = new Date(new Date(prices[0].date!).getTime() - 1);
                    const previous = await stockPriceClient.stockPriceGetStockPriceWithDetails(
                        'date desc', 0, MOVING_AVERAGE_DAYS - 1, code, undefined, historyEnd);
                    if (!isCurrent()) return;
                    history = (previous.items ?? []).slice().reverse();
                }
                this.stockPrices = prices;
                this.movingAverageHistory = history;
                this.latestPrice = prices.length ? prices[prices.length - 1] : null;
                this.loadedStockCode = code;
                try {
                    const company = await companyClient.companyGetBySymbol(code);
                    if (isCurrent()) this.companyData = company;
                } catch (error) {
                    if (isCurrent()) this.companyData = null;
                    console.error('Error loading company data:', error);
                }
            } catch (error) {
                console.error('Error loading stock data:', error);
                if (isCurrent()) {
                    this.stockPrices = [];
                    this.movingAverageHistory = [];
                    this.latestPrice = null;
                    this.companyData = null;
                }
            } finally {
                if (version === this.stockLoadVersion) this.loading = false;
            }
        },

        getPeriodDays(): number {
            const periodMap: Record<string, number> = {
                '1D': 1,
                '5D': 5,
                '1M': 30,
                '6M': 180,
                'YTD': this.getYearToDateDays(),
                '1Y': 365,
                '5Y': 1825,
                'MAX': 36500 // 100 years - effectively all data
            };
            return periodMap[this.selectedPeriod] || 180;
        },

        getYearToDateDays(): number {
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const diff = today.getTime() - startOfYear.getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        },

        querySearch(queryString: string, cb: any) {
            const results = queryString
                ? this.recentStocks.filter(stock =>
                    stock.code.toLowerCase().includes(queryString.toLowerCase()) ||
                    stock.name.toLowerCase().includes(queryString.toLowerCase())
                )
                : this.recentStocks;
            cb(results);
        },

        handleStockSelect(item: any) {
            console.log('Stock selected:', item);
            this.selectedStockCode = item.code;
        },

        handleStockChange() {
            console.log('Stock changed to:', this.selectedStockCode);
            this.loadStockData();
        },

        handlePeriodChange() {
            console.log('Period changed to:', this.selectedPeriod);
            this.loadStockData();
        },

        formatCurrency(value: number | undefined): string {
            return formatStockPrice(value, this.latestPrice?.currencyCode);
        },

        formatFinancialCurrency(value: number | undefined): string {
            return formatStockPrice(value, this.companyData?.currency);
        },

        formatNumber(value: number | undefined): string {
            if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
            return value.toLocaleString('en-US');
        },

        formatDate(date: Date | undefined): string {
            if (!date) return '';
            return moment.utc(date).format('MMM DD, YYYY');
        },

        formatLargeNumber(value: number | undefined): string {
            if (typeof value !== "number" || !Number.isFinite(value)) return "—";
            const label = currencyLabel(this.companyData?.currency);
            const number = compactNumber.format(value);
            return label === "currency unknown" ? number + " (currency unknown)" : label + " " + number;
        },

        formatPercent(value: number | undefined): string {
            if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
            return `${(value * 100).toFixed(2)}%`;
        },

        formatRatio(value: number | undefined): string {
            if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
            return value.toFixed(2);
        },

        openYahooFinance() {
            if (this.loadedStockCode) {
                window.open(`https://au.finance.yahoo.com/quote/${encodeURIComponent(this.loadedStockCode)}`, '_blank', 'noopener');
            }
        },

        async refreshStockPrice() {
            if (!this.loadedStockCode) {
                ElMessage.warning('No stock selected');
                return;
            }

            if ((this.refreshSource === 'Naver' || this.refreshSource === 'KRX') && !this.supportsNaver) {
                this.refreshSource = 'Yahoo';
                ElMessage.warning('Naver and KRX support Korean .KS/.KQ stocks only. Select Yahoo Finance for this stock.');
                return;
            }
            this.refreshing = true;
            this.stopKrxRefresh = false;
            this.krxProgress = '';
            try {
                const isFullHistory = this.refreshMode === 'full';
                const days = this.refreshMode === 'recent' || isFullHistory ? 30 : Number(this.refreshMode);

                console.log(`Refreshing stock price for: ${this.loadedStockCode}, mode: ${this.refreshMode}`);

                // For full history, create a custom axios instance with extended timeout
                let response;
                if (isFullHistory || days > 365 || this.refreshSource === 'KRX') {
                    // Get the current access token
                    const token = this.$oidc.accessToken;

                    // Create temporary client with 3-minute timeout and auth token
                    const customAxios = ApiService.vueInstance.axios.create({
                        baseURL: ApiService.baseUrl,
                        timeout: 180000, // 3 minutes
                        headers: {
                            ...ApiService.vueInstance.axios.defaults.headers.common,
                            Authorization: `Bearer ${token}`
                        }
                    });

                    customAxios.interceptors.request.use(config => {
                        config.headers.Authorization = `Bearer ${this.$oidc.accessToken}`;
                        return config;
                    });
                    if (this.refreshSource === 'KRX' && isFullHistory) {
                        response = await refreshKrxMaximum(customAxios, this.loadedStockCode,
                            progress => { this.krxProgress = `${progress.completed}/${progress.total} batches, through ${progress.endDate}: ${progress.recordsUpdated} records updated`; },
                            () => this.stopKrxRefresh);
                        if (response.stopped) {
                            ElMessage.info(`KRX refresh stopped. ${response.recordsUpdated} records updated; completed batches remain saved.`);
                            await this.loadStockData();
                            return;
                        }
                    } else {
                        response = await refreshPrice(customAxios, this.loadedStockCode, this.refreshSource, isFullHistory, days);
                    }
                } else {
                    // Use standard client with default timeout
                    response = await refreshPrice(ApiService.vueInstance.axios, this.loadedStockCode, this.refreshSource, false, days);
                }

                console.log('Refresh response:', response);

                if (response.success) {
                    const modeText = isFullHistory ? (this.refreshSource === 'KRX' ? 'available KRX history since 2010' : this.refreshSource === 'Naver' ? 'available Naver history (up to 3,000 sessions)' : 'full historical') : `${days}-day`;
                    ElMessage.success({
                        message: `Successfully refreshed ${response.recordsUpdated} ${modeText} price records for ${this.loadedStockCode}`,
                        duration: 4000
                    });

                    // Reload the chart data after successful refresh
                    await this.loadStockData();
                } else {
                    ElMessage.error(response.message || 'Failed to refresh stock price data');
                }
            } catch (error: any) {
                console.error('Error refreshing stock price:', error);

                // Detect timeout specifically
                if (error.code === 'ECONNABORTED') {
                    const modeText = this.refreshMode === 'full' ? 'Full history' : 'Data';
                    ElMessage.error(`${modeText} refresh timed out. Please try again.`);
                } else {
                    ElMessage.error(stockPriceRefreshErrorMessage(error));
                }
            } finally {
                this.refreshing = false;
            }
        }
    },

    beforeUnmount() {
        this.stopKrxRefresh = true;
    },

    mounted() {
        this.loadRecentStocks();

        // Auto-load stock if stockCode is provided in query params
        const stockCode = this.$route.query.stockCode;
        if (stockCode) {
            this.selectedStockCode = String(stockCode);
            this.loadStockData();
        }
    }
});
</script>

<style scoped>
.stock-header, .stock-selector-bar, .quote-line, .stock-option, .stock-data-actions, .period-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stock-header {
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.stock-heading, .stock-search-input { min-width: 0; }
.stock-heading h1 { font-size: 1.375rem; line-height: 1.25; font-weight: 650; overflow-wrap: anywhere; }
.stock-selector-bar { flex: 0 1 332px; max-width: 100%; }
.stock-search-input { flex: 1; }
.stock-option .stock-code, .quote-symbol { color: var(--color-primary); font-weight: 650; }
.stock-option .stock-name, .quote-date { color: var(--color-text-secondary); }
.quote-line { flex-wrap: wrap; font-size: 0.8125rem; font-variant-numeric: tabular-nums; margin-top: 4px; }
.quote-line strong { font-size: 1.125rem; font-weight: 650; color: var(--color-heading); overflow-wrap: anywhere; }
.quote-gain { color: var(--finance-green); }
.quote-loss { color: var(--finance-red); }

.stock-data-tools {
    min-width: 0;
    margin-bottom: 10px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-surface);
}

.stock-data-tools summary { padding: 4px 10px; cursor: pointer; color: var(--color-text-secondary); }
.maintenance-status { margin-left: 8px; overflow-wrap: anywhere; }
.stock-data-actions { flex-wrap: wrap; padding: 4px 10px 8px; }
.stock-data-actions .el-button { margin-left: 0; }
.refresh-source { width: 148px; max-width: 100%; }
.refresh-range { width: 204px; max-width: 100%; }
.stock-data-tools :deep(.analysis-update) { margin: 0; padding: 8px 10px; border: 0; border-top: 1px solid var(--color-border); }

.empty-state-main, .loading-state, .empty-chart-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--color-text-secondary);
}

.empty-state-main { min-height: 150px; }
.main-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(232px, 294px); gap: 12px; }
.chart-section, .info-panel { min-width: 0; }
.period-tabs { flex-wrap: wrap; gap: 2px; margin-bottom: 6px; }
.period-tab {
    min-height: 32px;
    padding: 4px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--color-text-secondary);
    font: inherit;
    cursor: pointer;
}
.period-tab:hover { color: var(--color-heading); }
.period-tab.active { color: var(--color-primary); border-color: var(--color-border); background: var(--color-surface-variant); }

.chart-wrapper, .info-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 8px;
}

.chart-wrapper { min-height: 320px; display: grid; grid-template-columns: minmax(0, 1fr); }
.info-panel { align-self: start; padding: 8px 10px; }
.info-panel h2 { font-size: 0.9375rem; line-height: 1.4; font-weight: 650; padding-bottom: 4px; }
.info-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    gap: 8px;
    align-items: baseline;
    padding: 5px 0;
    border-top: 1px solid var(--color-border-subtle);
    font-size: 0.8125rem;
}
.info-label { color: var(--color-text-secondary); }
.info-value { color: var(--color-heading); text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }

@media (prefers-color-scheme: dark) {
    .quote-gain { color: #81c784; }
    .quote-loss { color: #ff8a80; }
}

@media (max-width: 860px) {
    .main-layout { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 560px) {
    .stock-selector-bar { flex-basis: 100%; }
    .stock-data-tools summary { padding-block: 8px; }
    .period-tab { min-height: 38px; padding-inline: 8px; }
    .chart-wrapper { padding: 4px; }
}
</style>
