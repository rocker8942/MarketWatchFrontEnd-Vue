<template>
    <div class="stock-chart-page">
        <div class="page-header">
            <h1>Stock Chart</h1>
            <p class="subtitle">Analyze stock price movements with interactive charts</p>
        </div>

        <div class="content-wrapper">
            <!-- Stock Selection -->
            <div class="control-section">
                <div class="stock-selector">
                    <label class="control-label">Select Stock</label>
                    <div class="input-row">
                        <el-autocomplete
                            v-model="selectedStockCode"
                            :fetch-suggestions="querySearch"
                            placeholder="Select or enter stock code"
                            @select="handleStockSelect"
                            @keyup.enter="handleStockChange"
                            size="large"
                            class="stock-input"
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
                            class="load-btn"
                            :disabled="!selectedStockCode">
                            Load Chart
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- Stock Name and Info -->
            <div v-if="loadedStockCode && latestPrice" class="stock-display-section">
                <div class="stock-header">
                    <h2 class="stock-name">{{ loadedStockName }}</h2>
                    <span class="stock-code-badge">{{ loadedStockCode }}</span>
                </div>

                <div class="stock-info-card">
                    <div class="info-item">
                        <span class="info-label">Current Price</span>
                        <span class="info-value price">{{ formatCurrency(latestPrice.currentPrice) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Volume</span>
                        <span class="info-value">{{ formatNumber(latestPrice.volume) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date</span>
                        <span class="info-value">{{ formatDate(latestPrice.date) }}</span>
                    </div>
                </div>
            </div>

            <!-- Period Controls -->
            <div v-if="loadedStockCode" class="period-selector">
                <el-radio-group v-model="selectedPeriod" @change="handlePeriodChange" size="large" class="period-buttons">
                    <el-radio-button label="1M">1M</el-radio-button>
                    <el-radio-button label="6M">6M</el-radio-button>
                    <el-radio-button label="YTD">YTD</el-radio-button>
                    <el-radio-button label="1Y">1Y</el-radio-button>
                    <el-radio-button label="5Y">5Y</el-radio-button>
                    <el-radio-button label="MAX">MAX</el-radio-button>
                </el-radio-group>
            </div>

            <!-- Chart Container -->
            <div class="chart-container">
                <div v-if="loading" class="loading-state">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>Loading chart data...</span>
                </div>
                <div v-else-if="!loadedStockCode" class="empty-state">
                    <el-icon><TrendCharts /></el-icon>
                    <p>Select a stock to view the chart</p>
                </div>
                <div v-else-if="chartData.length === 0" class="empty-state">
                    <el-icon><Warning /></el-icon>
                    <p>No data available for this stock</p>
                </div>
                <AreaChart
                    v-else
                    :data="chartData"
                    :height="450"
                    :show-data-zoom="true"
                    color="#22c55e"
                    class="area-chart"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AreaChart from "../components/charts/AreaChart.vue";
import { Loading, TrendCharts, Warning } from '@element-plus/icons-vue';
import ApiService from "@/core/services/apiService";
import { StockPriceClient, StockPriceDto, StockInfoClient } from "@/core/services/marketWatchClient";
import moment from 'moment';

const stockPriceClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
const stockInfoClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);

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
                const cutoffDate = moment().subtract(days, 'days').format('YYYY-MM-DD');

                // Fetch the latest records for the stock (max 1000 due to ABP validation)
                const response = await stockPriceClient.stockPriceGetStockPriceWithDetails(
                    'date desc',
                    0,
                    1000, // ABP default max limit
                    this.selectedStockCode
                );

                if (response.items && response.items.length > 0) {
                    // Filter by cutoff date
                    const filteredPrices = response.items.filter(item =>
                        item.date && new Date(item.date) >= new Date(cutoffDate)
                    ) as StockPriceDto[];

                    // If not enough data for the requested period, use all available data
                    const rawPrices = filteredPrices.length > 0
                        ? filteredPrices
                        : response.items as StockPriceDto[];
                    
                    // Data from the backend is in descending order (newest first).
                    // We need to reverse it for the chart to show oldest to newest.
                    this.stockPrices = rawPrices.slice().reverse();

                    // Get the last item (which is now the latest price) for the display card.
                    this.latestPrice = this.stockPrices[this.stockPrices.length - 1] as StockPriceDto;
                    this.loadedStockCode = this.selectedStockCode;
                } else {
                    this.stockPrices = [];
                    this.latestPrice = null;
                }
            } catch (error) {
                console.error('Error loading stock data:', error);
                this.stockPrices = [];
                this.latestPrice = null;
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
        }
    },

    mounted() {
        this.loadRecentStocks();
    }
});
</script>

