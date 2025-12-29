<template>
    <div class="stock-chart-page">
        <!-- Stock Selection -->
        <div class="stock-selector-bar">
            <el-autocomplete
                v-model="selectedStockCode"
                :fetch-suggestions="querySearch"
                placeholder="Search stocks..."
                @select="handleStockSelect"
                @keyup.enter="handleStockChange"
                size="large"
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
                size="large"
                :disabled="!selectedStockCode">
                Load
            </el-button>
        </div>

        <div v-if="!loadedStockCode" class="empty-state-main">
            <el-icon><TrendCharts /></el-icon>
            <p>Search and select a stock to view details</p>
        </div>

        <!-- Main Content Layout -->
        <div v-else class="main-layout">
            <!-- Left: Chart Section -->
            <div class="chart-section">
                <!-- Stock Header -->
                <div class="stock-title-section">
                    <h1 class="company-name">{{ loadedStockName }}</h1>

                    <div v-if="latestPrice" class="price-section">
                        <div class="current-price">{{ formatCurrency(latestPrice.currentPrice) }}</div>
                        <div class="price-meta">
                            <span class="date-info">{{ formatDate(latestPrice.date) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Period Tabs -->
                <div class="period-tabs">
                    <button
                        v-for="period in ['1M', '6M', 'YTD', '1Y', '5Y', 'MAX']"
                        :key="period"
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
                        :height="400"
                        :show-data-zoom="true"
                        color="#d93025"
                        class="area-chart"
                    />
                </div>
            </div>

            <!-- Right: Info Panel -->
            <div class="info-panel">
                <div v-if="latestPrice" class="info-section">
                    <div class="info-row">
                        <span class="info-label">VOLUME</span>
                        <span class="info-value">{{ formatNumber(latestPrice.volume) }}</span>
                    </div>
                </div>

                <div v-if="companyData" class="info-section">
                    <div class="info-row">
                        <span class="info-label">MARKET CAP</span>
                        <span class="info-value">{{ formatLargeNumber(companyData.marketCapitalization) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">P/E RATIO</span>
                        <span class="info-value">{{ formatRatio(companyData.peRatio) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">DIVIDEND YIELD</span>
                        <span class="info-value">{{ formatPercent(companyData.dividendYield) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">52W HIGH</span>
                        <span class="info-value">{{ formatCurrency(companyData.weekHigh) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">52W LOW</span>
                        <span class="info-value">{{ formatCurrency(companyData.weekLow) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">EPS</span>
                        <span class="info-value">{{ formatCurrency(companyData.eps) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">BETA</span>
                        <span class="info-value">{{ formatRatio(companyData.beta) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">PROFIT MARGIN</span>
                        <span class="info-value">{{ formatPercent(companyData.profitMargin) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">REVENUE TTM</span>
                        <span class="info-value">{{ formatLargeNumber(companyData.revenueTTM) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ROE</span>
                        <span class="info-value">{{ formatPercent(companyData.returnOnEquityTTM) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">SECTOR</span>
                        <span class="info-value">{{ companyData.sector || 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">INDUSTRY</span>
                        <span class="info-value">{{ companyData.industry || 'N/A' }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AreaChart from "../components/charts/AreaChart.vue";
import { Loading, TrendCharts, Warning } from '@element-plus/icons-vue';
import ApiService from "@/core/services/apiService";
import { StockPriceClient, StockPriceDto, StockInfoClient, CompanyClient, CompanyDto } from "@/core/services/marketWatchClient";
import moment from 'moment';

const stockPriceClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
const stockInfoClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);
const companyClient = new CompanyClient(ApiService.baseUrl, ApiService.vueInstance.axios);

export default defineComponent({
    components: {
        AreaChart,
        Loading,
        TrendCharts,
        Warning
    },

    data() {
        return {
            selectedStockCode: '',
            loadedStockCode: '', // Track the stock code that's currently loaded in the chart
            selectedPeriod: '6M',
            loading: false,
            recentStocks: [] as Array<{ code: string, name: string }>,
            stockPrices: [] as StockPriceDto[],
            latestPrice: null as StockPriceDto | null,
            companyData: null as CompanyDto | null,
        };
    },

    computed: {
        loadedStockName(): string {
            if (!this.loadedStockCode) return '';
            const stock = this.recentStocks.find(s => s.code === this.loadedStockCode);
            return stock ? stock.name : this.loadedStockCode;
        },

        chartData(): any[] {
            if (this.stockPrices.length === 0) return [];

            const data = [['Date', 'Price']];

            // Data is sorted in ascending order before being passed to the chart
            for (const price of this.stockPrices) {
                const date = new Date(price.date!);
                data.push([
                    date,
                    price.currentPrice
                ]);
            }

            return data;
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
            if (!this.selectedStockCode) {
                return;
            }

            this.loading = true;
            try {
                const days = this.getPeriodDays();

                const endDate = moment().endOf('day').toDate();
                const startDate = this.selectedPeriod === 'MAX'
                    ? undefined
                    : (this.selectedPeriod === 'YTD'
                        ? moment().startOf('year').startOf('day').toDate()
                        : moment().subtract(days, 'days').startOf('day').toDate());

                const maxResultCount = this.selectedPeriod === 'MAX'
                    ? 1000
                    : Math.min(1000, days);

                let response = await stockPriceClient.stockPriceGetStockPriceWithDetails(
                    'date desc',
                    0,
                    maxResultCount,
                    this.selectedStockCode,
                    startDate,
                    endDate
                );

                // If there's no data in the requested window, fall back to latest N points (still keeps chart length correct).
                if ((response.items?.length ?? 0) === 0 && this.selectedPeriod !== 'MAX') {
                    response = await stockPriceClient.stockPriceGetStockPriceWithDetails(
                        'date desc',
                        0,
                        maxResultCount,
                        this.selectedStockCode,
                        undefined,
                        undefined
                    );
                }

                const rawPrices = (response.items ?? []) as StockPriceDto[];

                // Data from the backend is in descending order (newest first).
                // We need to reverse it for the chart to show oldest to newest.
                this.stockPrices = rawPrices.slice().reverse();

                this.latestPrice = this.stockPrices.length > 0
                    ? (this.stockPrices[this.stockPrices.length - 1] as StockPriceDto)
                    : null;

                this.loadedStockCode = this.selectedStockCode;

                // Fetch company financial data
                try {
                    console.log('Fetching company data for symbol:', this.selectedStockCode);
                    this.companyData = await companyClient.companyGetBySymbol(this.selectedStockCode);
                    console.log('Company data received:', this.companyData);
                } catch (error) {
                    console.error('Error loading company data:', error);
                    console.error('Error details:', JSON.stringify(error));
                    this.companyData = null;
                }
            } catch (error) {
                console.error('Error loading stock data:', error);
                this.stockPrices = [];
                this.latestPrice = null;
                this.companyData = null;
            } finally {
                this.loading = false;
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
            if (!value) return '$0.00';
            return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        },

        formatNumber(value: number | undefined): string {
            if (!value) return '0';
            return value.toLocaleString('en-US');
        },

        formatDate(date: Date | undefined): string {
            if (!date) return '';
            return moment(date).format('MMM DD, YYYY');
        },

        formatLargeNumber(value: number | undefined): string {
            if (!value) return 'N/A';
            if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
            if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
            if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
            return `$${value.toLocaleString('en-US')}`;
        },

        formatPercent(value: number | undefined): string {
            if (!value) return 'N/A';
            return `${(value * 100).toFixed(2)}%`;
        },

        formatRatio(value: number | undefined): string {
            if (!value) return 'N/A';
            return value.toFixed(2);
        }
    },

    mounted() {
        this.loadRecentStocks();
    }
});
</script>

<style scoped>
.stock-chart-page {
    max-width: 1600px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    background: #fff;
}

/* Stock Selector Bar */
.stock-selector-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e8eaed;
}

.stock-search-input {
    flex: 1;
    max-width: 500px;
}

.stock-option {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.stock-code {
    font-weight: 500;
    color: #202124;
    min-width: 60px;
}

.stock-name {
    color: #5f6368;
    font-size: 0.875rem;
}

/* Empty State */
.empty-state-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #5f6368;
}

.empty-state-main .el-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: #dadce0;
}

.empty-state-main p {
    font-size: 1rem;
    margin: 0;
}

/* Main Layout */
.main-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 2rem;
}

/* Chart Section (Left) */
.chart-section {
    min-width: 0;
}

.stock-title-section {
    margin-bottom: 1.5rem;
}

.company-name {
    font-size: 1.75rem;
    font-weight: 400;
    color: #202124;
    margin: 0 0 1rem 0;
    line-height: 1.3;
}

.price-section {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.current-price {
    font-size: 2.5rem;
    font-weight: 400;
    color: #202124;
    line-height: 1;
}

.price-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #5f6368;
    font-size: 0.875rem;
}

.date-info {
    color: #5f6368;
}

/* Period Tabs */
.period-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e8eaed;
    padding-bottom: 0;
}

.period-tab {
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    color: #5f6368;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    margin-bottom: -1px;
}

.period-tab:hover {
    color: #202124;
}

.period-tab.active {
    color: #1a73e8;
    border-bottom-color: #1a73e8;
}

/* Chart Wrapper */
.chart-wrapper {
    background: #fff;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    padding: 1rem;
    min-height: 450px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-state,
.empty-chart-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #5f6368;
}

.loading-state .el-icon,
.empty-chart-state .el-icon {
    font-size: 2.5rem;
    color: #dadce0;
}

.loading-state span,
.empty-chart-state p {
    font-size: 0.875rem;
    margin: 0;
}

.is-loading {
    animation: rotating 2s linear infinite;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Info Panel (Right) */
.info-panel {
    background: #fff;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    padding: 1.5rem;
    height: fit-content;
}

.info-section {
    padding: 0;
}

.info-section + .info-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e8eaed;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
}

.info-row + .info-row {
    border-top: 1px solid #f1f3f4;
}

.info-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #5f6368;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #202124;
    text-align: right;
}

/* Responsive */
@media (max-width: 1024px) {
    .main-layout {
        grid-template-columns: 1fr;
    }

    .info-panel {
        order: -1;
    }
}

@media (max-width: 768px) {
    .stock-chart-page {
        padding: 1rem;
    }

    .company-name {
        font-size: 1.5rem;
    }

    .current-price {
        font-size: 2rem;
    }

    .chart-wrapper {
        padding: 0.75rem;
        min-height: 350px;
    }

    .period-tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .period-tab {
        flex-shrink: 0;
    }
}
</style>