<style scoped>
.stock-chart-page {
    padding: var(--space-4xl) var(--space-xl);
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
}

.subtitle {
    font-size: 1rem;
    color: var(--color-text-secondary);
    margin: 0;
}

.content-wrapper {
    background: var(--color-background-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 16px;
    padding: var(--space-3xl);
    box-shadow: var(--shadow-subtle);
}

/* Control Section */
.control-section {
    margin-bottom: 2rem;
}

.stock-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 300px;
}

.period-selector {
    margin-bottom: 1rem;
    padding: 0.5rem 0;
}

.input-row {
    display: flex;
    gap: 0.75rem;
}

.control-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.stock-input {
    flex: 1;
    max-width: 400px;
}

.load-btn {
    min-width: 120px;
}

.stock-option {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.stock-code {
    font-weight: 600;
    color: var(--color-primary);
    min-width: 80px;
}

.stock-name {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
}

/* Stock Display Section */
.stock-display-section {
    margin-bottom: 2rem;
}

.stock-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.stock-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-heading);
    margin: 0;
}

.stock-code-badge {
    font-size: 0.875rem;
    font-weight: 600;
    color: #3b82f6;
    background: #eff6ff;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
}

/* Stock Info Card - Minimalist */
.stock-info-card {
    display: flex;
    gap: var(--space-xl);
    padding: var(--space-2xl);
    background: var(--color-primary);
    border-radius: 12px;
    color: white;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.9;
}

.info-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.info-value.price {
    font-size: 2rem;
}

/* Chart Container */
.chart-container {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.google-chart {
    width: 100%;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--color-text-secondary);
}

.loading-state .el-icon,
.empty-state .el-icon {
    font-size: 3rem;
}

.loading-state span,
.empty-state p {
    font-size: 1rem;
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

/* Responsive */
@media (max-width: 768px) {
    .stock-chart-page {
        padding: 1.5rem 1rem;
    }

    .page-header h1 {
        font-size: 1.75rem;
    }

    .content-wrapper {
        padding: 1.5rem;
    }

    .control-section {
        flex-direction: column;
        gap: 1.5rem;
    }

    .stock-selector {
        min-width: 100%;
    }

    .input-row {
        flex-direction: column;
    }

    .stock-input {
        max-width: 100%;
    }

    .load-btn {
        width: 100%;
    }

    .stock-info-card {
        flex-direction: column;
        gap: 1rem;
    }

    .chart-container {
        padding: 1rem;
    }

    :deep(.google-chart svg) {
        width: 100% !important;
        height: auto !important;
    }
}

@media (min-width: 1024px) {
    .stock-chart-page {
        padding: 3rem 2rem;
    }
}

/* Element Plus customization */
:deep(.el-radio-button__inner) {
    padding: 0.5rem 1rem;
}

:deep(.el-select) {
    width: 100%;
}

/* Period buttons styling - minimal design matching reference */
.period-buttons {
    background: transparent;
    border: none;
}

:deep(.period-buttons .el-radio-button) {
    border: none;
    margin: 0 0.25rem;
}

:deep(.period-buttons .el-radio-button__inner) {
    border: none;
    background: transparent;
    color: #6b7280;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: none;
    transition: all 0.2s;
}

:deep(.period-buttons .el-radio-button__inner:hover) {
    color: #1f2937;
    background: transparent;
}

:deep(.period-buttons .el-radio-button.is-active .el-radio-button__inner) {
    color: #3b82f6;
    background: transparent;
    border-bottom: 2px solid #3b82f6;
    border-radius: 0;
}

:deep(.period-buttons .el-radio-button:first-child .el-radio-button__inner) {
    border-radius: 0;
}

:deep(.period-buttons .el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0;
}
</style>
